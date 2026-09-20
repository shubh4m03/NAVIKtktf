import React from 'react';
import { FileText, Database, TrendingUp, TrendingDown, DollarSign, CloudLightning, Navigation, AlertTriangle, Wind } from 'lucide-react';

export default function EconomicBacktestReport() {
  const demoData = [
    { id: 1, route: 'Hay Point → Dhamra', vessel: 'Panamax', date: '2025-10-15', rate: '$28.50', status: 'Completed' },
    { id: 2, route: 'Newcastle → Paradip', vessel: 'Capesize', date: '2025-10-18', rate: '$21.20', status: 'In Transit' },
    { id: 3, route: 'Gladstone → Haldia', vessel: 'Supramax', date: '2025-10-22', rate: '$31.80', status: 'Scheduled' },
  ];

  const weatherData = [
    { region: 'Bay of Bengal', condition: 'Typhoon Warning', wind: '45 knots', impact: 'Severe Delay', date: '2025-10-20' },
    { region: 'South China Sea', condition: 'Clear', wind: '12 knots', impact: 'None', date: '2025-10-21' },
    { region: 'Indian Ocean', condition: 'Heavy Swell', wind: '28 knots', impact: 'Moderate', date: '2025-10-22' },
  ];

  const portDetails = [
    { port: 'Dhamra Port', congestion: 'High', waitTime: '4.5 Days', status: 'Restricted Berthing' },
    { port: 'Paradip Port', congestion: 'Moderate', waitTime: '2.1 Days', status: 'Normal Operations' },
    { port: 'Haldia Port', congestion: 'Severe', waitTime: '6.0 Days', status: 'Draft Restrictions' },
  ];

  return (
    <div className="flex-1 flex flex-col p-8 bg-background overflow-y-auto">
      <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-4">
        <div className="w-12 h-12 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center">
          <Database className="w-6 h-6 text-brand-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-ink">Detailed Intelligence Reports</h2>
          <p className="text-sm text-ink-secondary">Comprehensive Data: Economic Backtests, Weather Forecasting & Port Analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-border-subtle rounded p-5 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">Total Simulated Savings</p>
            <p className="text-2xl font-bold text-emerald-500">$2.4M</p>
          </div>
          <DollarSign className="w-8 h-8 text-emerald-500/50" />
        </div>
        <div className="bg-surface border border-border-subtle rounded p-5 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">Avg Freight Variance</p>
            <p className="text-2xl font-bold text-brand-primary">-12.4%</p>
          </div>
          <TrendingDown className="w-8 h-8 text-brand-primary/50" />
        </div>
        <div className="bg-surface border border-border-subtle rounded p-5 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">Weather Risk Exposure</p>
            <p className="text-2xl font-bold text-amber-500">18.5%</p>
          </div>
          <CloudLightning className="w-8 h-8 text-amber-500/50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weather Forecast Section */}
        <div className="bg-surface border border-border-subtle rounded shadow-subtle overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-surface-elevated flex items-center gap-2">
            <Wind className="w-4 h-4 text-brand-primary" />
            <h3 className="text-sm font-bold text-ink">Maritime Weather Forecast</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-2 px-2 text-xs font-semibold text-ink-secondary">Region</th>
                  <th className="py-2 px-2 text-xs font-semibold text-ink-secondary">Condition</th>
                  <th className="py-2 px-2 text-xs font-semibold text-ink-secondary">Impact</th>
                </tr>
              </thead>
              <tbody>
                {weatherData.map((row, idx) => (
                  <tr key={idx} className="border-b border-border-subtle last:border-0 hover:bg-background/50">
                    <td className="py-2 px-2 text-sm text-ink">{row.region}</td>
                    <td className="py-2 px-2 text-sm text-ink">{row.condition}</td>
                    <td className="py-2 px-2 text-sm">
                      <span className={`px-2 py-0.5 rounded-none text-[10px] font-mono uppercase tracking-wider border ${row.impact === 'Severe Delay' ? 'border-danger text-danger bg-danger/10' : row.impact === 'Moderate' ? 'border-warning text-warning bg-warning/10' : 'border-success text-success bg-success/10'}`}>
                        {row.impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Port Analytics Section */}
        <div className="bg-surface border border-border-subtle rounded shadow-subtle overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-surface-elevated flex items-center gap-2">
            <Navigation className="w-4 h-4 text-brand-primary" />
            <h3 className="text-sm font-bold text-ink">Port Congestion & Operations</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-2 px-2 text-xs font-semibold text-ink-secondary">Port</th>
                  <th className="py-2 px-2 text-xs font-semibold text-ink-secondary">Congestion</th>
                  <th className="py-2 px-2 text-xs font-semibold text-ink-secondary">Wait Time</th>
                </tr>
              </thead>
              <tbody>
                {portDetails.map((row, idx) => (
                  <tr key={idx} className="border-b border-border-subtle last:border-0 hover:bg-background/50">
                    <td className="py-2 px-2 text-sm text-ink">{row.port}</td>
                    <td className="py-2 px-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-border-strong h-1.5 rounded-none overflow-hidden">
                          <div className={`h-full ${row.congestion === 'High' || row.congestion === 'Severe' ? 'bg-danger' : 'bg-warning'}`} style={{ width: row.congestion === 'Severe' ? '90%' : row.congestion === 'High' ? '70%' : '40%' }} />
                        </div>
                        <span className="text-[10px] text-ink-secondary">{row.congestion}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-sm font-mono text-ink-muted">{row.waitTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border-subtle rounded shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle bg-surface-elevated">
          <h3 className="text-sm font-bold text-ink">Recent Charter Executions (Backtest Data)</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background-raised border-b border-border-subtle">
              <th className="py-3 px-6 text-xs font-semibold text-ink-secondary uppercase">Route</th>
              <th className="py-3 px-6 text-xs font-semibold text-ink-secondary uppercase">Vessel Class</th>
              <th className="py-3 px-6 text-xs font-semibold text-ink-secondary uppercase">Date</th>
              <th className="py-3 px-6 text-xs font-semibold text-ink-secondary uppercase">Execution Rate</th>
              <th className="py-3 px-6 text-xs font-semibold text-ink-secondary uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {demoData.map((row) => (
              <tr key={row.id} className="border-b border-border-subtle hover:bg-background/50 transition-colors">
                <td className="py-3 px-6 text-sm text-ink">{row.route}</td>
                <td className="py-3 px-6 text-sm text-ink">{row.vessel}</td>
                <td className="py-3 px-6 text-sm text-ink">{row.date}</td>
                <td className="py-3 px-6 text-sm font-mono text-brand-primary font-bold">{row.rate}</td>
                <td className="py-3 px-6 text-sm">
                  <span className={`px-2 py-0.5 rounded-none border text-[10px] font-mono uppercase tracking-wider ${row.status === 'Completed' ? 'bg-success/10 border-success text-success' : row.status === 'In Transit' ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' : 'bg-warning/10 border-warning text-warning'}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
