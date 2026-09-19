import React, { useState } from 'react';
import { ScenarioPerturbationDto } from '../lib/api-client';
import ProvenanceBadge from './ProvenanceBadge';

interface ScenarioControlsProps {
  onRunScenario: (perturbation: ScenarioPerturbationDto) => Promise<void>;
  isLoading: boolean;
  isScenarioActive: boolean;
  onReset: () => void;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  onRunScenario,
  isLoading,
  isScenarioActive,
  onReset,
}) => {
  const [freightShock, setFreightShock] = useState<number>(0);
  const [congestionShock, setCongestionShock] = useState<number>(0);
  const [bunkerShock, setBunkerShock] = useState<number>(0);
  const [availabilityShock, setAvailabilityShock] = useState<number>(0);

  const applyPreset = (f: number, c: number, b: number, a: number) => {
    setFreightShock(f);
    setCongestionShock(c);
    setBunkerShock(b);
    setAvailabilityShock(a);
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRunScenario({
      freight_shock_pct: freightShock,
      congestion_shock_pct: congestionShock,
      bunker_shock_pct: bunkerShock,
      availability_shock_pct: availabilityShock,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-100">4. Interactive What-If Scenario Simulator</h3>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
            POST /api/v1/cargo-requests/&#123;id&#125;/scenario
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isScenarioActive && (
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
              SCENARIO ACTIVE
            </span>
          )}
          <ProvenanceBadge provenance="SIMULATED" label="WHAT-IF ENGINE" source="Scenario Simulator" />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Inject macroeconomic or operational shocks to re-evaluate the full decision pipeline under stressed conditions.
      </p>

      {/* Preset shock buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold mr-1">Stress Presets:</span>
        <button
          type="button"
          data-testid="preset-freight-15"
          onClick={() => applyPreset(15, 0, 0, 0)}
          className="text-xs px-2.5 py-1 rounded bg-sky-950/50 hover:bg-sky-900/60 text-sky-300 border border-sky-700/50 transition-colors"
        >
          Freight +15% (Spot Spike)
        </button>
        <button
          type="button"
          onClick={() => applyPreset(50, 20, 15, -30)}
          className="text-xs px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-700/50 transition-colors"
        >
          Red Sea / Suez Crisis (+50% Freight, +20% Delay)
        </button>
        <button
          type="button"
          onClick={() => applyPreset(30, 40, 0, -20)}
          className="text-xs px-2.5 py-1 rounded bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-700/50 transition-colors"
        >
          Cyclone / East Coast Monsoon (+40% Congestion)
        </button>
        <button
          type="button"
          onClick={() => applyPreset(10, 0, 45, 0)}
          className="text-xs px-2.5 py-1 rounded bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 transition-colors"
        >
          OPEC+ Oil Shock (+45% Bunker)
        </button>
        <button
          type="button"
          onClick={() => applyPreset(0, 0, 0, 0)}
          className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          Reset Sliders
        </button>
      </div>

      <form onSubmit={handleSimulate} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Freight Shock */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium">Freight Rate Shock</label>
              <ProvenanceBadge provenance="SIMULATED" label="PARAM" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                data-testid="input-freight-shock"
                min="-30"
                max="100"
                step="5"
                value={freightShock}
                onChange={(e) => setFreightShock(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-sky-400 w-12 text-right">
                {freightShock > 0 ? `+${freightShock}%` : `${freightShock}%`}
              </span>
            </div>
          </div>

          {/* Congestion Shock */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium">Port Congestion Shock</label>
              <ProvenanceBadge provenance="SIMULATED" label="PARAM" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-20"
                max="100"
                step="5"
                value={congestionShock}
                onChange={(e) => setCongestionShock(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-amber-400 w-12 text-right">
                {congestionShock > 0 ? `+${congestionShock}%` : `${congestionShock}%`}
              </span>
            </div>
          </div>

          {/* Bunker Shock */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium">Bunker Fuel Shock</label>
              <ProvenanceBadge provenance="SIMULATED" label="PARAM" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-20"
                max="80"
                step="5"
                value={bunkerShock}
                onChange={(e) => setBunkerShock(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-purple-400 w-12 text-right">
                {bunkerShock > 0 ? `+${bunkerShock}%` : `${bunkerShock}%`}
              </span>
            </div>
          </div>

          {/* Fleet Availability Shock */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium">Fleet Supply Shock</label>
              <ProvenanceBadge provenance="SIMULATED" label="PARAM" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-50"
                max="50"
                step="5"
                value={availabilityShock}
                onChange={(e) => setAvailabilityShock(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-emerald-400 w-12 text-right">
                {availabilityShock > 0 ? `+${availabilityShock}%` : `${availabilityShock}%`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {isScenarioActive && (
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Reset to Base Request
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Simulating Impact...' : 'Execute What-If Perturbation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScenarioControls;
