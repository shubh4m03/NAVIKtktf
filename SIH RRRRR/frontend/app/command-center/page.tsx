'use client';

import React, { useState } from 'react';
import {
  CreateCargoRequestDto,
  DecisionChainResponseDto,
  ScenarioPerturbationDto,
  createCargoRequest,
  runScenario,
  recomputePortfolio,
} from '../lib/api-client';
import CargoInputForm from '../components/CargoInputForm';
import VesselRankingTable from '../components/VesselRankingTable';
import ForecastPanel from '../components/ForecastPanel';
import RiskPanel from '../components/RiskPanel';
import ScenarioControls from '../components/ScenarioControls';
import RecommendationCard from '../components/RecommendationCard';
import IdleRepositioningPanel from '../components/IdleRepositioningPanel';
import PortfolioPanel from '../components/PortfolioPanel';
import ProvenanceBadge from '../components/ProvenanceBadge';

export default function CommandCenterPage() {
  const [decisionChain, setDecisionChain] = useState<DecisionChainResponseDto | null>(null);
  const [baseDecisionChain, setBaseDecisionChain] = useState<DecisionChainResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scenarioLoading, setScenarioLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCargo = async (payload: CreateCargoRequestDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await createCargoRequest(payload);
      setDecisionChain(res);
      setBaseDecisionChain(res);
    } catch (err: any) {
      console.error('Failed to run cargo pipeline:', err);
      setError(err?.message || 'Pipeline execution failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunScenario = async (perturbation: ScenarioPerturbationDto) => {
    if (!decisionChain) return;
    setScenarioLoading(true);
    setError(null);
    try {
      const res = await runScenario(baseDecisionChain?.id || decisionChain.id, perturbation);
      setDecisionChain(res);
    } catch (err: any) {
      console.error('Failed to run scenario perturbation:', err);
      setError(err?.message || 'Scenario execution failed.');
    } finally {
      setScenarioLoading(false);
    }
  };

  const [portfolioLoading, setPortfolioLoading] = useState<boolean>(false);

  const handleResetScenario = () => {
    if (baseDecisionChain) {
      setDecisionChain(baseDecisionChain);
    }
  };

  const handleLambdaChange = async (lambda: number) => {
    if (!decisionChain) return;
    setPortfolioLoading(true);
    try {
      const updated = await recomputePortfolio(decisionChain.id, lambda);
      setDecisionChain(prev => prev ? { ...prev, portfolioAllocation: updated } : null);
    } catch (err: any) {
      console.error('Failed to recompute portfolio allocation:', err);
    } finally {
      setPortfolioLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-slate-800 pb-4 relative">
          {/* Line 1: Title */}
          <h1 className="page-main-title text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2 mb-3">
            <span className="text-sky-400">⚓</span> SAIL Maritime Freight Command Center
          </h1>

          {/* Line 2: Slim 6-stage pipeline stepper */}
          <div className="flex items-center gap-0 text-xs select-none">
            {[
              { n: 1, label: 'Feasibility' },
              { n: 2, label: 'Forecast' },
              { n: 3, label: 'Risk' },
              { n: 4, label: 'What-If' },
              { n: 5, label: 'Recommend' },
              { n: 6, label: 'Idle / Reposition' },
            ].map((stage, idx) => (
              <div key={stage.n} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-full border-2 border-sky-500/60 bg-slate-900 flex items-center justify-center text-sky-400 font-bold text-[10px]">
                    {stage.n}
                  </div>
                  <span className="text-slate-400 text-[10px] whitespace-nowrap">{stage.label}</span>
                </div>
                {idx < 5 && <div className="w-8 md:w-14 h-px bg-slate-700 mb-4 mx-1" />}
              </div>
            ))}
          </div>

          {/* Top-right: compact provenance legend */}
          <div className="absolute top-0 right-0 flex items-center gap-1 flex-wrap justify-end">
            <ProvenanceBadge provenance="REAL_VERIFIED" label="VERIFIED" />
            <ProvenanceBadge provenance="PUBLIC_PROXY" label="PROXY" />
            <ProvenanceBadge provenance="SIMULATED" label="SIMULATED" />
            <ProvenanceBadge provenance="ASSUMPTION" label="ASSUMPTION" />
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="MODEL" />
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold uppercase tracking-wider text-rose-400 hover:text-rose-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Cargo Input Form */}
        <section>
          <CargoInputForm onSubmit={handleCreateCargo} isLoading={isLoading} />
        </section>

        {/* Degraded State Indicator */}
        {decisionChain?.degraded && (
          <div className="p-4 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="font-semibold">
                Degraded Pipeline Operating Mode: FastAPI ML service was unreachable. Using last cached Redis forecast and baseline heuristics.
              </span>
            </div>
            <ProvenanceBadge provenance="ASSUMPTION" label="DEGRADED CACHE" source="Redis Fallback" />
          </div>
        )}

        {/* Active Pipeline Results */}
        {decisionChain && (
          <div className="space-y-8 animate-fadeIn" data-testid="pipeline-results">
            {/* Step-by-Step Progress Pipeline */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider flex items-center justify-between">
                <span>Autonomous Decision Pipeline Sequence</span>
                <span className="text-sky-400 font-mono">STATUS: {decisionChain.status}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded bg-slate-800/80 border border-emerald-500/40 text-emerald-400">
                  ✔ 1. Feasibility
                </div>
                <div className="p-2 rounded bg-slate-800/80 border border-sky-500/40 text-sky-400">
                  ✔ 2. Quantile Forecast
                </div>
                <div className="p-2 rounded bg-slate-800/80 border border-indigo-500/40 text-indigo-400">
                  ✔ 3. Risk Engine
                </div>
                <div className="p-2 rounded bg-slate-800/80 border border-amber-500/40 text-amber-400">
                  {decisionChain.isScenario ? '✔ 4. Stressed Scenario' : '○ 4. What-If'}
                </div>
                <div className="p-2 rounded bg-slate-800/80 border border-purple-500/40 text-purple-400">
                  ✔ 5. SPLIT Optimizer
                </div>
                <div className="p-2 rounded bg-slate-800/80 border border-cyan-500/40 text-cyan-400">
                  ✔ 6. Idle & Repositioning
                </div>
                <div className="p-2 rounded bg-slate-800/80 border border-violet-500/40 text-violet-400">
                  ✔ 7. Portfolio Strategy
                </div>
              </div>
            </div>

            {/* Stage 1: Feasibility */}
            <section>
              <VesselRankingTable
                rankings={decisionChain.vesselRankings}
                portName={decisionChain.destinationPortName}
              />
            </section>

            {/* Stage 2: Forecast */}
            <section>
              <ForecastPanel
                forecast={decisionChain.forecast}
                routeLabel={`${decisionChain.originRegion} -> ${decisionChain.destinationPortName}`}
              />
            </section>

            {/* Stage 3: Risk Assessment */}
            <section>
              <RiskPanel risk={decisionChain.risk} />
            </section>

            {/* Stage 4: What-If Scenario Simulator */}
            <section>
              <ScenarioControls
                onRunScenario={handleRunScenario}
                isLoading={scenarioLoading}
                isScenarioActive={!!decisionChain.isScenario}
                onReset={handleResetScenario}
              />
            </section>

            {/* Stage 5: Final Recommendation */}
            <section>
              <RecommendationCard
                recommendation={decisionChain.recommendation}
                deadline={decisionChain.deadline}
                isScenario={decisionChain.isScenario}
              />
            </section>

            {/* Stage 6: Post-Discharge Idle-Time & Repositioning (§10) */}
            {decisionChain.idleEstimate && (
              <section>
                <IdleRepositioningPanel idleEstimate={decisionChain.idleEstimate} />
              </section>
            )}

            {/* Stage 7: Charter Portfolio Strategy (§13) */}
            {decisionChain.portfolioAllocation && (
              <section>
                <PortfolioPanel
                  portfolioAllocation={decisionChain.portfolioAllocation}
                  onLambdaChange={handleLambdaChange}
                  isRecomputing={portfolioLoading}
                />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
