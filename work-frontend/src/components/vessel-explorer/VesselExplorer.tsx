// ─────────────────────────────────────────────────────────────
// components/vessel-explorer/VesselExplorer.tsx
// Commercial Maritime Vessel Intelligence & Technical Workstation
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Ship, CheckCircle2, XCircle, AlertTriangle, Gauge, Compass, Sliders, Layers, Box, Cpu, Info, Loader2 } from 'lucide-react';
import { VesselSubsystem, VisualRenderMode, SUBSYSTEMS } from './VesselTypes';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { useScenario } from '../../context/ScenarioContext';
import { useMasterData } from '../../hooks/useMasterData';
import type { VesselClass } from '../../types';
import { Vessel3DViewer } from './Vessel3DViewer';

export default function VesselExplorer() {
  const { scenario, updateCargo, updateVessel } = useScenario();
  const { vessels, isLoading: isMasterDataLoading, error: masterDataError } = useMasterData();

  const [selectedVessel, setSelectedVessel] = useState<VesselClass | null>(null);

  // Initialize selectedVessel once vessels are loaded
  useEffect(() => {
    if (!selectedVessel && vessels.length > 0) {
      const initial = scenario.vessel.classId 
        ? vessels.find(v => v.id === scenario.vessel.classId) || null
        : null;
      if (initial) setSelectedVessel(initial);
    }
  }, [vessels, scenario.vessel.classId, selectedVessel]);
  
  const simulatedCargoMt = scenario.cargo.parcelSizeMt;
  const simulatedSpeedKnots = scenario.vessel.serviceSpeedKts;

  // Technical 3D Inspection States
  const [activeSubsystem, setActiveSubsystem] = useState<VesselSubsystem>('all');
  const [visualMode, setVisualMode] = useState<VisualRenderMode>('solid');
  const [explodedProgress, setExplodedProgress] = useState<number>(0);

  const handleSelectVessel = (v: VesselClass) => {
    setSelectedVessel(v);
    
    const newCargoMt = Math.round(v.capacityTonnes * 0.85);
    updateCargo({ parcelSizeMt: newCargoMt });
    
    const newSpeed = v.avgSpeedKnots || 14.0;
    
    // Auto-calculate draft and update context
    const estimatedDraft = Number((v.maxDraftMeters * 0.45 + (newCargoMt / v.capacityTonnes) * (v.maxDraftMeters * 0.55)).toFixed(2));
    updateVessel({ classId: v.id, serviceSpeedKts: newSpeed, operatingDraftM: estimatedDraft });
    
    setActiveSubsystem('all');
  };

  // Cargo capacity simulation calculation
  const loadPercentage = selectedVessel ? Math.round((simulatedCargoMt / selectedVessel.capacityTonnes) * 100) : 0;
  const estimatedDraft = selectedVessel ? Number(
    (selectedVessel.maxDraftMeters * 0.45 + (simulatedCargoMt / selectedVessel.capacityTonnes) * (selectedVessel.maxDraftMeters * 0.55)).toFixed(2)
  ) : 0;
  
  // Sync calculated draft to context if it's drifting, but avoid infinite loops
  useEffect(() => {
    if (selectedVessel && Math.abs(scenario.vessel.operatingDraftM - estimatedDraft) > 0.1) {
      updateVessel({ operatingDraftM: estimatedDraft });
    }
  }, [estimatedDraft, scenario.vessel.operatingDraftM, updateVessel, selectedVessel]);

  const isPanamaEligible = selectedVessel ? (selectedVessel.beamMeters || 32.2) <= 32.31 && (selectedVessel.lengthMeters || 225) <= 294.13 && estimatedDraft <= 12.04 : false;
  const isSuezEligible = selectedVessel ? estimatedDraft <= 20.1 : false;
  const isMalaccaEligible = selectedVessel ? estimatedDraft <= 20.5 : false;

  const isOverweight = selectedVessel ? simulatedCargoMt > selectedVessel.capacityTonnes : false;

  const currentSubsystemInfo = SUBSYSTEMS.find((s) => s.id === activeSubsystem) || SUBSYSTEMS[0]!;

  if (isMasterDataLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-ink">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          <p className="text-sm font-mono text-ink-muted">Loading Vessel Fleet...</p>
        </div>
      </div>
    );
  }

  if (masterDataError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-ink">
        <div className="flex flex-col items-center gap-4 text-status-danger p-6 border border-status-danger/30 bg-status-danger/10 rounded">
          <AlertTriangle className="w-8 h-8" />
          <p className="text-sm font-bold">Failed to load vessels.</p>
          <p className="text-xs">{masterDataError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ship className="w-4 h-4 text-brand-primary" />
            <h1 className="text-base font-bold text-ink tracking-normal">
              Vessel Intelligence &amp; 3D Hydrodynamic Inspection
            </h1>
          </div>
          <p className="text-xs text-ink-secondary">
            Parametric naval architecture inspection, cargo hold volumetrics, machinery compartments, and canal clearances.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-muted">Carrier Fleet:</span>
          <span className="text-brand-primary font-semibold px-2 py-0.5 rounded bg-surface border border-border-subtle">
            {vessels.length} Commercial Classes
          </span>
        </div>
      </div>

      {/* Main Grid: Selector, 3D Canvas, Technical Specs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Left Column: Vessel Class Library (3 cols) */}
        <div className="xl:col-span-3 space-y-3.5">
          <div className="card p-3">
            <h2 className="card-title mb-2.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-brand-primary" />
              Carrier Classes
            </h2>
            <div className="space-y-1.5">
              {vessels.map((vessel) => {
                const isSelected = selectedVessel && vessel.id === selectedVessel.id;
                return (
                  <button
                    key={vessel.id}
                    onClick={() => handleSelectVessel(vessel)}
                    className={`w-full text-left p-2.5 rounded border transition-colors ${
                      isSelected
                        ? 'bg-surface-elevated border-brand-primary text-ink font-semibold'
                        : 'bg-background-raised border-border-subtle text-ink-secondary hover:text-ink hover:border-border-subtle-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono text-xs ${isSelected ? 'text-brand-primary font-bold' : 'text-ink'}`}>
                        {vessel.className}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface border border-border-subtle text-ink-muted">
                        {vessel.capacityTonnes >= 1000 ? `${(vessel.capacityTonnes / 1000).toFixed(0)}k DWT` : `${vessel.capacityTonnes} DWT`}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-secondary line-clamp-2 leading-relaxed">
                      {vessel.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Canal Compatibility Matrix */}
          <div className="card p-3 space-y-2">
            <h3 className="card-title text-[11px]">Chokepoint Transit Verification</h3>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex flex-col p-2 rounded bg-background-raised border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-ink-secondary">Panama Locks (Original)</span>
                  {isPanamaEligible ? (
                    <span className="inline-flex items-center gap-1 text-status-success font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ELIGIBLE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-status-danger font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> INELIGIBLE
                    </span>
                  )}
                </div>
                {!isPanamaEligible && selectedVessel && (
                  <div className="text-[10px] text-status-danger bg-status-danger/10 px-1.5 py-0.5 rounded border border-status-danger/20 self-end">
                    {estimatedDraft > 12.04 ? `Draft: ${estimatedDraft}m > 12.0m` : `Beam: ${selectedVessel.beamMeters}m > 32.3m`}
                  </div>
                )}
              </div>

              <div className="flex flex-col p-2 rounded bg-background-raised border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-ink-secondary">Suez Canal (&lt; 20.1m)</span>
                  {isSuezEligible ? (
                    <span className="inline-flex items-center gap-1 text-status-success font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ELIGIBLE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-status-warning font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" /> DRAFT LIMIT
                    </span>
                  )}
                </div>
                {!isSuezEligible && selectedVessel && (
                  <div className="text-[10px] text-status-warning bg-status-warning/10 px-1.5 py-0.5 rounded border border-status-warning/20 self-end">
                    Draft: {estimatedDraft}m &gt; 20.1m
                  </div>
                )}
              </div>

              <div className="flex flex-col p-2 rounded bg-background-raised border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-ink-secondary">Strait of Malacca (&lt; 20.5m)</span>
                  {isMalaccaEligible ? (
                    <span className="inline-flex items-center gap-1 text-status-success font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ELIGIBLE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-status-danger font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> MALACCAMAX
                    </span>
                  )}
                </div>
                {!isMalaccaEligible && selectedVessel && (
                  <div className="text-[10px] text-status-danger bg-status-danger/10 px-1.5 py-0.5 rounded border border-status-danger/20 self-end">
                    Draft: {estimatedDraft}m &gt; 20.5m
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: High-Fidelity 3D Viewport (6 cols) */}
        <div className="xl:col-span-6 flex flex-col h-[600px] border border-border-subtle bg-gradient-to-b from-[#eaf3f7] to-[#d0e5f2] dark:from-[#05101a] dark:to-[#071827] rounded relative">
          {selectedVessel ? (
            <ErrorBoundary fallbackMessage="The 3D Naval Architecture Viewer failed to load the requested GLTF asset. Please select a different vessel class or reload the module.">
              <React.Suspense fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                  <p className="text-xs text-ink font-mono">Loading Hydrodynamic Model...</p>
                </div>
              }>
                <Vessel3DViewer
                  vesselClass={selectedVessel.className}
                  dwt={selectedVessel.capacityTonnes}
                  draft={estimatedDraft}
                  designDraft={selectedVessel.maxDraftMeters}
                  beam={selectedVessel.beamMeters || 32.2}
                  lengthOverall={selectedVessel.lengthMeters || 225}
                  speedKnots={simulatedSpeedKnots}
                  payloadMt={simulatedCargoMt}
                  activeSubsystem={activeSubsystem}
                  onSelectSubsystem={setActiveSubsystem}
                  visualMode={visualMode}
                  onChangeVisualMode={setVisualMode}
                  explodedProgress={explodedProgress}
                  onChangeExplodedProgress={setExplodedProgress}
                />
              </React.Suspense>
            </ErrorBoundary>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 space-y-4">
              <Box className="w-16 h-16 text-brand-primary" />
              <div className="text-center">
                <h4 className="text-sm font-bold text-ink mb-1">Awaiting vessel selection</h4>
                <p className="text-xs text-ink-secondary">Select a carrier class from the library to load structural models</p>
              </div>
              <div className="w-64 h-1 bg-border-subtle rounded overflow-hidden">
                <div className="h-full bg-brand-primary/20 w-full loading-shimmer" />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Technical Subsystems & Inspection Telemetry (3 cols) */}
        <div className="xl:col-span-3 space-y-3.5">
          {/* Subsystem Inspection Targeting */}
          <div className="card p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h3 className="card-title flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-primary" />
                Engineering Subsystems
              </h3>
              <span className="text-xs text-brand-primary font-semibold capitalize">
                {activeSubsystem}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              {SUBSYSTEMS.map((sub) => {
                const isSelected = activeSubsystem === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setActiveSubsystem(sub.id);
                      if (sub.id !== 'all' && visualMode === 'solid') {
                        setVisualMode('xray'); // Automatically switch to X-ray to reveal internal component
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded border text-left transition-colors ${
                      isSelected
                        ? 'bg-brand-primary text-white border-brand-primary font-semibold'
                        : 'bg-background-raised border-border-subtle text-ink-secondary hover:text-ink hover:border-border-subtle-strong'
                    }`}
                  >
                    <div className="text-[10px] text-ink-secondary mb-0.5">{sub.category}</div>
                    <div className="text-xs font-medium truncate">{sub.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Subsystem Description Box */}
            <div className="p-2.5 rounded bg-background-raised border border-border-subtle space-y-1 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-ink font-semibold">{currentSubsystemInfo.name}</span>
                <span className="text-[10px] text-brand-primary">{currentSubsystemInfo.telemetry}</span>
              </div>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                {currentSubsystemInfo.description}
              </p>
            </div>
          </div>

          {/* Engineering Dimensions */}
          <div className="card p-3.5 space-y-2.5">
            <h3 className="card-title flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-brand-primary" />
              Naval Architecture Parameters
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2 rounded bg-background-raised border border-border-subtle ${!selectedVessel && 'opacity-50'}`}>
                <div className="text-[11px] text-ink-secondary mb-0.5">Length (LOA)</div>
                <div className="text-xs font-mono font-bold text-ink mt-0.5">{selectedVessel ? (selectedVessel.lengthMeters || 225).toFixed(0) : '--'} m</div>
              </div>

              <div className={`p-2 rounded bg-background-raised border border-border-subtle ${!selectedVessel && 'opacity-50'}`}>
                <div className="text-[11px] text-ink-secondary mb-0.5">Molded beam</div>
                <div className="text-xs font-mono font-bold text-ink mt-0.5">{selectedVessel ? (selectedVessel.beamMeters || 32.2).toFixed(1) : '--'} m</div>
              </div>

              <div className={`p-2 rounded bg-background-raised border border-border-subtle ${!selectedVessel && 'opacity-50'}`}>
                <div className="text-[11px] text-ink-secondary mb-0.5">Scantling draft</div>
                <div className="text-xs font-mono font-bold text-brand-primary mt-0.5">{selectedVessel ? selectedVessel.maxDraftMeters.toFixed(1) : '--'} m</div>
              </div>

              <div className={`p-2 rounded bg-background-raised border border-border-subtle ${!selectedVessel && 'opacity-50'}`}>
                <div className="text-[11px] text-ink-secondary mb-0.5">Service speed</div>
                <div className="text-xs font-mono font-bold text-ink mt-0.5">{selectedVessel ? selectedVessel.avgSpeedKnots.toFixed(1) : '--'} kts</div>
              </div>
            </div>
          </div>

          {/* Real-time Draft & Payload Loading Simulator */}
          <div className="card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="card-title flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-primary" />
                Hydrodynamic Load Simulator
              </h3>
              <span className={`text-xs font-mono font-bold ${isOverweight ? 'text-status-danger' : 'text-brand-primary'}`}>
                {loadPercentage}% DWT
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-ink-secondary">Cargo Tonnage:</span>
                <span className="text-ink font-semibold">{simulatedCargoMt.toLocaleString()} MT</span>
              </div>
              <input
                type="range"
                min={selectedVessel ? Math.round(selectedVessel.capacityTonnes * 0.2) : 0}
                max={selectedVessel ? Math.round(selectedVessel.capacityTonnes * 1.2) : 100000}
                step={500}
                value={simulatedCargoMt}
                onChange={(e) => updateCargo({ parcelSizeMt: Number(e.target.value) })}
                className="w-full h-1.5 bg-background-raised rounded appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedVessel}
              />
            </div>

            {/* Dynamic Calculated Results */}
            <div className={`p-2 rounded bg-background-raised border border-border-subtle space-y-1 text-xs font-mono ${!selectedVessel && 'opacity-50'}`}>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Operating Draft:</span>
                <span className={`font-bold ${selectedVessel && estimatedDraft > selectedVessel.maxDraftMeters ? 'text-status-danger' : 'text-brand-primary'}`}>
                  {estimatedDraft} m / {selectedVessel ? selectedVessel.maxDraftMeters : '--'} m
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Classification:</span>
                {!selectedVessel ? (
                  <span className="text-ink-muted">Awaiting vessel</span>
                ) : isOverweight ? (
                  <span className="text-status-danger font-semibold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> EXCEEDS DWT LIMIT
                  </span>
                ) : estimatedDraft > selectedVessel.maxDraftMeters ? (
                  <span className="text-status-warning font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Overdraft risk
                  </span>
                ) : (
                  <span className="text-status-success font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Seaworthy &amp; compliant
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Propulsion & Transit Speed Simulator */}
          <div className="card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="card-title flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-brand-primary" />
                Propulsion &amp; Speed
              </h3>
              <span className="text-xs font-mono font-bold text-brand-primary">
                {simulatedSpeedKnots.toFixed(1)} KTS
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-ink-secondary">Engine Output:</span>
                <span className="text-ink font-semibold">
                  {selectedVessel ? Math.min(110, Math.round((simulatedSpeedKnots / (selectedVessel.avgSpeedKnots || 14.0)) * 85)) : 0}% MCR
                </span>
              </div>
              <input
                type="range"
                min={8.0}
                max={selectedVessel ? Math.max(22.0, Number(((selectedVessel.avgSpeedKnots || 14.0) * 1.35).toFixed(1))) : 22.0}
                step={0.5}
                value={simulatedSpeedKnots}
                onChange={(e) => updateVessel({ serviceSpeedKts: Number(e.target.value) })}
                className="w-full h-1.5 bg-background-raised rounded appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedVessel}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
