import React from 'react';
import { VesselRankingSummaryDto } from '../lib/api-client';
import ProvenanceBadge from './ProvenanceBadge';
import { formatUSD } from '../lib/formatCurrency';


interface VesselRankingTableProps {
  rankings: VesselRankingSummaryDto[];
  portName?: string;
}

export const VesselRankingTable: React.FC<VesselRankingTableProps> = ({ rankings, portName = 'Paradip' }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-100">1. Physical Feasibility & Scoring</h3>
          <div className="flex items-center gap-1.5 bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono text-xs">
            <span>{rankings.length} Vessels Evaluated</span>
            <ProvenanceBadge provenance="REAL_VERIFIED" label="CATALOG" source="SAIL Fleet Register" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Ruleset: Physical Feasibility Filters</span>
          <ProvenanceBadge provenance="ASSUMPTION" label="PORT LIMITS: ASSUMPTION" source={`${portName} Port Trust Master Plan`} />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Hard physical constraints (Draft, LOA, Beam, DWT) eliminate non-compliant vessels with strict audit logging. Surviving candidates are ranked by landed cost & operational fitness.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Vessel Class</th>
              <th className="py-2.5 px-3">Suitability Score</th>
              <th className="py-2.5 px-3">Est. Landed Cost ($)</th>
              <th className="py-2.5 px-3">Expected Delay</th>
              <th className="py-2.5 px-3">Audit Details / Elimination Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {rankings.map((v) => (
              <tr
                key={v.vesselClassId}
                className={v.feasible ? 'bg-slate-900/40 hover:bg-slate-800/30' : 'bg-red-950/10 hover:bg-red-950/20 text-slate-400'}
              >
                <td className="py-3 px-3 whitespace-nowrap">
                  {v.feasible ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                      FEASIBLE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-500/30">
                      ELIMINATED
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 font-semibold text-slate-200">
                  {v.vesselClassName}
                  {v.feasible && v.rank === 1 && (
                    <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] bg-sky-950 text-sky-400 border border-sky-500/30">
                      RANK #1
                    </span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{v.score.toFixed(1)} / 100</span>
                    <ProvenanceBadge provenance="MODEL_OUTPUT" label="CALC" source="Scoring Engine" />
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">
                      {formatUSD(v.estimatedLandedCost)}
                    </span>
                    <ProvenanceBadge provenance="MODEL_OUTPUT" label="MODEL" source="Cost Estimator" />
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-300">{v.expectedDelayDays.toFixed(1)} days</span>
                    <ProvenanceBadge provenance="SIMULATED" label="SIMULATED" source="Port Congestion Engine" />
                  </div>
                </td>
                <td className="py-3 px-3 font-sans">
                  {v.feasible ? (
                    <span className="text-xs text-emerald-400/90 font-mono">Passed draft, LOA, beam, DWT</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-400 font-mono font-medium">{v.infeasibilityReason}</span>
                      <ProvenanceBadge provenance="ASSUMPTION" label="AUDIT LOG" source="Port Depth Policy" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VesselRankingTable;
