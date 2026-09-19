import React from 'react';
import { IdleEstimateDto, OpportunityLaneDto } from '../lib/api-client';
import ProvenanceBadge from './ProvenanceBadge';
import { formatUSD, formatInt } from '../lib/formatCurrency';


interface IdleRepositioningPanelProps {
  idleEstimate?: IdleEstimateDto;
}

export const IdleRepositioningPanel: React.FC<IdleRepositioningPanelProps> = ({
  idleEstimate,
}) => {
  if (!idleEstimate) {
    return null;
  }

  const getDemandColor = (strength: string) => {
    switch (strength) {
      case 'HIGH_CONTINUOUS':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60';
      case 'MODERATE_HIGH':
        return 'text-sky-400 border-sky-500/40 bg-sky-950/60';
      case 'MODERATE':
      default:
        return 'text-amber-400 border-amber-500/40 bg-amber-950/60';
    }
  };

  return (
    <div
      data-testid="idle-repositioning-panel"
      className="border border-slate-800 bg-slate-900/90 rounded-xl p-6 shadow-xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            6. Post-Discharge Idle-Time & Repositioning
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-950 text-sky-400 border border-sky-500/40">
            Turnaround & Repositioning Heuristic
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Port Turnaround Distribution</span>
          <ProvenanceBadge
            provenance="REAL_VERIFIED"
            label="PORT TURNAROUND"
            source="IPA Turnaround Model"
          />
        </div>
      </div>

      {/* Mandatory Section 10 Illustrative MVP Disclaimer Banner */}
      <div
        data-testid="idle-disclaimer-banner"
        className="p-4 rounded-lg bg-amber-950/50 border border-amber-500/60 text-amber-200 text-xs flex items-start gap-3 shadow-inner"
      >
        <span className="text-xl leading-none select-none">⚠️</span>
        <div className="space-y-1 flex-1">
          <div className="font-mono font-bold tracking-wide uppercase text-[11px] text-amber-300">
            Operational Context & Fleet Disclosure
          </div>
          <p className="leading-relaxed text-slate-200">
            {idleEstimate.disclaimer ||
              'ILLUSTRATIVE MVP ONLY: Single-voyage heuristic based on public seasonal trade flows. Fleet-level deadheading optimization requires proprietary vessel schedule data.'}
          </p>
          <div className="pt-1 flex items-center gap-2">
            <ProvenanceBadge
              provenance="ASSUMPTION"
              label="DISCLOSURE"
              source="Fleet Architecture Model"
            />
            <span className="text-[10px] text-amber-400/80 font-mono">
              Confirm forward fixture positions with commercial vessel operations desk.
            </span>
          </div>
        </div>
      </div>

      {/* Arrival, Turnaround & Availability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Discharge Port</div>
          <div className="text-lg font-mono font-bold text-slate-100 flex items-center justify-between">
            <span>{idleEstimate.dischargePortName}</span>
            <span className="text-xs font-mono text-slate-500">ID: {idleEstimate.dischargePortId}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Vessel Class:</span>
            <span className="font-mono text-slate-300">{idleEstimate.vesselClassName}</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Est. Arrival Date</div>
          <div className="text-lg font-mono font-bold text-sky-400 flex items-center justify-between">
            <span data-testid="idle-arrival-date">{idleEstimate.estimatedArrivalDate}</span>
            <ProvenanceBadge provenance="REAL_VERIFIED" label="LAYCAN" source="Contract Laycan" />
          </div>
          <div className="text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            Estimated ETA at discharge anchorage
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Port Turnaround Window</div>
          <div className="text-lg font-mono font-bold text-amber-400 flex items-center justify-between">
            <span data-testid="idle-turnaround-days">{idleEstimate.turnaroundDays.toFixed(1)} days</span>
            <ProvenanceBadge provenance="REAL_VERIFIED" label="IPA RATES" source="Port Operations Distribution" />
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Handling: {idleEstimate.handlingDays.toFixed(1)}d</span>
            <span>Queue: {idleEstimate.queueDays.toFixed(1)}d</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950 border border-emerald-500/30 space-y-2 bg-emerald-950/10">
          <div className="text-xs text-emerald-400 uppercase tracking-wide font-semibold">
            Vessel Available For Next Laycan
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400 flex items-center justify-between">
            <span data-testid="idle-available-date">{idleEstimate.availableDate}</span>
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="CALCULATED" source="Arrival + Turnaround" />
          </div>
          <div className="text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            Ready for outbound repositioning / prompt fixture
          </div>
        </div>
      </div>

      {/* Illustrative Opportunity Lanes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
            Illustrative Ballast Opportunity Lanes (Post-Discharge)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Based on UNCTAD & BIMCO trade flow proxies</span>
            <ProvenanceBadge
              provenance="PUBLIC_PROXY"
              label="TRADE LANES"
              source="Public Flow Proxies"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {idleEstimate.opportunityLanes.map((lane: OpportunityLaneDto) => (
            <div
              key={lane.laneId}
              data-testid="opportunity-lane-card"
              className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-sky-400 tracking-wide">
                    {lane.laneId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getDemandColor(
                      lane.seasonalityStrength
                    )}`}
                  >
                    {lane.seasonalityStrength}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-100">{lane.majorPorts}</div>
                <div className="text-xs text-slate-400">{lane.cargoType}</div>

                <p className="text-xs text-slate-400/90 leading-relaxed pt-1 border-t border-slate-900">
                  {lane.notes}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400">Ballast Distance</div>
                    <div className="font-bold text-slate-200 flex items-center justify-between">
                      <span>{formatInt(lane.ballastDistanceNm)} NM</span>
                    </div>
                    <ProvenanceBadge provenance="PUBLIC_PROXY" label="DISTANCE" source="Sea Routes" />
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400">Transit Days</div>
                    <div className="font-bold text-slate-200">
                      {lane.ballastTransitDays.toFixed(1)} days
                    </div>
                    <ProvenanceBadge provenance="MODEL_OUTPUT" label="TRANSIT" source="12.5 kts Speed" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400">Ballast Cost Est.</div>
                    <div className="font-bold text-amber-400">
                      {formatUSD(Math.round(lane.estimatedRepositioningCostUsd))}
                    </div>
                    <ProvenanceBadge provenance="MODEL_OUTPUT" label="OPEX+BUNKER" source="Bunker & Opex Benchmark" />
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400">Seasonal Demand</div>
                    <div className="font-bold text-emerald-400">
                      {lane.seasonalDemandIndex.toFixed(0)} / 100
                    </div>
                    <ProvenanceBadge provenance="PUBLIC_PROXY" label="DEMAND" source="UNCTAD Flow" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IdleRepositioningPanel;
