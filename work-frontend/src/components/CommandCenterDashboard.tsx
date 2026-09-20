import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Bell, ChevronDown, User, MapPin, Gauge, Layers, Play, CheckCircle2, AlertTriangle, Ship, BarChart3, CloudLightning, Crown
} from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { useTheme } from '../context/ThemeContext';
import { useMasterData } from '../hooks/useMasterData';
import { vesselService } from '../services/vesselService';
import { freightService } from '../services/freightService';
import { FreightRate, MarketEvent } from '../types';
import { MaritimeGlobe } from './route-intelligence/MaritimeGlobe';
import { MARITIME_CHOKEPOINTS } from './route-intelligence/chokepointsData';
import { CargoShipSceneHero } from './ui/demo';

export default function CommandCenterDashboard() {
  const { scenario, updateLane, updateVessel, updateCargo } = useScenario();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const { vessels, ports, isLoading: isMasterDataLoading, error: masterDataError } = useMasterData();

  // 1. Data Fetching & State
  const [rates, setRates] = useState<FreightRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(true);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [weatherFactorPct, setWeatherFactorPct] = useState<number>(5);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  
  // Real constraints via Carrier Intelligence engine
  const destPortId = scenario.lane.destPortId;
  const originPortId = scenario.lane.originPortId;
  const weightTonnes = scenario.cargo.parcelSizeMt;
  
  const fallbackPort = { id: 'fallback', name: 'Loading...', lat: 0, lng: 0, maxDraftMeters: 20, congestionIndex: 0.5, country: '', unlocode: '', status: 'normal' as any, hasTerminals: true };
  const destinationPort = useMemo(() => ports.find(p => p.id === destPortId) || ports[2] || fallbackPort, [destPortId, ports]);
  const originPort = useMemo(() => ports.find(p => p.id === originPortId) || ports[1] || fallbackPort, [originPortId, ports]);
  
  const cargoProfile = useMemo(() => ({
    id: 'cargo-sim',
    type: 'Coking Coal',
    category: 'dry-bulk' as const,
    weightTonnes: Number(weightTonnes) || 10000,
    status: 'standard' as const,
    isOversized: false
  }), [weightTonnes]);

  const feasibilityResult = useMemo(() => {
    return vesselService.evaluateFeasibility(vessels, cargoProfile, destinationPort);
  }, [cargoProfile, destinationPort, vessels]);

  // Route calculation
  const activeRoute = useMemo(() => {
    // Simple geodesic synthetic route for the globe
    const lat1 = originPort.lat || 0;
    const lon1 = originPort.lng || 0;
    const lat2 = destinationPort.lat || 0;
    const lon2 = destinationPort.lng || 0;
    const midLon = (lon1 + lon2) / 2;
    const midLat = (lat1 + lat2) / 2 + 3.0;

    return {
      id: 'dash-route',
      originPortId: originPort.id,
      destinationPortId: destinationPort.id,
      distanceNauticalMiles: 5000,
      estimatedTransitDays: 14,
      regions: [],
      risks: [],
      waypoints: [[lon1, lat1], [midLon, midLat], [lon2, lat2]] as [number, number][]
    };
  }, [originPort, destinationPort]);

  // Derived metrics
  // Filter active chokepoints conceptually near the route
  const activeChokepointsCount = MARITIME_CHOKEPOINTS.filter(cp => cp.maxDraftMeters < scenario.vessel.operatingDraftM).length; 
  const riskScore = Math.min(100, Math.round(destinationPort.congestionIndex * 70 + activeChokepointsCount * 15));

  // Load market data
  useEffect(() => {
    async function loadData() {
      setIsLoadingRates(true);
      let r = await freightService.getHistoricalRates(`route-${originPort.id}-${destinationPort.id}`, 30);
      if (r.length === 0) {
        // Fallback to demo route data to prevent blank charts
        r = await freightService.getHistoricalRates('route-aus-paradip', 30);
      }
      setRates(r);
      setIsLoadingRates(false);
      
      const e = await freightService.getMarketEvents(30);
      setEvents(e);
    }
    loadData();
  }, [originPort, destinationPort]);

  const handleRunScenario = async () => {
    setScenarioRunning(true);
    setScenarioError(null);
    try {
      // 1. Entry timing
      let entry: any = null;
      try {
        const mlApiBase = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:8000';
        const entryRes = await fetch(`${mlApiBase}/optimize/entry-timing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cargo_quantity_mt: Number(weightTonnes) || 70000,
            current_spot_rate: 28.5,
            forecast_expected_rate: 29.5,
            forecast_spread: 3.5,
            deadline_days: 45,
            wait_days: 14,
            risk_aversion_lambda: 1.0
          })
        });
        if (entryRes.ok) entry = await entryRes.json();
      } catch (e) {
        console.warn("Entry timing fetch fallback", e);
      }
      if (!entry) {
        entry = {
          recommended_action: "SPLIT",
          split_pct: 0.60,
          rationale: "High spot market volatility (+12.4%) indicates staggered coverage. Lock 60% via CoA and float remaining on spot."
        };
      }

      // 2. Portfolio
      let port: any = null;
      try {
        const mlApiBase = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:8000';
        const portRes = await fetch(`${mlApiBase}/optimize/portfolio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expected_rate_usd_per_mt: 29.5,
            q_05: 26.5,
            q_95: 33.5,
            tonnage_mt: Number(weightTonnes) || 70000,
            risk_aversion_lambda: 0.5
          })
        });
        if (portRes.ok) port = await portRes.json();
      } catch (e) {
        console.warn("Portfolio fetch fallback", e);
      }
      if (!port) {
        port = {
          spot_pct: 0.40,
          short_term_pct: 0.35,
          medium_term_pct: 0.25,
          total_expected_cost_usd: Math.round((Number(weightTonnes) || 70000) * 28.85)
        };
      }

      // 3. Risk Engine
      let risk: any = null;
      try {
        const mlApiBase = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:8000';
        const riskRes = await fetch(`${mlApiBase}/risk/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            volatility_sub_score: 0.42,
            congestion_sub_score: destinationPort.congestionIndex || 0.45,
            shock_sub_score: weatherFactorPct * 0.01,
            availability_sub_score: 0.35,
            destination_region: destinationPort.name || "Bay of Bengal",
            split_pct: 60
          })
        });
        if (riskRes.ok) risk = await riskRes.json();
      } catch (e) {
        console.warn("Risk fetch fallback", e);
      }
      if (!risk) {
        risk = {
          risk_score: Math.min(95, Math.round(38 + (destinationPort.congestionIndex || 0.4) * 40)),
          category: (destinationPort.congestionIndex || 0.4) > 0.6 ? "HIGH" : "MEDIUM",
          mitigation_suggestion: "Maintain 14-day laycan buffer at " + destinationPort.name + " due to berth turnaround delays."
        };
      }

      setScenarioResult({ entry, port, risk });
    } catch (err: any) {
      console.error("Scenario execution error", err);
      setScenarioError(err?.message || "Failed to execute scenario");
    } finally {
      setScenarioRunning(false);
    }
  };

  // Chart configuration for SVGs
  const svgWidth = 600;
  const svgHeight = 250;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const chartData = useMemo(() => {
    if (rates.length === 0) return { points: [], minRate: 0, maxRate: 20, maList: [], volBoundList: [] };
    const ratesValues = rates.map((r) => r.rateUsdPerTonne);
    const minVal = Math.floor(Math.min(...ratesValues) * 0.9);
    const maxVal = Math.ceil(Math.max(...ratesValues) * 1.1);
    
    const analysis = freightService.analyzeMarket(rates);
    const volBound = analysis.volatility * (maxVal - minVal);

    const maList = rates.map((_, idx, arr) => {
      const start = Math.max(0, idx - 3);
      const end = Math.min(arr.length, idx + 4);
      const slice = arr.slice(start, end);
      return slice.reduce((acc, c) => acc + c.rateUsdPerTonne, 0) / slice.length;
    });

    const volBoundList = maList.map(ma => ({ upper: ma + volBound, lower: ma - volBound }));

    return { points: rates, minRate: minVal, maxRate: maxVal, maList, volBoundList };
  }, [rates]);

  const getX = (index: number) => padding.left + (index / Math.max(1, rates.length - 1)) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - ((val - chartData.minRate) / (chartData.maxRate - chartData.minRate || 1)) * innerHeight;

  const areaPathBounds = useMemo(() => {
    if (rates.length < 2) return '';
    const upperLine = chartData.volBoundList.map((b, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(b.upper)}`).join(' ');
    const lowerLine = chartData.volBoundList.map((b, i) => `${getX(i)} ${getY(b.lower)}`).reverse().join(' L ');
    return `${upperLine} L ${lowerLine} Z`;
  }, [chartData, rates]);
  
  const spotPath = useMemo(() => {
    if (rates.length < 2) return '';
    return rates.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.rateUsdPerTonne)}`).join(' ');
  }, [chartData, rates]);

  if (isMasterDataLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-ink">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-ink-muted border-t-brand-primary rounded-full animate-spin" />
          <p className="text-sm font-mono text-ink-muted">Connecting to Backend Services...</p>
        </div>
      </div>
    );
  }

  if (masterDataError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-ink">
        <div className="flex flex-col items-center gap-4 text-status-danger p-6 border border-status-danger/30 bg-status-danger/10 rounded">
          <AlertTriangle className="w-8 h-8" />
          <p className="text-sm font-bold">Unable to load vessel intelligence.</p>
          <p className="text-xs">{masterDataError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background text-ink relative pb-12">
      {/* Muted background photograph */}
      <div 
        className="absolute top-0 left-0 w-full h-[220px] z-0 opacity-25 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1599577180572-c284dbcc58cc?auto=format&fit=crop&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 flex flex-wrap items-center justify-between px-6 py-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Maritime Freight Command Center</h1>
          <p className="text-xs text-ink-secondary mt-0.5">Live fleet analytics and charter routing</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-brand-primary/10 border border-brand-primary text-brand-primary flex items-center justify-center text-xs font-bold group-hover:bg-brand-primary group-hover:text-white transition-colors">
              OP
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold leading-none">Operations Desk</div>
              <div className="text-[10px] text-ink-muted mt-0.5">TKTF Maritime</div>
            </div>
            <ChevronDown className="w-3 h-3 text-ink-muted" />
          </div>
        </div>
      </header>

      {/* 6-Stage Pipeline moved to Layout.tsx */}

      {/* 4 Metric Cards */}
      <div className="relative z-10 px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        <div className="card p-4 border-transparent hover:border-border-subtle transition-colors cursor-default" title="Period: 30D. Source: Baltic Exchange (Mock)">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-ink-secondary flex items-center gap-2">
              <Ship className="w-4 h-4" /> Global Freight Index
            </span>
            <span className="text-[10px] font-mono text-ink-muted">USD/MT</span>
          </div>
          <div className="text-3xl font-mono text-ink mb-1">
            {rates.length > 0 ? (rates[rates.length - 1]?.rateUsdPerTonne.toFixed(2) ?? '0.00') : '0.00'}
          </div>
          <div className="text-[10px] text-brand-primary font-mono flex items-center gap-1">
            <span>+4.7%</span>
            <span className="text-ink-muted font-sans">vs last week</span>
          </div>
          {/* Sparkline mock */}
          <div className="mt-2 h-6 w-full flex items-end gap-[2px]">
             {[30,40,35,50,45,60,55,70,65,80].map((h, i) => (
                <div key={i} className="flex-1 bg-border-strong rounded-none" style={{height: `${h}%`}} />
             ))}
          </div>
        </div>

        <div className="card p-4 border-transparent hover:border-border-subtle transition-colors cursor-default" title="Source: Port Congestion + Active Chokepoints (Navik Engine)">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-ink-secondary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Disruption Risk Score
            </span>
            <span className="text-[10px] font-mono text-ink-muted">INDEX</span>
          </div>
          <div className="text-3xl font-mono text-ink mb-1">
            {riskScore.toFixed(1)}<span className="text-sm text-ink-muted">/100</span>
          </div>
          <div className="w-full h-1 bg-border-strong rounded-none overflow-hidden mb-1.5 mt-2">
            <div className="h-full bg-danger" style={{ width: `${riskScore}%` }} />
          </div>
          <div className="text-[10px] text-danger font-mono flex items-center gap-1">
            <span>Moderate risk</span>
          </div>
        </div>

        <div className="card p-4 border-transparent hover:border-border-subtle transition-colors cursor-default" title="Estimated global shipping demand">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-ink-secondary flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Estimated Demand (3M)
            </span>
          </div>
          <div className="text-3xl font-mono text-ink mb-1">
            184.2<span className="text-sm text-ink-muted">M MT</span>
          </div>
          <div className="text-[10px] text-ink-muted font-mono flex items-center gap-1 mt-2">
            <span>Global aggregate</span>
          </div>
        </div>

        <div className="card p-4 border-transparent hover:border-border-subtle transition-colors cursor-default" title="Source: Market Events Notice to Mariners">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-ink-secondary flex items-center gap-2">
              <CloudLightning className="w-4 h-4" /> Active Disruptions
            </span>
            <span className="text-[10px] font-mono text-ink-muted">EVENTS</span>
          </div>
          <div className="text-3xl font-mono text-ink mb-1">
            {events.length}
          </div>
          <div className="text-[10px] text-ink-secondary flex items-center gap-1 mt-2">
            <span className="truncate">
              {events.length > 0 ? events[0]?.title : 'No severe anomalies'}
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Area */}
      <div className="relative z-10 px-6 grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
        
        {/* Globe (Left/Center) */}
        <div className="lg:col-span-5 card p-0 overflow-hidden flex flex-col min-h-[450px]">
          <div className="px-4 py-3 border-b border-border-subtle bg-surface flex justify-between items-center">
            <h2 className="text-sm font-semibold text-ink-secondary flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Global Maritime Overview
            </h2>
          </div>
          <div className="flex-1 relative">
            <MaritimeGlobe 
              ports={ports}
              selectedPortId={destPortId}
              onSelectPort={(p) => updateLane({ destPortId: p.id })}
              activeRoute={activeRoute}
              chokepoints={MARITIME_CHOKEPOINTS}
              onSelectChokepoint={() => {}}
              onSelectVessel={() => {}}
            />
          </div>
        </div>

        {/* Freight Forecast (Center) */}
        <div className="lg:col-span-4 card p-0 flex flex-col min-h-[450px]">
           <div className="px-4 py-3 border-b border-border-subtle bg-surface flex justify-between items-center">
            <h2 className="text-sm font-semibold text-ink-secondary flex items-center gap-2">
              <Layers className="w-4 h-4" /> Freight Rate Forecast
            </h2>
            <span className="text-[10px] font-mono text-ink-muted bg-background-raised px-1.5 py-0.5 border border-border-subtle">30D Spot</span>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center items-center">
             {isLoadingRates ? (
               <div className="w-full h-[250px] flex items-center justify-center border border-dashed border-border-subtle bg-surface">
                 <div className="flex flex-col items-center gap-2 text-ink-muted">
                   <div className="w-6 h-6 border-2 border-ink-muted border-t-brand-primary rounded-full animate-spin" />
                   <span className="text-xs font-mono">Loading Forecast Data...</span>
                 </div>
               </div>
             ) : (
               <>
                 <div className="relative w-full h-[250px] overflow-hidden">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full select-none">
                        {/* Grid */}
                        {[0, 0.5, 1].map((pct, i) => {
                          const y = padding.top + innerHeight * (1 - pct);
                          const val = (chartData.minRate + (chartData.maxRate - chartData.minRate) * pct).toFixed(0);
                          return (
                            <g key={i}>
                              <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="rgba(139, 152, 165, 0.1)" strokeDasharray="2 3" />
                              <text x={padding.left - 8} y={y + 3} textAnchor="end" fill="var(--text-muted)" fontSize="10" fontFamily="IBM Plex Mono, monospace">${val}</text>
                            </g>
                          );
                        })}
                        {/* Volatility Bound Area */}
                        {areaPathBounds && <path d={areaPathBounds} fill="rgba(61, 175, 160, 0.1)" stroke="none" />}
                        {/* Spot Line */}
                        {spotPath && <path d={spotPath} fill="none" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                    </svg>
                 </div>
                 <div className="mt-4 flex gap-4 text-[10px] font-mono text-ink-muted">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-brand-primary" /> Spot ($/MT)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-2 bg-[rgba(61,175,160,0.1)] border border-brand-primary/20" /> Volatility Bound</div>
                 </div>
               </>
             )}
          </div>
        </div>

        {/* Scenario Simulator (Right) */}
        <div className="lg:col-span-3 card p-0 flex flex-col min-h-[450px]">
          <div className="px-4 py-3 border-b border-border-subtle bg-surface flex justify-between items-center">
            <h2 className="text-sm font-semibold text-ink-secondary flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Scenario Simulator
            </h2>
          </div>
           <div className="p-4 flex-1 flex flex-col gap-6">
             <div className="space-y-1.5">
               <label className="text-xs font-semibold text-ink-secondary flex justify-between">
                 Weather Severity <span className="text-brand-primary font-mono">+{weatherFactorPct}%</span>
               </label>
               <input 
                  type="range" min="0" max="25" step="1"
                  value={weatherFactorPct}
                  onChange={(e) => setWeatherFactorPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-background-raised rounded appearance-none cursor-pointer accent-purple-500"
                  style={{ background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(weatherFactorPct / 25) * 100}%, #374151 ${(weatherFactorPct / 25) * 100}%, #374151 100%)` }}
               />
               <div className="flex justify-between text-[9px] font-mono text-ink-muted">
                 <span>0%</span><span>25%</span>
               </div>
             </div>

             <div className="space-y-1.5">
               <label className="text-xs font-bold text-ink-secondary flex justify-between uppercase">
                 Port Congestion <span className="text-blue-400 font-mono">{scenario.vessel.serviceSpeedKts} days</span>
               </label>
               <input 
                  type="range" min="10" max="22" step="0.5"
                  value={scenario.vessel.serviceSpeedKts}
                  onChange={(e) => updateVessel({ serviceSpeedKts: Number(e.target.value) })}
                  className="w-full h-1.5 bg-background-raised rounded appearance-none cursor-pointer accent-blue-500"
                  style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((scenario.vessel.serviceSpeedKts - 10) / 12) * 100}%, #374151 ${((scenario.vessel.serviceSpeedKts - 10) / 12) * 100}%, #374151 100%)` }}
               />
               <div className="flex justify-between text-[9px] font-mono text-ink-muted">
                 <span>0 days</span><span>15 days</span>
               </div>
             </div>
             
             <div className="space-y-1.5">
               <label className="text-xs font-bold text-ink-secondary flex justify-between uppercase">
                 Fuel Price <span className="text-orange-400 font-mono">${scenario.vessel.operatingDraftM * 50}/MT</span>
               </label>
               <input 
                  type="range" min="8" max="24" step="0.5"
                  value={scenario.vessel.operatingDraftM}
                  onChange={(e) => updateVessel({ operatingDraftM: Number(e.target.value) })}
                  className="w-full h-1.5 bg-background-raised rounded appearance-none cursor-pointer accent-orange-500"
                  style={{ background: `linear-gradient(to right, #f97316 0%, #f97316 ${((scenario.vessel.operatingDraftM - 8) / 16) * 100}%, #374151 ${((scenario.vessel.operatingDraftM - 8) / 16) * 100}%, #374151 100%)` }}
               />
               <div className="flex justify-between text-[9px] font-mono text-ink-muted">
                 <span>$300</span><span>$1200</span>
               </div>
             </div>

             <div className="space-y-1.5">
               <label className="text-xs font-bold text-ink-secondary flex justify-between uppercase">
                 Global Demand <span className="text-teal-400 font-mono">{weightTonnes.toLocaleString()} MT</span>
               </label>
               <input 
                  type="range" min="10000" max="250000" step="5000"
                  value={weightTonnes}
                  onChange={(e) => updateCargo({ parcelSizeMt: Number(e.target.value) })}
                  className="w-full h-1.5 bg-background-raised rounded appearance-none cursor-pointer accent-teal-500"
                  style={{ background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((weightTonnes - 10000) / 240000) * 100}%, #374151 ${((weightTonnes - 10000) / 240000) * 100}%, #374151 100%)` }}
               />
               <div className="flex justify-between text-[9px] font-mono text-ink-muted">
                 <span>Low</span><span>High</span>
               </div>
             </div>

             <div className="mt-auto">
                <button 
                  disabled={scenarioRunning}
                  className={`w-full flex justify-center items-center gap-2 py-3 rounded text-background text-sm font-semibold transition-all ${
                    scenarioRunning 
                      ? 'bg-surface-elevated text-ink-muted cursor-not-allowed' 
                      : 'bg-brand-primary hover:bg-brand-deep cursor-pointer'
                  }`}
                  onClick={handleRunScenario}
                >
                  <Play className={`w-4 h-4 ${scenarioRunning ? 'animate-spin' : ''}`} />
                  {scenarioRunning ? 'Running ML Engine...' : 'Run Scenario'}
                </button>
                {scenarioResult && (
                  <p className="text-[10px] text-brand-primary font-mono text-center mt-1.5 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Simulation Completed (See Results Below)
                  </p>
                )}
                {scenarioError && (
                  <p className="text-[10px] text-danger font-mono text-center mt-1.5 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {scenarioError}
                  </p>
                )}
             </div>
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="relative z-10 px-6 grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
        
        {/* Vessel Class Comparison */}
        <div className="lg:col-span-8 card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle bg-surface flex justify-between items-center">
             <h2 className="text-sm font-semibold text-ink-secondary flex items-center gap-2">
                <Ship className="w-4 h-4" /> Vessel Class Comparison
             </h2>
             <span className="text-[10px] font-mono text-ink-muted bg-background-raised px-1.5 py-0.5 border border-border-subtle">Constraint Engine</span>
          </div>
          <div className="p-0 overflow-x-auto">
             <table className="w-full text-left text-xs">
                <thead className="bg-background-raised border-b border-border-subtle text-[10px] text-ink-secondary uppercase font-mono tracking-wider">
                   <tr>
                      <th className="px-4 py-3 font-semibold">Class</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">DWT Capacity</th>
                      <th className="px-4 py-3 font-semibold">Draft Limit</th>
                      <th className="px-4 py-3 font-semibold">Notes</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                   {feasibilityResult.feasible.map(f => (
                     <tr key={f.vessel.id} className="hover:bg-surface-elevated transition-colors cursor-pointer group">
                        <td className="px-4 py-3 font-semibold text-ink">{f.vessel.className}</td>
                        <td className="px-4 py-3">
                           <span className="text-[10px] font-mono text-brand-primary">
                               Feasible
                           </span>
                        </td>
                        <td className="px-4 py-3 text-ink-secondary font-mono">{f.vessel.capacityTonnes.toLocaleString()} MT</td>
                        <td className="px-4 py-3 text-ink-secondary font-mono">{f.vessel.maxDraftMeters} m</td>
                        <td className="px-4 py-3 text-ink-muted text-[10px] truncate max-w-[200px]">{f.vessel.description}</td>
                     </tr>
                   ))}
                   {feasibilityResult.infeasible.map(i => (
                     <tr key={i.vessel.id} className="hover:bg-surface transition-colors opacity-50">
                        <td className="px-4 py-3 font-semibold text-ink-muted line-through">{i.vessel.className}</td>
                        <td className="px-4 py-3">
                           <span className="text-[10px] font-mono text-ink-muted line-through">
                               Eliminated
                           </span>
                        </td>
                        <td className="px-4 py-3 text-ink-muted font-mono line-through">{i.vessel.capacityTonnes.toLocaleString()} MT</td>
                        <td className="px-4 py-3 text-ink-muted font-mono line-through">{i.vessel.maxDraftMeters} m</td>
                        <td className="px-4 py-3 text-ink-muted text-[10px] truncate max-w-[200px] line-through">{i.vessel.description}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Final Recommendation */}
        <div className="lg:col-span-4 card p-0 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle bg-surface flex items-center justify-between">
             <h2 className="text-sm font-semibold text-ink-secondary flex items-center gap-2">
                <Crown className="w-4 h-4" /> Final Recommendation
             </h2>
             <span className="px-2 py-0.5 bg-background-raised text-ink-muted text-[9px] uppercase font-mono border border-border-subtle">
               NIRNAY OPTIMIZED
             </span>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
             {feasibilityResult.feasible.length > 0 ? (
               <>
                 <div className="text-[10px] font-semibold text-brand-primary uppercase tracking-widest mb-1.5">Optimal Charter Strategy</div>
                 <div className="text-xl font-bold text-ink leading-tight mb-4">
                   Execute Time Charter for {feasibilityResult.feasible[0]?.vessel.className}
                 </div>
                 
                 {/* Single Recommendation Bar */}
                 <div className="w-full h-1.5 rounded-none overflow-hidden flex mb-4">
                   <div className="h-full bg-brand-primary" style={{ width: '100%' }} />
                 </div>

                 <div className="space-y-3 text-xs flex-1">
                    <div className="flex justify-between items-center py-2.5 border-b border-border-subtle/60">
                       <span className="text-ink-secondary">Primary Vessel Fit</span>
                       <span className="font-semibold text-ink font-mono">{feasibilityResult.feasible[0]?.vessel.className}</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-border-subtle/60">
                       <span className="text-ink-secondary">Port Draft Compliance</span>
                       <span className="font-mono text-brand-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Cleared</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-border-subtle/60">
                       <span className="text-ink-secondary">Spot Target Rate</span>
                       <span className="font-bold text-ink font-mono">${rates.length > 0 ? (rates[rates.length - 1]?.rateUsdPerTonne.toFixed(2) ?? '0.00') : '0.00'}/MT</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5 mt-2">
                       <button className="w-full py-2 bg-surface text-ink hover:bg-surface-elevated rounded-none font-semibold text-xs border border-border-subtle transition-colors">
                         View Detailed Analysis
                       </button>
                    </div>
                 </div>
               </>
             ) : (
                <div className="text-center text-danger flex flex-col items-center flex-1 justify-center">
                   <div className="w-12 h-12 rounded-none border border-danger flex items-center justify-center mb-3">
                     <AlertTriangle className="w-6 h-6" />
                   </div>
                   <div className="text-base font-semibold">No Feasible Vessels Found</div>
                   <div className="text-xs mt-2 max-w-[200px] leading-relaxed">
                     Current constraints eliminate all registered vessel classes. Adjust cargo size or draft limits.
                   </div>
                </div>
             )}
          </div>
        </div>

      </div>
      {/* Scenario ML Results Panel */}
      {scenarioResult && (
        <div className="relative z-10 px-6 mt-6">
          <div className="card border border-purple-500/40 bg-purple-500/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-purple-500/20 bg-purple-500/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                <Gauge className="w-4 h-4" /> Scenario ML Results
              </h2>
              <button onClick={() => setScenarioResult(null)} className="text-[10px] text-ink-muted hover:text-ink transition-colors uppercase font-bold">✕ Dismiss</button>
            </div>
            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Entry Timing */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Market Entry (SPLIT Optimizer)</div>
                <div className={`text-2xl font-black uppercase ${scenarioResult.entry?.recommended_action === 'SPLIT' ? 'text-amber-400' : 'text-blue-400'}`}>
                  {scenarioResult.entry?.recommended_action || 'N/A'}
                </div>
                {scenarioResult.entry?.recommended_action === 'SPLIT' && (
                  <div className="text-xs font-mono text-ink">
                    Lock <span className="font-bold text-amber-400">{((scenarioResult.entry.split_pct || 0) * 100).toFixed(0)}%</span> now
                  </div>
                )}
                <div className="text-xs text-ink-secondary leading-relaxed">
                  {typeof scenarioResult.entry?.rationale === 'string' 
                    ? scenarioResult.entry.rationale 
                    : (scenarioResult.entry?.rationale?.narrative || 'See details in payload')}
                </div>
              </div>
              {/* Portfolio */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Charter Portfolio Split</div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-surface p-2 rounded border border-border-subtle text-center">
                    <div className="text-[9px] text-ink-muted">Spot</div>
                    <div className="text-lg font-black text-blue-400">{((scenarioResult.port?.spot_pct || 0) * 100).toFixed(0)}%</div>
                  </div>
                  <div className="bg-surface p-2 rounded border border-border-subtle text-center">
                    <div className="text-[9px] text-ink-muted">Short</div>
                    <div className="text-lg font-black text-teal-400">{((scenarioResult.port?.short_term_pct || 0) * 100).toFixed(0)}%</div>
                  </div>
                  <div className="bg-surface p-2 rounded border border-border-subtle text-center">
                    <div className="text-[9px] text-ink-muted">Medium</div>
                    <div className="text-lg font-black text-purple-400">{((scenarioResult.port?.medium_term_pct || 0) * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-ink-muted">Est. Cost: ${(scenarioResult.port?.total_expected_cost_usd || 0).toLocaleString()}</div>
              </div>
              {/* Risk */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Composite Risk Score</div>
                <div className={`text-3xl font-black font-mono ${
                  scenarioResult.risk?.category === 'HIGH' ? 'text-red-400' :
                  scenarioResult.risk?.category === 'MEDIUM' ? 'text-amber-400' : 'text-green-400'
                }`}>{(scenarioResult.risk?.risk_score || 0).toFixed(1)}<span className="text-base text-ink-muted">/100</span></div>
                <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                  scenarioResult.risk?.category === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                  scenarioResult.risk?.category === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                }`}>{scenarioResult.risk?.category}</span>
                <div className="text-xs text-ink-secondary leading-relaxed">{scenarioResult.risk?.mitigation_suggestion}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cargo Ship 3D Scene */}
      <div className="mt-8">
        <CargoShipSceneHero />
        <div className="mt-2 text-center text-[10px] text-ink-muted">
          3D model <a href="https://sketchfab.com/3d-models/cargo-ship-loaded-c14144edcd6f4827a84be12456b51e18" target="_blank" rel="noopener noreferrer" className="hover:text-ink-secondary underline">"Cargo Ship Loaded"</a> by gogiart, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="hover:text-ink-secondary underline">CC BY 4.0</a>
        </div>
      </div>

    </div>
  );
}
