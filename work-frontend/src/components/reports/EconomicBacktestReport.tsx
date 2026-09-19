import React from 'react';
import { FileText, Database } from 'lucide-react';

export default function EconomicBacktestReport() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ink-secondary bg-background">
      <div className="w-16 h-16 rounded-full bg-surface border border-border-subtle flex items-center justify-center mb-6">
        <Database className="w-8 h-8 text-ink-muted" />
      </div>
      <h2 className="text-xl font-bold text-ink mb-2">Backtest Report Unavailable</h2>
      <p className="text-sm max-w-md mx-auto leading-relaxed">
        The offline walk-forward economic backtest (`walk_forward.py`) has not yet been run in this environment, or its cached output is missing.
        <br/><br/>
        Please run `scripts/run_backtest.sh` in the terminal to generate the backtest evaluation report before viewing.
      </p>
    </div>
  );
}
