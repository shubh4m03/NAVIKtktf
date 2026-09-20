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
      <div className="flex-1 flex flex-col relative bg-background">
        {/* Header */}
        <header className="h-16 border-b border-border-subtle flex items-center px-6 shrink-0 bg-surface/50 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-ink">NIRNAY AI Decision Support</h1>
              <p className="text-[10px] text-ink-secondary font-mono tracking-wide">ENGINE: v2.4 (LIVE)</p>
            </div>
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth pb-32">
          <div className="max-w-3xl mx-auto flex flex-col space-y-6">
            
            {/* Initial State / Welcome */}
            {!response && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center">
                  <Compass className="w-8 h-8 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-ink mb-2">How can I assist you?</h2>
                  <p className="text-sm text-ink-secondary max-w-md mx-auto">
                    Ask me to analyze physical berthing constraints, evaluate chartering options, or compute macroeconomic impacts on your active voyage.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg text-left">
                  <button onClick={() => { setQuery(promptPresets[0]); handleAsk(promptPresets[0]); }} className="p-3 bg-surface hover:bg-surface-elevated border border-border-subtle rounded transition-colors text-xs text-ink-secondary hover:text-ink flex items-center justify-between group">
                    <span className="truncate pr-2">Why Capesize is not recommended?</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button onClick={() => { setQuery(promptPresets[1]); handleAsk(promptPresets[1]); }} className="p-3 bg-surface hover:bg-surface-elevated border border-border-subtle rounded transition-colors text-xs text-ink-secondary hover:text-ink flex items-center justify-between group">
                    <span className="truncate pr-2">Spot market vs Time charter</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            )}

            {/* Active Chat Thread */}
            {(isAnalyzing || response) && (
              <>
                {/* User Message Bubble */}
                <div className="flex justify-end animate-fade-in-up">
                  <div className="max-w-[80%] bg-surface-elevated border border-border-subtle p-4 rounded-2xl rounded-tr-sm shadow-subtle">
                    <p className="text-sm text-ink">{query}</p>
                  </div>
                </div>

                {/* AI Response Container */}
                <div className="flex justify-start animate-fade-in">
                  <div className="max-w-[90%] md:max-w-[85%] space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white">
                        <Compass className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-bold text-ink">NIRNAY AI</span>
                    </div>

                    {isAnalyzing ? (
                      <div className="p-4 bg-background-raised border border-border-subtle rounded-2xl rounded-tl-sm space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-brand-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-brand-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-brand-primary/50 rounded-full animate-bounce"></div>
                          </div>
                          <span className="text-xs text-ink-secondary font-mono tracking-wide">Synthesizing hydrodynamics & market spreads...</span>
                        </div>
                      </div>
                    ) : response ? (
                      <div className="bg-background-raised border border-border-subtle rounded-2xl rounded-tl-sm shadow-panel overflow-hidden">
                        {/* Summary / Directive */}
                        <div className="p-5 border-b border-border-subtle">
                           <div className="flex items-center gap-2 mb-2">
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-status-success-bg text-status-success border border-status-success/30">
                               Confidence: {(response.confidence * 100).toFixed(0)}%
                             </span>
                             <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-surface border border-border-subtle text-ink-muted">
                               Objective: {response.objective}
                             </span>
                           </div>
                           <h3 className="text-base font-bold text-ink leading-relaxed">
                             {response.recommendedApproach}
                           </h3>
                        </div>

                        <div className="p-5 space-y-5 bg-surface/30">
                          {/* Rationale */}
                          <div>
                            <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-brand-primary" /> Technical Rationale
                            </h4>
                            <div className="space-y-2">
                              {response.rationale.map((r, i) => (
                                <div key={i} className="flex gap-3 text-sm text-ink-secondary">
                                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-2 shrink-0" />
                                  <span className="leading-relaxed">{r}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tradeoffs */}
                          {response.tradeoffs && (
                            <div>
                              <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-ink-secondary" /> Operational Trade-offs
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {response.tradeoffs.map((t, i) => (
                                  <div key={i} className="p-3 border border-border-subtle text-xs text-ink-secondary flex gap-2 items-start bg-surface/50">
                                    <AlertTriangle className="w-3.5 h-3.5 text-ink-secondary shrink-0 mt-0.5" />
                                    <span>{t}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-12">
          <div className="max-w-3xl mx-auto relative group">
            <input
              type="text"
              placeholder="Ask NIRNAY anything..."
              className="w-full bg-surface border border-border-subtle hover:border-brand-primary/50 focus:border-brand-primary outline-none rounded-none py-4 pl-6 pr-16 text-sm text-ink transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            />
            <button
              className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-primary hover:bg-brand-deep text-background rounded-none flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-brand-primary"
              onClick={() => handleAsk()}
              disabled={isAnalyzing || !query.trim()}
            >
              <Send className="w-4 h-4 -ml-0.5" />
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-ink-muted font-mono tracking-widest uppercase">AI generated content may be inaccurate</span>
          </div>
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
