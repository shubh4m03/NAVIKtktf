import React from 'react';
import { RecommendationSummaryDto } from '../lib/api-client';
import ProvenanceBadge from './ProvenanceBadge';
import { formatUSD } from '../lib/formatCurrency';


interface RecommendationCardProps {
  recommendation: RecommendationSummaryDto;
  deadline?: string;
  isScenario?: boolean;
}

interface RationaleDriver {
  factor: string;
  value: string | number;
  direction?: string;
  provenance?: string;
  source?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  deadline,
  isScenario = false,
}) => {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'CHARTER_NOW':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400',
          badgeBg: 'bg-emerald-500 text-slate-950',
          desc: 'Immediate charter fixing recommended. Lock current spot rates before projected escalation or deadline squeeze.',
        };
      case 'WAIT':
        return {
          bg: 'bg-sky-950/70 border-sky-500/50 text-sky-400',
          badgeBg: 'bg-sky-500 text-slate-950',
          desc: 'Defer market entry. Favorable rate softening expected with sufficient deadline buffer.',
        };
      case 'SPLIT':
      default:
        return {
          bg: 'bg-amber-950/70 border-amber-500/50 text-amber-400',
          badgeBg: 'bg-amber-500 text-slate-950',
          desc: 'Split charter strategy recommended. Partially secure immediate capacity while retaining market flexibility.',
        };
    }
  };

  const actionDetails = getActionColor(recommendation.action);
  let rationaleObj: any = null;
  try {
    if (recommendation.rationaleJson) {
      rationaleObj = JSON.parse(recommendation.rationaleJson);
    }
  } catch (e) {
    rationaleObj = { narrative: recommendation.rationaleJson };
  }

  const drivers: RationaleDriver[] = Array.isArray(rationaleObj?.drivers)
    ? rationaleObj.drivers
    : [];

  const formatFactorLabel = (factor: string): string => {
    switch (factor) {
      case 'expected_freight_change':
        return 'Expected Freight Change';
      case 'freight_price_delta':
        return 'Freight Price Delta';
      case 'vessel_availability_proxy':
        return 'Vessel Availability Proxy';
      case 'congestion_trend':
        return 'Port Congestion Trend';
      case 'prob_increase_gt_8pct':
        return 'Prob. Escalation > 8%';
      case 'forecast_interval_uncertainty':
        return 'Forecast Interval Spread';
      case 'deadline_buffer':
        return 'Laycan Deadline Buffer';
      case 'freight_shock':
        return 'Simulated Freight Shock';
      default:
        return factor
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
    }
  };

  const formatDriverValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val > 0 && val <= 1) {
        return `${Math.round(val * 100)}%`;
      }
      return val.toString();
    }
    return String(val);
  };

  const getDriverProvenance = (
    d: RationaleDriver
  ): { provenance: 'REAL_VERIFIED' | 'PUBLIC_PROXY' | 'SIMULATED' | 'ASSUMPTION' | 'MODEL_OUTPUT'; source: string } => {
    if (d.provenance) {
      return {
        provenance: d.provenance as any,
        source: d.source || 'Explainability Driver',
      };
    }
    const f = d.factor.toLowerCase();
    if (f.includes('deadline') || f.includes('laycan')) {
      return { provenance: 'REAL_VERIFIED', source: 'Laycan Agreement' };
    }
    if (f.includes('vessel_availability')) {
      return { provenance: 'PUBLIC_PROXY', source: 'AIS Fleet Density' };
    }
    if (f.includes('congestion')) {
      return { provenance: 'SIMULATED', source: 'Port Queue Simulation' };
    }
    return { provenance: 'MODEL_OUTPUT', source: 'Quantile LightGBM' };
  };

  const renderDirectionBadge = (direction?: string) => {
    if (!direction) return null;

    switch (direction) {
      case 'favorable_to_wait':
        return (
          <span
            data-testid="rationale-driver-direction"
            data-direction="favorable_to_wait"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300"
          >
            <span>↓</span> FAVORABLE TO WAIT
          </span>
        );
      case 'unfavorable_to_wait':
        return (
          <span
            data-testid="rationale-driver-direction"
            data-direction="unfavorable_to_wait"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 border border-rose-500/50 text-rose-300"
          >
            <span>↑</span> UNFAVORABLE TO WAIT
          </span>
        );
      case 'ample_buffer':
        return (
          <span
            data-testid="rationale-driver-direction"
            data-direction="ample_buffer"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950/80 border border-sky-500/50 text-sky-300"
          >
            <span>✓</span> AMPLE BUFFER
          </span>
        );
      case 'deadline_critical':
        return (
          <span
            data-testid="rationale-driver-direction"
            data-direction="deadline_critical"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 border border-red-500/50 text-red-300"
          >
            <span>⚠</span> DEADLINE CRITICAL
          </span>
        );
      case 'low_volatility':
        return (
          <span
            data-testid="rationale-driver-direction"
            data-direction="low_volatility"
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950/80 border border-sky-500/50 text-sky-300"
          >
            LOW VOLATILITY
          </span>
        );
      case 'high_volatility':
        return (
          <span
            data-testid="rationale-driver-direction"
            data-direction="high_volatility"
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300"
          >
            HIGH VOLATILITY
          </span>
        );
      default:
        return (
          <span
            data-testid="rationale-driver-direction"
            data-direction={direction}
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300"
          >
            {direction.replace(/_/g, ' ').toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div
      data-testid="recommendation-card"
      className={`border rounded-xl p-6 shadow-xl space-y-6 transition-all ${actionDetails.bg}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            5. Final Strategic Recommendation
          </span>
          {isScenario && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500 text-slate-950">
              STRESSED SCENARIO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">ETLC & SPLIT Decision Engine</span>
          <ProvenanceBadge provenance="MODEL_OUTPUT" label="OPTIMIZED ACTION" source="ETLC Grid Solver" />
        </div>
      </div>

      {/* Decision Summary Grid */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Big Action Badge */}
        <div className="space-y-2">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Optimal Decision Action</div>
          <div className="flex items-center gap-3">
            <span
              data-testid="recommendation-action"
              className={`px-4 py-2 rounded-lg text-2xl font-black font-mono tracking-wider shadow-md ${actionDetails.badgeBg}`}
            >
              {recommendation.action.replace('_', ' ')}
            </span>
            <ProvenanceBadge
              provenance="MODEL_OUTPUT"
              label="SOLVER OUTPUT"
              source="Market Entry Optimization"
            />
          </div>
          <p className="text-xs text-slate-300 max-w-md pt-1">{actionDetails.desc}</p>
        </div>

        {/* Split Allocation Progress / Gauge */}
        <div className="w-full md:w-80 bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-semibold">Immediate Charter Share (p)</span>
            <div className="flex items-center gap-1.5">
              <span
                data-testid="recommendation-split-pct"
                className="font-mono font-bold text-amber-400 text-base"
              >
                {recommendation.splitPct.toFixed(0)}%
              </span>
              <ProvenanceBadge provenance="MODEL_OUTPUT" label="OPTIMAL p" source="SPLIT Grid Search [0,1]" />
            </div>
          </div>

          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
            <div
              className="bg-amber-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-slate-950"
              style={{ width: `${recommendation.splitPct}%` }}
            >
              {recommendation.splitPct > 15 && `${recommendation.splitPct.toFixed(0)}%`}
            </div>
            <div
              className="bg-sky-600 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-slate-100"
              style={{ width: `${100 - recommendation.splitPct}%` }}
            >
              {100 - recommendation.splitPct > 15 && `${(100 - recommendation.splitPct).toFixed(0)}%`}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between text-[10px] font-mono text-slate-400 gap-1 pt-1">
            <div className="flex items-center gap-1.5">
              <span>Fixed Now: {recommendation.splitPct.toFixed(0)}%</span>
              <ProvenanceBadge provenance="MODEL_OUTPUT" label="ALLOCATION" source="Split Optimization" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Flexible: {(100 - recommendation.splitPct).toFixed(0)}%</span>
              <ProvenanceBadge provenance="MODEL_OUTPUT" label="ALLOCATION" source="Split Optimization" />
            </div>
          </div>
        </div>
      </div>

      {/* Explainability Layer (§21) */}
      <div
        data-testid="explainability-section"
        className="p-5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-4 shadow-inner"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-200">
              Explainable Decision Rationale
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
              Explainable Rationale
            </span>
          </div>
          <div className="flex items-center gap-2">
            {deadline && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span>Laycan: {deadline}</span>
                <ProvenanceBadge provenance="REAL_VERIFIED" label="CONTRACT" source="Cargo Laycan" />
              </div>
            )}
            <ProvenanceBadge
              provenance="MODEL_OUTPUT"
              label="DETERMINISTIC RATIONALE"
              source="Deterministic Decision Template"
            />
          </div>
        </div>

        {/* Narrative Box */}
        <div className="p-3.5 bg-slate-900/90 rounded-md border border-slate-700/60 text-xs text-slate-100 leading-relaxed font-sans shadow-sm">
          <div className="flex items-start gap-2.5">
            <span className="text-amber-400 font-serif text-lg leading-none select-none">“</span>
            <div data-testid="rationale-narrative" className="flex-1">
              {rationaleObj?.narrative ||
                'Optimization completed satisfying deadline-feasibility and volatility limits.'}
            </div>
          </div>
        </div>

        {/* Driver-by-Driver Breakdown */}
        {drivers.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <span>Decision Drivers & Market Direction</span>
              <span className="text-[10px] text-slate-500 font-sans normal-case">
                Distinguished by favorable vs unfavorable market impact
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {drivers.map((driver, idx) => {
                const prov = getDriverProvenance(driver);
                return (
                  <div
                    key={idx}
                    data-testid="rationale-driver-item"
                    className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-2.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-slate-400">
                        {formatFactorLabel(driver.factor)}
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-100">
                        {formatDriverValue(driver.value)}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                      <div>{renderDirectionBadge(driver.direction)}</div>
                      <div className="flex justify-end">
                        <ProvenanceBadge
                          provenance={prov.provenance}
                          label={driver.factor.toUpperCase()}
                          source={prov.source}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {rationaleObj?.savings_usd && (
          <div className="flex items-center gap-2 pt-2 text-xs border-t border-slate-800/60">
            <span className="text-slate-400">Projected ETLC Savings vs Naive:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatUSD(Number(rationaleObj.savings_usd))}
            </span>
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="ESTIMATED SAVINGS" source="ETLC Cost Model" />
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;
