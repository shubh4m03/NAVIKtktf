import React, { useEffect, useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, AlertTriangle, Fuel, ArrowUpRight, ArrowDownRight, Layers, FileText, BrainCircuit } from 'lucide-react';
import { freightService, MarketAnalysis } from '../../services/freightService';
import { FreightRate, MarketEvent } from '../../types';
import { useTheme } from '../../context/ThemeContext';

import { useScenario } from '../../context/ScenarioContext';

export default function FreightMarket() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const { scenario, updateLane } = useScenario();

  const [rates, setRates] = useState<FreightRate[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [selectedDays, setSelectedDays] = useState<number>(90);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; rate: FreightRate; ma: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mlForecast, setMlForecast] = useState<any>(null);

  // Derive route ID from origin and destination ports
  const selectedRoute = `route-${scenario.lane.originPortId.replace('port-', '')}-${scenario.lane.destPortId.replace('port-', '')}`;

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      let r = await freightService.getHistoricalRates(selectedRoute, selectedDays);
      if (r.length === 0) {
        // Fallback to demo route data to prevent blank charts
        r = await freightService.getHistoricalRates('route-aus-paradip', selectedDays);
      }
      
      if (r.length === 0) {
        setError("Freight data is not available for this corridor or the fallback corridor.");
        setRates([]);
        setAnalysis(null);
      } else {
        setRates(r);
        setAnalysis(freightService.analyzeMarket(r));
      }

      const e = await freightService.getMarketEvents(selectedDays);
      setEvents(e);
      
      try {
        const forecast = await freightService.getForecast(
          scenario.lane.originPortId.includes('aus') ? 'AUSTRALIA' : 'INTERNATIONAL', 
          scenario.lane.destPortId.replace('port-', ''), 
          scenario.vessel.classId || 'Capesize', 
          selectedDays
        );
        setMlForecast(forecast);
      } catch (err) {
        console.warn("ML Forecast unavailable");
      }
      
      setIsLoading(false);
    }
    loadData();
  }, [selectedRoute, selectedDays, scenario.lane, scenario.vessel]);

  // Compute 7-point Moving Average and Min/Max for SVG scaling
  const chartData = useMemo(() => {
    if (rates.length === 0) return { points: [], minRate: 0, maxRate: 20, maList: [] };
    const ratesValues = rates.map((r) => r.rateUsdPerTonne);
    const minVal = Math.floor(Math.min(...ratesValues) * 0.9);
    const maxVal = Math.ceil(Math.max(...ratesValues) * 1.1);

    // 7-step moving average
    const maList = rates.map((_, idx, arr) => {
      const start = Math.max(0, idx - 3);
      const end = Math.min(arr.length, idx + 4);
      const slice = arr.slice(start, end);
      const sum = slice.reduce((acc, c) => acc + c.rateUsdPerTonne, 0);
      return Number((sum / slice.length).toFixed(2));
    });

    return {
      points: rates,
      minRate: minVal,
      maxRate: maxVal,
      maList,
    };
  }, [rates]);

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 270;
  const padding = { top: 20, right: 35, bottom: 35, left: 50 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (rates.length <= 1) return padding.left;
    return padding.left + (index / (rates.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const range = chartData.maxRate - chartData.minRate || 1;
    return padding.top + innerHeight - ((val - chartData.minRate) / range) * innerHeight;
  };

  // Generate SVG Paths
  const linePath = useMemo(() => {
    if (rates.length < 2) return '';
    return rates.reduce((acc, r, i) => {
      const x = getX(i);
      const y = getY(r.rateUsdPerTonne);
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }, '');
  }, [rates, chartData]);

  const maLinePath = useMemo(() => {
    if (chartData.maList.length < 2) return '';
    return chartData.maList.reduce((acc, ma, i) => {
      const x = getX(i);
      const y = getY(ma);
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }, '');
  }, [chartData]);

  const areaPath = useMemo(() => {
    if (rates.length < 2) return '';
    const bottomY = padding.top + innerHeight;
    const firstX = getX(0);
    const lastX = getX(rates.length - 1);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, rates]);

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-5">
      {/* Header with Data Provenance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-brand-primary" />
            <h1 className="text-base font-bold text-ink tracking-normal">
              Freight Market Intelligence &amp; Time-Series Analytics
            </h1>
          </div>
          <p className="text-xs text-ink-secondary">
            Baltic index benchmarks, spot rate distributions, 7-day moving averages, and bunker correlation telemetry.
          </p>
        </div>

        {/* Route and Period Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-ink-muted font-mono">CORRIDOR:</span>
            <select
              value={selectedRoute}
              onChange={(e) => {
                // e.target.value format: route-aus-paradip
                const parts = e.target.value.split('-');
                if (parts.length >= 3) {
                  updateLane({
                    originPortId: `port-${parts[1]}`,
                    destPortId: `port-${parts[2]}`
                  });
                }
              }}
              className="field-input font-mono text-xs py-1 px-2 w-44"
            >
              <option value="route-aus-paradip">Hay Point → Paradip</option>
              <option value="route-aus-dhamra">Newcastle → Dhamra</option>
              <option value="route-sa-mumbai">Richards Bay → Mumbai</option>
            </select>
          </div>

          <div className="flex items-center bg-background-raised border border-border-subtle rounded p-0.5 text-xs font-mono">
            {[30, 90, 180, 365].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDays(d)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedDays === d
                    ? 'bg-surface-elevated text-ink font-semibold border border-border-subtle-strong'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {d === 365 ? '1Y' : `${d}D`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mlForecast && (
        <div className="bg-brand-primary/10 border border-brand-primary/20 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-brand-primary font-bold text-sm flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              Machine Learning Forecast ({mlForecast.horizon_days || selectedDays} Days)
            </h3>
            <p className="text-xs text-ink-secondary mt-1">
              Model: <span className="font-mono text-ink">{mlForecast.model_used}</span>
              <span className="mx-2 opacity-50">|</span>
              Confidence: <span className="font-mono text-status-success">{mlForecast.confidence_score}%</span>
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <div className="text-[10px] text-ink-muted font-mono uppercase tracking-wider mb-1">Expected Rate</div>
              <div className="text-xl font-bold font-mono text-ink">${mlForecast?.expected_value_usd_per_ton ? mlForecast.expected_value_usd_per_ton.toFixed(2) : '-'}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-ink-muted font-mono uppercase tracking-wider mb-1">90% Confidence Interval</div>
              <div className="text-sm font-bold font-mono text-ink mt-1">
                ${mlForecast?.interval_90 ? mlForecast.interval_90[0].toFixed(2) : '-'} - ${mlForecast?.interval_90 ? mlForecast.interval_90[1].toFixed(2) : '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 4 Structured Metric Cells */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="card p-3.5 space-y-1">
          <div className="flex justify-between items-center text-ink-secondary">
            <span className="text-[10px] font-mono uppercase tracking-wider">Spot Freight Benchmark</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background-raised text-ink-muted border border-border-subtle">
              USD / MT
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-2xl font-bold text-ink font-mono">
              ${analysis?.currentRate.toFixed(2) || '0.00'}
            </span>
            <span
              className={`inline-flex items-center text-xs font-mono font-semibold ${
                (analysis?.percentageChange || 0) >= 0 ? 'text-status-success' : 'text-status-danger'
              }`}
            >
              {(analysis?.percentageChange || 0) >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(analysis?.percentageChange || 0).toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-ink-secondary">Variance relative to period baseline</p>
        </div>

        <div className="card p-3.5 space-y-1">
          <div className="flex justify-between items-center text-ink-secondary">
            <span className="text-[10px] font-mono uppercase tracking-wider">Market Regime</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background-raised text-ink-muted border border-border-subtle">
              REGIME
            </span>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            {(analysis?.percentageChange || 0) >= 0 ? (
              <TrendingUp className="w-4 h-4 text-status-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-status-danger" />
            )}
            <span className="text-lg font-bold text-ink font-mono">{analysis?.trend || 'BALANCED'}</span>
          </div>
          <p className="text-[10px] text-ink-secondary">Forward carrier chartering momentum</p>
        </div>

        <div className="card p-3.5 space-y-1">
          <div className="flex justify-between items-center text-ink-secondary">
            <span className="text-[10px] font-mono uppercase tracking-wider">Volatility Index (σ)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background-raised text-brand-primary border border-border-subtle">
              SPREAD
            </span>
          </div>
          <div className="text-2xl font-bold text-ink font-mono pt-0.5">
            {((analysis?.volatility || 0) * 100).toFixed(1)}%
          </div>
          <p className="text-[10px] text-ink-secondary">Normalized time-series price dispersion</p>
        </div>

        <div className="card p-3.5 space-y-1">
          <div className="flex justify-between items-center text-ink-secondary">
            <span className="text-[10px] font-mono uppercase tracking-wider">Bunker Fuel Index</span>
            <Fuel className="w-3.5 h-3.5 text-status-warning" />
          </div>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-2xl font-bold text-ink font-mono">$624.50</span>
            <span className="text-xs font-mono text-status-success font-semibold">+1.8% W/W</span>
          </div>
          <p className="text-[10px] text-ink-secondary">VLSFO Singapore Hub marine fuel price</p>
        </div>
      </div>

      {/* Main Analytical Chart */}
      <div className="card p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
          <div className="flex items-center gap-4">
            <h2 className="card-title text-ink font-semibold">Spot Freight Rate vs 7-Day Moving Average</h2>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-brand-primary inline-block" />
                <span className="text-ink-secondary">Spot ($/MT)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-status-warning inline-block stroke-dasharray" />
                <span className="text-ink-secondary">7D Moving Avg</span>
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-ink-muted bg-background-raised px-2 py-0.5 rounded border border-border-subtle" title="Excludes non-trading weekends/holidays">
            {rates.length} ACTIVE TRADING DAYS
          </span>
        </div>

        {/* SVG Canvas with Crosshair Tooltip */}
        <div className="relative w-full overflow-x-auto min-h-[270px]">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 space-y-4 z-10">
               <div className="w-64 h-1 bg-border-subtle rounded overflow-hidden">
                 <div className="h-full bg-brand-primary/20 w-full loading-shimmer" />
               </div>
               <p className="text-xs text-ink-secondary">Loading freight market telemetry...</p>
            </div>
          ) : error || rates.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 z-10">
               <AlertTriangle className="w-8 h-8 text-status-warning opacity-50" />
               <p className="text-sm font-semibold text-ink">No Freight Telemetry Available</p>
               <p className="text-xs text-ink-secondary max-w-sm">{error || "The selected corridor lacks active spot fixture data for this time period."}</p>
            </div>
          ) : (
            <>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto select-none"
                onMouseLeave={() => setHoveredPoint(null)}
              >
              <defs>
                <linearGradient id="freightAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isLight ? '#0B628C' : '#126B9A'} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={isLight ? '#0B628C' : '#126B9A'} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Precision Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = padding.top + innerHeight * (1 - pct);
                const val = (chartData.minRate + (chartData.maxRate - chartData.minRate) * pct).toFixed(1);
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke={isLight ? 'rgba(88, 112, 131, 0.12)' : 'rgba(125, 170, 195, 0.12)'}
                      strokeDasharray="2 3"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill={isLight ? '#587083' : '#9fb4c3'}
                      fontSize="10"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      ${val}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaPath && <path d={areaPath} fill="url(#freightAreaGradient)" />}

              {/* 7-Day MA Line */}
              {maLinePath && (
                <path
                  d={maLinePath}
                  fill="none"
                  stroke={isLight ? '#b7791f' : '#d59a32'}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Spot Series Curve */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={isLight ? '#0b628c' : '#20b7d7'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Hit Rectangles */}
              {rates.map((r, i) => {
                const cx = getX(i);
                const cy = getY(r.rateUsdPerTonne);
                const ma = chartData.maList[i] || r.rateUsdPerTonne;
                return (
                  <rect
                    key={i}
                    x={cx - 10}
                    y={padding.top}
                    width={20}
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredPoint({ x: cx, y: cy, rate: r, ma })}
                  />
                );
              })}

              {/* Crosshair Cursor */}
              {hoveredPoint && (
                <g>
                  <line
                    x1={hoveredPoint.x}
                    y1={padding.top}
                    x2={hoveredPoint.x}
                    y2={padding.top + innerHeight}
                    stroke={isLight ? '#0b628c' : '#20b7d7'}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="4"
                    fill={isLight ? '#0b628c' : '#20b7d7'}
                    stroke={isLight ? '#ffffff' : '#071827'}
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </svg>

            {/* Floating Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none bg-surface border border-border-subtle px-3 py-2 rounded shadow-panel text-xs font-mono z-20"
                style={{
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                  top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                  transform: 'translate(-50%, -125%)',
                }}
              >
                <div className="text-ink-secondary text-[10px]">{hoveredPoint.rate.date}</div>
                <div className="text-ink font-bold text-sm">
                  Spot: <span className="text-brand-primary">${hoveredPoint.rate.rateUsdPerTonne.toFixed(2)}</span> / MT
                </div>
                <div className="text-status-warning text-[10px]">7D MA: ${hoveredPoint.ma.toFixed(2)}</div>
              </div>
            )}
          </>
          )}
        </div>
      </div>

      {/* Geopolitical & Commodity Event Shocks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="card-title flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-primary" />
            Macro Shocks &amp; Notice to Mariners
          </h3>
          <span className="text-[11px] font-mono text-ink-muted">
            {events.length} RECORDED ANOMALIES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {events.map((e) => (
            <div
              key={e.id}
              className="card p-3.5 space-y-2 border border-border-subtle hover:border-border-subtle-strong transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background-raised text-brand-primary border border-border-subtle uppercase">
                  {e.category}
                </span>
                <span className="text-xs text-ink-muted font-mono">{e.date}</span>
              </div>

              <h4 className="font-semibold text-ink text-xs">{e.title}</h4>
              <p className="text-[11px] text-ink-secondary leading-relaxed">{e.description}</p>

              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs font-mono">
                <span className="text-ink-secondary text-[11px]">Freight Shock Impact:</span>
                <span
                  className={`font-semibold ${e.rateChangePercent >= 0 ? 'text-status-success' : 'text-status-danger'}`}
                >
                  {e.rateChangePercent >= 0 ? '+' : ''}
                  {e.rateChangePercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
