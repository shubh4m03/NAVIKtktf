import React from 'react';
import { RiskSummaryDto } from '../lib/api-client';
import ProvenanceBadge from './ProvenanceBadge';

interface RiskPanelProps {
  risk: RiskSummaryDto;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({ risk }) => {
  const getCategoryColor = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'LOW':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case 'HIGH':
        return 'text-rose-400 bg-rose-950/60 border-rose-500/40';
      case 'MEDIUM':
      default:
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-100">3. Comprehensive Risk Score & Top Drivers</h3>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono border font-semibold ${getCategoryColor(risk.category)}`}>
            {risk.category} RISK
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Score: Deterministic Risk Engine</span>
          <ProvenanceBadge provenance="MODEL_OUTPUT" label="MODEL OUTPUT" source="Risk Engine Formula" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Composite Score Gauge */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Composite Risk Score</span>
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="WEIGHTED" source="Multi-Factor Risk Weights" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono text-slate-100">{risk.riskScore.toFixed(1)}</span>
            <span className="text-slate-500 text-sm font-mono">/ 100</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                risk.riskScore > 65 ? 'bg-rose-500' : risk.riskScore > 35 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, risk.riskScore))}%` }}
            />
          </div>
        </div>

        {/* Top Drivers Breakdown */}
        <div className="md:col-span-2 bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300">Top Contributing Factors</span>
            <span>Deterministic Attribution Breakdown</span>
          </div>

          <div className="space-y-2">
            {risk.topDrivers && risk.topDrivers.length > 0 ? (
              risk.topDrivers.map((driver, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">#{idx + 1}</span>
                    <span className="text-slate-200 font-semibold">{driver.display_name || driver.factor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-300">
                      Impact: +{(driver.weighted_contribution || 0).toFixed(1)} pts
                    </span>
                    <ProvenanceBadge
                      provenance={driver.provenance || 'MODEL_OUTPUT'}
                      label={driver.provenance || 'MODEL'}
                      source={driver.source || 'Engine Driver Analysis'}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 italic py-2">
                All component risk drivers within normal operational baselines.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Mitigation */}
      <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg flex items-start gap-3">
        <div className="text-indigo-400 mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-xs space-y-1">
          <div className="font-bold text-indigo-300 flex items-center gap-2">
            <span>Automated Mitigation Advisory</span>
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="POLICY ENGINE" source="Risk Recommendation Heuristic" />
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">{risk.mitigationSuggestion}</p>
        </div>
      </div>
    </div>
  );
};

export default RiskPanel;
