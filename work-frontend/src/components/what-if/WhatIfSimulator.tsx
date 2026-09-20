import React, { useState, useMemo } from 'react';
import { ShieldAlert, AlertTriangle, Play, RefreshCw, BarChart3, RotateCcw, AlertCircle, Shield, BrainCircuit } from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';
import { useMasterData } from '../../hooks/useMasterData';
import { MARITIME_CHOKEPOINTS } from '../route-intelligence/chokepointsData';

export default function WhatIfSimulator() {
  const { scenario } = useScenario();

  // Baseline data from context
  const { ports } = useMasterData();

  const fallbackPort = { id: 'fallback', name: 'Loading...', lat: 0, lng: 0, maxDraftMeters: 20, congestionIndex: 0.5, country: '', unlocode: '', status: 'normal' as any, hasTerminals: true };
  const destPort = ports.find(p => p.id === scenario.lane.destPortId) || ports[2] || fallbackPort;
  const originPort = ports.find(p => p.id === scenario.lane.originPortId) || ports[1] || fallbackPort;

  // Baseline Model Values (Real Data where possible)
  const baseCongestion = destPort.congestionIndex || 0.3; // 0 to 1
  const activeChokepointsCount = MARITIME_CHOKEPOINTS.filter(cp => cp.maxDraftMeters < scenario.vessel.operatingDraftM).length;
  const baseVolatility = 0.45; // Base freight volatility (would come from Freight Market in a real build)
  
  // ML Optimizer States
  const [entryTiming, setEntryTiming] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [mlLoading, setMlLoading] = useState(false);
  
  // Pending Shocks (Slider State)
  const [freightShock, setFreightShock] = useState<number>(0);
  const [portShock, setPortShock] = useState<number>(0);
  const [bunkerShock, setBunkerShock] = useState<number>(0);
  const [supplyShock, setSupplyShock] = useState<number>(0);

  // Applied Shocks (Executed State)
  const [appliedShocks, setAppliedShocks] = useState({
    freight: 0,
    port: 0,
    bunker: 0,
    supply: 0
  });

  // Execute Simulation
  const handleExecute = async () => {
    setAppliedShocks({
      freight: freightShock,
      port: portShock,
      bunker: bunkerShock,
      supply: supplyShock
    });

    // Fetch ML Optimizations based on applied shocks
    setMlLoading(true);
    try {
      // 1. Entry Timing Optimizer
      const mlApiBase = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:8000';
      const entryRes = await fetch(`${mlApiBase}/optimize/entry-timing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargo_quantity_mt: scenario.cargo.parcelSizeMt,
          current_spot_rate: 28.5 * (1 + freightShock / 100),
          forecast_expected_rate: 29.5 * (1 + freightShock / 100),
          forecast_spread: 3.5,
          deadline_days: 45,
          wait_days: 14,
          risk_aversion_lambda: 1.0
        })
      });
      if (entryRes.ok) setEntryTiming(await entryRes.json());

      // 2. Portfolio Optimizer
      const mlApiBase = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:8000';
      const portRes = await fetch(`${mlApiBase}/optimize/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_rate_usd_per_mt: 29.5 * (1 + freightShock / 100),
          q_05: 26.5 * (1 + freightShock / 100),
          q_95: 33.5 * (1 + freightShock / 100),
          tonnage_mt: scenario.cargo.parcelSizeMt,
          risk_aversion_lambda: 0.5
        })
      });
      if (portRes.ok) setPortfolio(await portRes.json());
      // 3. Risk Engine
      const mlApiBase = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:8000';
      const riskRes = await fetch(`${mlApiBase}/risk/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volatility_sub_score: Math.min(1.0, baseVolatility + (freightShock * 0.005) + (supplyShock * 0.005)),
          congestion_sub_score: Math.min(1.0, baseCongestion + (portShock * 0.01)),
          shock_sub_score: Math.min(1.0, bunkerShock * 0.01),
          availability_sub_score: Math.min(1.0, supplyShock * 0.01),
          destination_region: "Bay of Bengal",
          split_pct: entryTiming?.split_pct ? entryTiming.split_pct * 100 : 50
        })
      });
      if (riskRes.ok) setRiskData(await riskRes.json());

    } catch (err) {
      console.warn("Failed to fetch ML optimizations", err);
    }
    setMlLoading(false);
  };

  // Presets
  const handlePreset = (preset: string) => {
    if (preset === 'spot-spike') {
      setFreightShock(15);
      setPortShock(0);
      setBunkerShock(0);
      setSupplyShock(0);
    } else if (preset === 'suez-crisis') {
      setFreightShock(50);
      setPortShock(20);
      setBunkerShock(0);
      setSupplyShock(0);
    } else if (preset === 'cyclone') {
      setFreightShock(0);
      setPortShock(40);
      setBunkerShock(0);
      setSupplyShock(0);
    } else if (preset === 'opec-shock') {
      setFreightShock(0);
      setPortShock(0);
      setBunkerShock(45);
      setSupplyShock(0);
    } else if (preset === 'reset') {
      setFreightShock(0);
      setPortShock(0);
      setBunkerShock(0);
      setSupplyShock(0);
      setAppliedShocks({ freight: 0, port: 0, bunker: 0, supply: 0 });
    }
  };

  // --- Composite Risk Score Calculation ---
  const riskScore = riskData?.risk_score ?? 0;
  const riskSeverity = riskData?.category ?? 'UNKNOWN';
  const riskColor = riskSeverity === 'HIGH' ? 'text-red-500 bg-red-500/10 border-red-500/30' 
                   : riskSeverity === 'MEDIUM' ? 'text-amber-500 bg-amber-500/10 border-amber-500/30' 
                   : riskSeverity === 'LOW' ? 'text-green-500 bg-green-500/10 border-green-500/30'
                   : 'text-ink-muted bg-surface border-border-subtle';
  const barColor = riskSeverity === 'HIGH' ? 'bg-red-500' : riskSeverity === 'MEDIUM' ? 'bg-amber-500' : riskSeverity === 'LOW' ? 'bg-green-500' : 'bg-ink-muted';

  // --- Top Contributing Factors ---
  const topFactors = riskData?.top_drivers?.map((d: any) => ({
    label: d.display_name,
    impact: d.weighted_contribution,
    type: d.provenance
  })) || [];

  // --- Automated Mitigation Advisory ---
  const advisory = riskData?.mitigation_suggestion ?? "Run the scenario simulator to generate an advisory based on current market conditions.";


  if (!scenario.vessel.classId) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto bg-background text-ink p-4 lg:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-bold text-ink tracking-normal">What-If Simulator</h1>
            </div>
            <p className="text-sm text-ink-secondary">
              Stress-test global freight volatility, route disruptions, and port congestion against active charters.
            </p>
          </div>
        </div>
        <div className="card p-8 border-border-subtle flex flex-col items-center justify-center text-center mt-12 bg-surface/50">
          <div className="w-12 h-12 rounded-full bg-surface border border-border-subtle flex items-center justify-center mb-4 text-ink-muted">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">No Active Scenario</h2>
          <p className="text-sm text-ink-secondary max-w-md">
            You must define a complete cargo request and select a feasible vessel in the Vessel Explorer before running a What-If simulation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background text-ink p-4 lg:p-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-ink tracking-normal">What-If Simulator</h1>
          </div>
          <p className="text-sm text-ink-secondary">
            Stress-test global freight volatility, route disruptions, and port congestion against active charters.
          </p>
        </div>
      </div>

      {/* 2. SECTION: COMPOSITE RISK SCORE & TOP DRIVERS */}
      <div className="flex flex-col space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-ink uppercase tracking-wide">Composite Risk Profile</h2>
            <span className={`px-2 py-1 text-[10px] font-bold border rounded uppercase tracking-wider ${riskColor}`}>
              {riskSeverity}
            </span>
          </div>
          <span className="text-[10px] font-mono text-ink-muted bg-surface px-2 py-1 rounded border border-border-subtle">
            Score: Deterministic Risk Engine
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Panel: Composite Risk Score */}
          <div className="lg:col-span-4 card p-6 flex flex-col justify-center items-center text-center border-border-subtle relative overflow-hidden">
            <div className="absolute top-4 left-4">
               <span className="px-2 py-0.5 rounded bg-surface border border-border-subtle text-[10px] font-bold text-ink-secondary tracking-widest uppercase">
                 Weighted
               </span>
            </div>
            
            <div className="text-6xl font-black font-mono text-ink mt-4 mb-2 tracking-tighter flex items-baseline justify-center gap-1">
              {riskScore.toFixed(1)}
              <span className="text-2xl text-ink-muted">/100</span>
            </div>
            <div className="text-xs font-bold text-ink-secondary uppercase tracking-widest mb-6">Composite Risk Score</div>

            <div className="w-full h-2.5 bg-background-raised rounded-full overflow-hidden">
              <div className={`h-full ${barColor} transition-all duration-700 ease-out`} style={{ width: `${riskScore}%` }} />
            </div>
            <div className="w-full flex justify-between text-[10px] font-mono text-ink-muted mt-2">
              <span>0 (Stable)</span>
              <span>100 (Critical)</span>
            </div>
          </div>

          {/* Right Panel: Top Contributing Factors */}
          <div className="lg:col-span-8 card p-0 border-border-subtle flex flex-col">
            <div className="px-4 py-3 border-b border-border-subtle bg-surface flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-primary" /> Top Contributing Factors
              </h3>
            </div>
            <div className="flex-1 p-0 overflow-y-auto">
              <table className="w-full text-left text-sm">
                 <thead className="bg-background-raised border-b border-border-subtle text-[10px] text-ink-secondary uppercase font-mono tracking-wider">
                    <tr>
                       <th className="px-4 py-2.5 font-semibold w-12 text-center">Rank</th>
                       <th className="px-4 py-2.5 font-semibold">Factor</th>
                       <th className="px-4 py-2.5 font-semibold text-right">Impact</th>
                       <th className="px-4 py-2.5 font-semibold text-right">Provenance</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border-subtle">
                    {topFactors.map((factor: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface transition-colors">
                         <td className="px-4 py-3 text-center text-ink-muted font-mono">#{idx + 1}</td>
                         <td className="px-4 py-3 font-semibold text-ink">{factor.label}</td>
                         <td className="px-4 py-3 text-right font-mono font-bold text-ink">+{factor.impact.toFixed(1)} pts</td>
                         <td className="px-4 py-3 text-right">
                           <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider border ${
                             factor.type === 'MODEL_OUTPUT' 
                               ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' 
                               : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                           }`}>
                             {factor.type}
                           </span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Interactive Freight Rate Impact Graph */}
        <div className="card p-4 bg-surface border border-border-subtle flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-primary" /> Projected Freight Impact
            </h4>
            <span className="text-[10px] text-ink-muted">Simulated 30-Day Projection</span>
          </div>
          <div className="relative w-full h-[150px] bg-background border-b border-border-subtle rounded mt-2">
             <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="impactGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Base Rate Line */}
                <path d="M 0 100 L 200 100 L 400 100 L 600 100" stroke="#374151" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                {/* Shock Projected Rate Line */}
                <path d={`M 0 100 L 200 100 L 400 ${100 - (freightShock * 0.8)} L 600 ${100 - (freightShock * 1.2)}`} stroke="#3b82f6" strokeWidth="3" fill="none" />
                <path d={`M 0 100 L 200 100 L 400 ${100 - (freightShock * 0.8)} L 600 ${100 - (freightShock * 1.2)} L 600 150 L 0 150 Z`} fill="url(#impactGrad)" />
             </svg>
             <div className="absolute top-2 right-2 px-2 py-1 bg-surface border border-border-subtle rounded shadow text-xs font-mono font-bold text-blue-400">
               {freightShock > 0 ? `+${freightShock}% Spot Market` : 'Baseline'}
             </div>
          </div>
        </div>
      </div>

      <hr className="border-border-subtle my-2" />

      {/* 3. SECTION: INTERACTIVE WHAT-IF SCENARIO SIMULATOR */}
      <div className="flex flex-col space-y-4 pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
           <div>
             <h2 className="font-bold text-lg text-ink flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-amber-500" /> Interactive What-If Scenario Simulator
             </h2>
             <p className="text-xs text-ink-secondary mt-1">
               Inject macroeconomic or operational shocks to re-evaluate the full decision pipeline under stressed conditions.
             </p>
           </div>
           <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border-subtle rounded text-[10px] font-mono">
             <span className="w-2 h-2 rounded-full bg-status-success" />
             <span className="text-ink-muted">Server-side recalculation</span>
           </div>
        </div>

        {/* Stress Presets */}
        <div className="flex flex-wrap gap-2">
           <button onClick={() => handlePreset('spot-spike')} className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated border border-border-subtle text-xs font-semibold text-ink transition-colors">
             Freight +15% (Spot Spike)
           </button>
           <button onClick={() => handlePreset('suez-crisis')} className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated border border-border-subtle text-xs font-semibold text-ink transition-colors">
             Red Sea / Suez Crisis (+50% Freight, +20% Delay)
           </button>
           <button onClick={() => handlePreset('cyclone')} className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated border border-border-subtle text-xs font-semibold text-ink transition-colors">
             Cyclone / Monsoon (+40% Congestion)
           </button>
           <button onClick={() => handlePreset('opec-shock')} className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated border border-border-subtle text-xs font-semibold text-ink transition-colors">
             OPEC+ Oil Shock (+45% Bunker)
           </button>
           <button onClick={() => handlePreset('reset')} className="px-3 py-1.5 rounded bg-background hover:bg-surface border border-border-subtle text-xs font-semibold text-ink-secondary flex items-center gap-1.5 transition-colors ml-auto">
             <RotateCcw className="w-3.5 h-3.5" /> Reset Sliders
           </button>
        </div>

        {/* Shock Sliders Card */}
        <div className="card p-6 border-border-subtle">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
             
             {/* Slider 1: Freight Rate */}
             <div className="space-y-3">
               <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2">
                   <label className="text-sm font-bold text-ink">Freight Rate Shock</label>
                   <span className="px-1.5 py-0.5 rounded text-[8px] font-mono border bg-background border-border-subtle text-ink-muted tracking-wider">PARAM</span>
                 </div>
                 <span className="font-mono text-sm font-bold text-blue-500">+{freightShock}%</span>
               </div>
               <input 
                  type="range" min="0" max="100" step="1"
                  value={freightShock} onChange={(e) => setFreightShock(Number(e.target.value))}
                  className="w-full h-2 bg-background-raised rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${freightShock}%, #374151 ${freightShock}%, #374151 100%)` }}
               />
             </div>

             {/* Slider 2: Port Congestion */}
             <div className="space-y-3">
               <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2">
                   <label className="text-sm font-bold text-ink">Port Congestion Shock</label>
                   <span className="px-1.5 py-0.5 rounded text-[8px] font-mono border bg-background border-border-subtle text-ink-muted tracking-wider">PARAM</span>
                 </div>
                 <span className="font-mono text-sm font-bold text-orange-500">+{portShock}%</span>
               </div>
               <input 
                  type="range" min="0" max="100" step="1"
                  value={portShock} onChange={(e) => setPortShock(Number(e.target.value))}
                  className="w-full h-2 bg-background-raised rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #f97316 0%, #f97316 ${portShock}%, #374151 ${portShock}%, #374151 100%)` }}
               />
             </div>

             {/* Slider 3: Bunker Fuel */}
             <div className="space-y-3">
               <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2">
                   <label className="text-sm font-bold text-ink">Bunker Fuel Shock</label>
                   <span className="px-1.5 py-0.5 rounded text-[8px] font-mono border bg-background border-border-subtle text-ink-muted tracking-wider">PARAM</span>
                 </div>
                 <span className="font-mono text-sm font-bold text-purple-500">+{bunkerShock}%</span>
               </div>
               <input 
                  type="range" min="0" max="100" step="1"
                  value={bunkerShock} onChange={(e) => setBunkerShock(Number(e.target.value))}
                  className="w-full h-2 bg-background-raised rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${bunkerShock}%, #374151 ${bunkerShock}%, #374151 100%)` }}
               />
             </div>

             {/* Slider 4: Fleet Supply */}
             <div className="space-y-3">
               <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2">
                   <label className="text-sm font-bold text-ink">Fleet Supply Shock</label>
                   <span className="px-1.5 py-0.5 rounded text-[8px] font-mono border bg-background border-border-subtle text-ink-muted tracking-wider">PARAM</span>
                 </div>
                 <span className="font-mono text-sm font-bold text-green-500">+{supplyShock}%</span>
               </div>
               <input 
                  type="range" min="0" max="100" step="1"
                  value={supplyShock} onChange={(e) => setSupplyShock(Number(e.target.value))}
                  className="w-full h-2 bg-background-raised rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #22c55e 0%, #22c55e ${supplyShock}%, #374151 ${supplyShock}%, #374151 100%)` }}
               />
             </div>

           </div>

           {/* Execute Button */}
           <div className="mt-8 pt-6 border-t border-border-subtle flex justify-end">
              <button 
                onClick={handleExecute}
                disabled={mlLoading}
                className={`flex items-center gap-2 px-8 py-3.5 rounded font-semibold transition-colors ${
                  mlLoading 
                    ? 'bg-surface-elevated text-ink-muted cursor-not-allowed' 
                    : 'bg-brand-primary hover:bg-brand-deep text-background'
                }`}
              >
                <Play className="w-5 h-5" /> {mlLoading ? 'Computing ML Scenarios...' : 'Execute What-If Perturbation'}
              </button>
           </div>
        </div>

      </div>

      {/* 4. SECTION: ML OPTIMIZER OUTPUTS */}
      {(entryTiming || portfolio) && (
        <>
          <hr className="border-border-subtle my-2" />
          <div className="flex flex-col space-y-4 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg text-ink flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-brand-primary" /> ML Strategy Optimizers
                </h2>
                <p className="text-xs text-ink-secondary mt-1">
                  Machine learning recommendations based on the perturbed scenario.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {entryTiming && (
                <div className="card p-6 border-border-subtle flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2 border-b border-border-subtle pb-2">
                    Market Entry Timing (21-Point SPLIT)
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-ink-secondary uppercase tracking-wider font-mono">Recommended Action</div>
                    <div className={`text-2xl font-black uppercase ${entryTiming.recommended_action === 'SPLIT' ? 'text-amber-500' : 'text-brand-primary'}`}>
                      {entryTiming.recommended_action}
                    </div>
                    {entryTiming.recommended_action === 'SPLIT' && (
                      <div className="text-sm font-mono text-ink mt-1">
                        Secure <span className="font-bold text-amber-500">{(entryTiming.split_pct * 100).toFixed(0)}%</span> now, Wait with <span className="font-bold text-amber-500">{((1 - entryTiming.split_pct) * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-surface p-3 border border-border-subtle rounded text-sm text-ink-secondary leading-relaxed">
                    <strong className="text-ink">Rationale:</strong> {typeof entryTiming.rationale === 'string' ? entryTiming.rationale : (entryTiming.rationale?.narrative || 'See details in payload')}
                  </div>
                </div>
              )}

              {portfolio && (
                <div className="card p-6 border-border-subtle flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2 border-b border-border-subtle pb-2">
                    Charter Portfolio Strategist (Mean-Variance)
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-surface p-3 border border-border-subtle rounded flex flex-col items-center justify-center gap-1">
                      <div className="text-[10px] text-ink-secondary uppercase tracking-widest font-mono">Spot</div>
                      <div className="text-xl font-black text-brand-primary">{(portfolio.spot_pct * 100).toFixed(0)}%</div>
                    </div>
                    <div className="bg-surface p-3 border border-border-subtle rounded flex flex-col items-center justify-center gap-1">
                      <div className="text-[10px] text-ink-secondary uppercase tracking-widest font-mono">Short (1-3m)</div>
                      <div className="text-xl font-black text-teal-400">{(portfolio.short_term_pct * 100).toFixed(0)}%</div>
                    </div>
                    <div className="bg-surface p-3 border border-border-subtle rounded flex flex-col items-center justify-center gap-1">
                      <div className="text-[10px] text-ink-secondary uppercase tracking-widest font-mono">Med (6-12m)</div>
                      <div className="text-xl font-black text-purple-500">{(portfolio.medium_term_pct * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="text-xs text-ink-secondary bg-surface p-2 border border-border-subtle rounded">
                    Objective: Minimize E[Cost] + <span className="font-mono">{portfolio.risk_aversion_lambda}</span> * Var(Cost) <br/>
                    Expected Port Cost: <span className="font-mono">${portfolio.total_expected_cost_usd?.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
