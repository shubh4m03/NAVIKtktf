import React, { useState, useMemo } from 'react';
import { Ship, Package, Navigation, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Gauge, Layers, Info } from 'lucide-react';
import { CargoProfile, CargoCategory, PortInfo } from '../../types';
import { vesselService, FeasibilityResult } from '../../services/vesselService';
import { useMasterData } from '../../hooks/useMasterData';
import { useScenario } from '../../context/ScenarioContext';

export default function CarrierIntelligence() {
  const { scenario, updateCargo, updateLane } = useScenario();
  
  // Local state for UI only (not persisted context)
  const [cargoCategory, setCargoCategory] = useState<CargoCategory>(scenario.cargo.commodity === 'LNG' ? 'liquid-bulk' : 'dry-bulk');
  
  const destPortId = scenario.lane.destPortId;
  const originPortId = scenario.lane.originPortId;
  const weightTonnes = scenario.cargo.parcelSizeMt;
  const isPerishable = scenario.cargo.isPerishable;

  const { vessels, ports, isLoading: isMasterDataLoading, error: masterDataError } = useMasterData();

  const fallbackPort = { id: 'fallback', name: 'Loading...', lat: 0, lng: 0, maxDraftMeters: 20, congestionIndex: 0.5, country: '', unlocode: '', status: 'normal' as any, hasTerminals: true };
  const destinationPort = useMemo(
    () => ports.find((p) => p.id === destPortId) || ports[2] || fallbackPort,
    [destPortId, ports]
  );
  const originPort = useMemo(
    () => ports.find((p) => p.id === originPortId) || ports[1] || fallbackPort,
    [originPortId, ports]
  );

  const cargoProfile: CargoProfile = useMemo(
    () => ({
      id: 'cargo-user-sim',
      type: cargoCategory === 'dry-bulk' ? 'Coking Coal' : cargoCategory === 'liquid-bulk' ? 'LNG' : 'General Cargo',
      category: cargoCategory,
      weightTonnes: Number(weightTonnes) || 1000,
      status: isPerishable ? 'perishable' : 'standard',
      isOversized: false,
      temperatureRequirement: isPerishable ? -20 : undefined,
    }),
    [cargoCategory, weightTonnes, isPerishable]
  );

  const evaluation = useMemo(() => {
    return vesselService.evaluateFeasibility(vessels, cargoProfile, destinationPort);
  }, [cargoProfile, destinationPort, vessels]);

  if (isMasterDataLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-ink">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-ink-muted border-t-brand-primary rounded-full animate-spin" />
          <p className="text-sm font-mono text-ink-muted">Loading Carrier Intelligence...</p>
        </div>
      </div>
    );
  }

  if (masterDataError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-ink">
        <div className="flex flex-col items-center gap-4 text-status-danger p-6 border border-status-danger/30 bg-status-danger/10 rounded">
          <AlertTriangle className="w-8 h-8" />
          <p className="text-sm font-bold">Failed to load intelligence data.</p>
          <p className="text-xs">{masterDataError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ship className="w-4 h-4 text-brand-primary" />
            <h1 className="text-base font-bold text-ink tracking-normal">
              Carrier Discovery &amp; Feasibility Engine
            </h1>
          </div>
          <p className="text-xs text-ink-secondary">
            Enforce physical berthing draft constraints, deadfreight parcel utilization, and cargo equipment compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-ink-muted">DESTINATION DRAFT LIMIT:</span>
          <span className="text-brand-primary font-semibold px-2 py-0.5 rounded bg-surface border border-border-subtle">
            {destinationPort.maxDraftMeters.toFixed(1)} m ({destinationPort.name})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left Side: Cargo Parameters & Port Terminals (4 cols) */}
        <div className="xl:col-span-4 space-y-3.5">
          <div className="card p-3.5 space-y-3">
            <div className="card-header px-0 pt-0">
              <Package className="w-3.5 h-3.5 text-brand-primary" />
              <h2 className="card-title">Cargo Specification</h2>
            </div>

            <div className="space-y-2.5">
              <div className="field-group">
                <label className="field-label">Cargo Category</label>
                <select
                  className="field-input font-mono"
                  value={cargoCategory}
                  onChange={(e) => {
                    const cat = e.target.value as CargoCategory;
                    setCargoCategory(cat);
                    if (cat === 'dry-bulk' && weightTonnes < 30000) updateCargo({ parcelSizeMt: 70000 });
                    if (cat === 'container') updateCargo({ parcelSizeMt: 45000 });
                    if (cat === 'liquid-bulk') updateCargo({ parcelSizeMt: 65000 });
                  }}
                >
                  <option value="dry-bulk">Dry Bulk (Coal, Iron Ore, Grain)</option>
                  <option value="liquid-bulk">Liquid Bulk (LNG, Crude, Chemicals)</option>
                  <option value="container">Container (TEU Units)</option>
                  <option value="breakbulk">Breakbulk / Heavy Machinery</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Cargo Weight (Metric Tonnes)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="500"
                    className="field-input font-mono pr-10"
                    value={weightTonnes || ''}
                    onChange={(e) => updateCargo({ parcelSizeMt: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0 })}
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-mono text-ink-muted pointer-events-none">
                    MT
                  </span>
                </div>
              </div>

              {/* Perishable Checkbox */}
              <label className="flex items-center gap-2 p-2 rounded bg-background-raised border border-border-subtle text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPerishable}
                  onChange={(e) => updateCargo({ isPerishable: e.target.checked })}
                  className="rounded bg-surface border-border-subtle text-brand-primary focus:ring-0"
                />
                <span className="text-ink font-mono text-[11px]">Requires Controlled Atmosphere / Reefer Gear</span>
              </label>
            </div>
          </div>

          <div className="card p-3.5 space-y-3">
            <div className="card-header px-0 pt-0">
              <Navigation className="w-3.5 h-3.5 text-brand-primary" />
              <h2 className="card-title">Voyage Terminals</h2>
            </div>

            <div className="space-y-2.5">
              <div className="field-group">
                <label className="field-label">Origin Port</label>
                <select
                  value={originPortId}
                  onChange={(e) => updateLane({ originPortId: e.target.value })}
                  className="field-input font-mono"
                >
                  {ports.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Destination Port</label>
                <select
                  value={destPortId}
                  onChange={(e) => updateLane({ destPortId: e.target.value })}
                  className="field-input font-mono"
                >
                  {ports.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.country}) · Draft: {p.maxDraftMeters}m
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Port Operational Warning */}
            {destinationPort.maxDraftMeters < 15 && (
              <div className="p-2.5 rounded bg-background-raised border border-status-warning/40 flex items-start gap-2 text-xs text-status-warning">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Draft Restriction Alert:</strong> {destinationPort.name} enforces a maximum berth draft of {destinationPort.maxDraftMeters}m. Deepwater Capesize carriers will be disqualified.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Feasibility Matrix Results (8 cols) */}
        <div className="xl:col-span-8 space-y-3.5">
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="card p-3">
              <span className="text-[10px] font-mono uppercase text-ink-secondary">Vessels Evaluated</span>
              <div className="text-xl font-bold text-ink font-mono mt-0.5">{vessels.length} Classes</div>
            </div>
            <div className="card p-3">
              <span className="text-[10px] font-mono uppercase text-status-success">Physically Seaworthy</span>
              <div className="text-xl font-bold text-status-success font-mono mt-0.5">
                {evaluation.feasible.length} Options
              </div>
            </div>
            <div className="card p-3 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-status-danger">Disqualified</span>
              <div className="text-xl font-bold text-status-danger font-mono mt-0.5">
                {evaluation.infeasible.length} Infeasible
              </div>
            </div>
          </div>

          {/* Compatible Vessels */}
          <div className="space-y-2.5">
            <h3 className="card-title text-status-success flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
              Optimal &amp; Feasible Carrier Classes
            </h3>

            {evaluation.feasible.length === 0 ? (
              <div className="card p-6 text-center text-xs font-mono text-ink-secondary">
                No registered vessel classes currently satisfy all combined draft, capacity, and cargo handling constraints.
              </div>
            ) : (
              <div className="space-y-2">
                {evaluation.feasible.map(({ vessel, compatibilityScore }, idx) => {
                  const utilization = Math.round((weightTonnes / vessel.capacityTonnes) * 100);
                  const operatingDraft = Number(
                    (vessel.maxDraftMeters * 0.5 + (weightTonnes / vessel.capacityTonnes) * (vessel.maxDraftMeters * 0.5)).toFixed(1)
                  );

                  return (
                    <div
                      key={vessel.id}
                      className={`card p-3.5 transition-colors border ${
                        idx === 0
                          ? 'border-brand-primary bg-surface-elevated shadow-panel'
                          : 'border-border-subtle hover:border-border-subtle-strong'
                      }`}
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold text-ink font-mono">{vessel.className}</span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-brand-primary/15 text-brand-primary border border-brand-primary/30 font-semibold">
                              OPTIMAL MATCH
                            </span>
                          )}
                          {idx > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface-sunken text-ink-secondary border border-border-subtle font-semibold">
                              RANK #{idx + 1}
                            </span>
                          )}
                        </div>

                      <p className="text-[11px] text-ink-secondary mb-2.5">{vessel.description}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-2 border-t border-border-subtle">
                        <div className="p-2 rounded bg-background-raised">
                          <span className="text-[9px] text-ink-secondary uppercase block">DWT Capacity</span>
                          <span className="text-ink font-semibold">{vessel.capacityTonnes.toLocaleString()} MT</span>
                        </div>
                        <div className="p-2 rounded bg-background-raised">
                          <span className="text-[9px] text-ink-secondary uppercase block">Hold Utilization</span>
                          <span className="text-brand-primary font-semibold">{utilization}%</span>
                        </div>
                        <div className="p-2 rounded bg-background-raised">
                          <span className="text-[9px] text-ink-secondary uppercase block">Laden Draft</span>
                          <span className="text-ink font-semibold">{operatingDraft} m</span>
                        </div>
                        <div className="p-2 rounded bg-background-raised">
                          <span className="text-[9px] text-ink-secondary uppercase block">Service Speed</span>
                          <span className="text-ink font-semibold">{vessel.avgSpeedKnots} kts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Infeasible Vessels with Physics Explanations */}
          <div className="space-y-2 pt-1">
            <h3 className="card-title text-status-danger flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-status-danger" />
              Disqualified Vessels &amp; Constraint Violations
            </h3>

            <div className="space-y-1.5">
              {evaluation.infeasible.map(({ vessel, violation }) => (
                <div
                  key={vessel.id}
                  className="card p-2.5 border-border-subtle bg-background-raised flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink font-mono">{vessel.className}</span>
                      <span className="text-[10px] font-mono text-ink-muted">({vessel.capacityTonnes.toLocaleString()} MT)</span>
                    </div>
                    <div className="text-[11px] text-status-danger font-mono mt-0.5 flex items-center gap-1">
                      <span>Violation:</span>
                      <span className="font-medium">
                        {violation?.kind === 'capacity' && 'Exceeds maximum cargo capacity'}
                        {violation?.kind === 'draft' && 'Exceeds maximum permitted port draft'}
                        {violation?.kind === 'cargoType' && 'Cargo type incompatible with vessel'}
                        {violation?.kind === 'beam' && 'Exceeds maximum canal/berth beam'}
                        {violation?.kind === 'gear' && 'Vessel lacks required cargo gear'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-ink-muted sm:text-right">
                    {violation?.kind === 'capacity' && `${violation.requiredMt.toLocaleString()} MT vs ${violation.vesselDwtMt.toLocaleString()} MT capacity`}
                    {violation?.kind === 'draft' && `Vessel: ${violation.vesselDraftM}m vs Port Max: ${violation.portMaxDraftM}m`}
                    {violation?.kind === 'cargoType' && `${violation.commodity} not supported by ${violation.vesselType}`}
                    {violation?.kind === 'beam' && `${violation.vesselBeamM}m vs Limit: ${violation.limitM}m`}
                    {violation?.kind === 'gear' && `Required: ${violation.required}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
