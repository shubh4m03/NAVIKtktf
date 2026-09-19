import React, { useState } from 'react';
import { Send, Terminal, CheckCircle2, ChevronRight, Activity, Compass, GitBranch, ArrowRight, ShieldCheck, HelpCircle, History } from 'lucide-react';
import { nirnaynService, NirnayResponse } from '../../services/nirnaynService';
import { useMasterData } from '../../hooks/useMasterData';
import { useScenario } from '../../context/ScenarioContext';

const promptPresets = [
  'Why is Capesize vessel not recommended for Paradip port?',
  'Should we lock in a 30-day time charter now or play the spot market?',
  'What is the cost impact of rerouting via Cape of Good Hope instead of Suez?',
  'Evaluate 75,000 MT coking coal feasibility from Hay Point to Dhamra.',
];

const mockRecentInquiries = [
  { id: '1', title: 'Paradip Port Draft Clearance', date: 'Today 14:20 UTC', status: 'Panamax Validated' },
  { id: '2', title: 'Suez vs Cape War Surcharge', date: 'Today 11:05 UTC', status: 'Cape Recommended' },
  { id: '3', title: 'Q4 Newcastle Spot Volatility', date: 'Yesterday', status: 'Locked 30D' },
];

export default function NirnayCommandCenter() {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [response, setResponse] = useState<NirnayResponse | null>(null);

  const { scenario } = useScenario();
  const { vessels, ports } = useMasterData();
  
  const originPort = ports.find(p => p.id === scenario.lane.originPortId);
  const destPort = ports.find(p => p.id === scenario.lane.destPortId);
  const vesselClass = vessels.find(v => v.id === scenario.vessel.classId) || vessels[0];

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q.trim()) return;
    setIsAnalyzing(true);
    setResponse(null);

    const activeScenarioForBackend = {
        origin: originPort?.name || 'Unknown',
        destination: destPort?.name || 'Unknown',
        cargoTonnage: scenario.cargo.parcelSizeMt,
        commodity: 'Bulk Cargo',
        vessel: {
            class: vesselClass?.className || 'Unknown',
            operatingDraftM: scenario.vessel.operatingDraftM
        }
    };

    const res = await nirnaynService.analyze(q, {
      scenario: activeScenarioForBackend as any
    });

    setResponse(res);
    setIsAnalyzing(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* ── Left Column: Decision Inquiry History (w-64) ── */}
      <aside className="w-64 hidden md:flex flex-col border-r border-border-subtle bg-surface flex-shrink-0">
        <div className="px-3.5 py-2.5 border-b border-border-subtle bg-background-raised flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-brand-primary" />
          <span className="text-xs font-bold text-ink">
            Analysis Archive
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {mockRecentInquiries.map((inq) => (
            <div
              key={inq.id}
              onClick={() => {
                setQuery(inq.title);
                handleAsk(inq.title);
              }}
              className="p-2 rounded border border-border-subtle hover:border-border-subtle-strong bg-background-raised hover:bg-surface-elevated cursor-pointer transition-colors text-xs"
            >
              <div className="text-ink font-medium leading-snug">{inq.title}</div>
              <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted mt-1">
                <span>{inq.date}</span>
                <span className="text-brand-primary">{inq.status}</span>
              </div>
            </div>
          ))}

          <div className="pt-3 border-t border-border-subtle mt-3">
            <span className="text-xs font-medium text-ink-secondary block px-1 mb-1.5">
              Decision Presets
            </span>
            <div className="space-y-1">
              {promptPresets.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(prompt);
                    handleAsk(prompt);
                  }}
                  className="w-full text-left p-1.5 rounded hover:bg-background-raised text-[11px] text-ink-secondary hover:text-ink transition-colors leading-snug line-clamp-2"
                >
                  › {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Center: Decision Synthesis Workstation ── */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto">
        <header className="mb-4 border-b border-border-subtle pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {/* Minimal Navigation Decision Node Mark */}
            <div className="w-7 h-7 rounded bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-ink tracking-normal">
                NIRNAY Maritime Decision Intelligence
              </h1>
              <p className="text-xs text-ink-secondary">
                Explainable chartering optimization, physical berthing validation, and macroeconomic risk synthesis.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-ink-muted">
            ENGINE: <span className="text-brand-primary font-semibold">NIRNAY CORE v2.4</span>
          </div>
        </header>

        {/* Workstation Content Area */}
        <div className="flex-1 flex flex-col space-y-4">
          {/* Initial State */}
          {!response && !isAnalyzing && (
            <div className="card p-6 max-w-xl mx-auto mt-4 space-y-3.5 border border-border-subtle shadow-panel">
              <div className="flex items-center gap-2 text-brand-primary text-xs font-bold">
                <Compass className="w-4 h-4" /> Decision Support Console
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Select an operational dilemma from the archive on the left or type an inquiry into the command console below to generate a physics-grounded maritime synthesis.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
                <div className="p-2.5 rounded bg-background-raised border border-border-subtle">
                  <span className="text-xs text-ink-muted block font-medium mb-1">Physical checks</span>
                  <span className="text-ink">Draft, DWT, Beam, Canal Locks</span>
                </div>
                <div className="p-2.5 rounded bg-background-raised border border-border-subtle">
                  <span className="text-xs text-ink-muted block font-medium mb-1">Commercial checks</span>
                  <span className="text-ink">Time Charter, Spot Spread, Bunker</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Decision Synthesis Output */}
          {response && (
            <div className="card p-5 space-y-4 shadow-panel border border-border-subtle">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-sm font-bold text-ink font-sans">
                    Decision Analysis Synthesis
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-ink-secondary">CERTAINTY:</span>
                  <span className="text-status-success font-semibold bg-status-success-bg px-2 py-0.5 rounded border border-status-success">
                    {(response.confidence * 100).toFixed(0)}% CONFIDENCE
                  </span>
                </div>
              </div>

              {/* Recommended Directive */}
              <div className="p-3.5 rounded bg-background-raised border border-border-subtle space-y-1">
                <span className="text-xs text-brand-primary font-bold">
                  Strategic operational directive
                </span>
                <p className="text-sm text-ink font-bold leading-relaxed">{response.recommendedApproach}</p>
              </div>

              {/* Rationale Breakdown */}
              <div className="space-y-2">
                <span className="text-xs text-ink-secondary font-medium block">
                  Grounding &amp; technical rationale
                </span>
                <div className="space-y-1.5">
                  {response.rationale.map((r, i) => (
                    <div
                      key={i}
                      className="text-xs text-ink flex items-start gap-2.5 p-2 rounded bg-background-raised border border-border-subtle"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-success mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trade-offs */}
              {response.tradeoffs && (
                <div className="space-y-2">
                  <span className="text-xs text-ink-secondary font-medium block">
                    Operational trade-offs &amp; contingencies
                  </span>
                  <div className="space-y-1.5">
                    {response.tradeoffs.map((t, i) => (
                      <div
                        key={i}
                        className="text-xs text-ink-secondary flex items-start gap-2 p-2 rounded bg-background-raised/60 border border-border-subtle/60"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-status-warning mt-0.5 shrink-0" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex justify-between items-center pt-3 border-t border-border-subtle text-xs font-mono">
                <span className="text-ink-muted">Objective: {response.objective}</span>
                <button
                  onClick={() => handleAsk()}
                  className="btn-secondary text-xs"
                >
                  Recalculate
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="card p-8 flex flex-col items-center justify-center space-y-2.5 border border-border-subtle">
              <Terminal className="w-5 h-5 text-brand-primary animate-pulse" />
              <div className="text-xs text-ink font-bold">
                NIRNAY analyzing hydrodynamic drafts &amp; freight spreads...
              </div>
              <p className="text-[11px] text-ink-secondary font-mono">
                Cross-referencing port berth limits, voyage distance, and fuel market momentum
              </p>
            </div>
          )}
        </div>

        {/* Command Console Input */}
        <div className="mt-auto pt-4 relative">
          <input
            type="text"
            placeholder="Ask NIRNAY about cargo feasibility, draft clearances, voyage routing, or charter timing..."
            className="field-input py-2.5 pl-3.5 pr-14 text-xs font-mono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          />
          <button
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-brand-primary hover:bg-brand-primary text-white rounded text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
            onClick={() => handleAsk()}
            disabled={isAnalyzing || !query.trim()}
          >
            <Send className="w-3 h-3" />
            <span>ASK</span>
          </button>
        </div>
      </div>

      {/* ── Right Column: Active Telemetry Context (w-72) ── */}
      <aside className="w-72 hidden xl:flex flex-col p-3.5 bg-surface border-l border-border-subtle space-y-3 flex-shrink-0 overflow-y-auto">
        <div className="flex items-center gap-1.5 text-sm font-sans font-bold text-ink pb-2 border-b border-border-subtle">
          <Activity className="w-3.5 h-3.5 text-brand-primary" /> Active Telemetry Context
        </div>

        {/* Cargo Specification */}
        <div className="card p-3 space-y-1.5">
          <span className="text-xs font-medium text-ink-secondary">Cargo Profile</span>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Commodity:</span>
              <span className="text-ink font-semibold">Bulk Cargo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Volume:</span>
              <span className="text-brand-primary font-semibold">{scenario.cargo.parcelSizeMt.toLocaleString()} MT</span>
            </div>
          </div>
        </div>

        {/* Voyage Corridor */}
        <div className="card p-3 space-y-1.5">
          <span className="text-xs font-medium text-ink-secondary">Trade Lane</span>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Origin:</span>
              <span className="text-ink">{originPort?.name} ({originPort?.country})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Destination:</span>
              <span className="text-ink">{destPort?.name} ({destPort?.country})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Max Berth Draft:</span>
              <span className="text-status-warning font-semibold">{destPort?.maxDraftMeters} m</span>
            </div>
          </div>
        </div>

        {/* Carrier Designation */}
        <div className="card p-3 space-y-1.5">
          <span className="text-xs font-medium text-ink-secondary">Designated Carrier</span>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Class:</span>
              <span className="text-ink font-semibold">{vesselClass?.className}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Operating Draft:</span>
              <span className={`font-semibold ${destPort && scenario.vessel.operatingDraftM > destPort.maxDraftMeters ? 'text-status-danger' : 'text-brand-primary'}`}>
                {scenario.vessel.operatingDraftM.toFixed(1)} m
              </span>
            </div>
          </div>
        </div>

        {/* Market Momentum */}
        <div className="card p-3 space-y-1.5">
          <span className="text-xs font-medium text-ink-secondary">Market Momentum</span>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-ink-secondary">Freight Trend:</span>
            <span className="text-status-success font-semibold">+12.4% (RISING)</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
