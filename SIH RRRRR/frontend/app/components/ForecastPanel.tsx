import React from 'react';
import { ForecastSummaryDto } from '../lib/api-client';
import ProvenanceBadge from './ProvenanceBadge';

interface ForecastPanelProps {
  forecast: ForecastSummaryDto;
  routeLabel?: string;
}

export const ForecastPanel: React.FC<ForecastPanelProps> = ({
  forecast,
  routeLabel = 'Australia -> East Coast India',
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-100">2. Distributional Freight Forecast</h3>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
            {forecast.modelUsed}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Route: {routeLabel}</span>
          <ProvenanceBadge provenance="PUBLIC_PROXY" label="MARKET PROXY" source="Baltic Dry Index (BDI) Proxy" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Median / Expected */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Expected Point Freight</span>
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="MODEL" source={forecast.modelUsed} />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-400">
            ${forecast.expectedValueUsdPerTon.toFixed(2)}
            <span className="text-xs text-slate-400 font-sans font-normal ml-1">/ MT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Quantile Median (\tau = 0.50)
          </div>
        </div>

        {/* 50% Conformal Band */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>50% Prediction Interval</span>
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="CONFORMAL" source="Split-Conformal Calibration" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-200">
            ${forecast.interval50Low.toFixed(2)} – ${forecast.interval50High.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            [\tau = 0.25, \tau = 0.75]
          </div>
        </div>

        {/* 90% Conformal Band */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>90% Prediction Interval</span>
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="CONFORMAL" source="Split-Conformal Calibration" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-200">
            ${forecast.interval90Low.toFixed(2)} – ${forecast.interval90High.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            [\tau = 0.05, \tau = 0.95]
          </div>
        </div>

        {/* Probability > 8% Increase */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Prob Rate Hike (&gt;8%)</span>
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="ESTIMATED" source="Quantile LightGBM CDF" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono ${forecast.probIncreasePct > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {forecast.probIncreasePct.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-between">
            <span>Confidence Score: {forecast.confidenceScore.toFixed(0)}/100</span>
            <ProvenanceBadge provenance="MODEL_OUTPUT" label="CALIBRATED" source="Conformal Coverage" />
          </div>
        </div>
      </div>

      {/* Provenance breakdown banner */}
      <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-400">Feature Lineage & Ingestion Sources:</span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-slate-300 font-mono">FX (USD/INR):</span>
            <ProvenanceBadge provenance="REAL_VERIFIED" label="REAL VERIFIED" source="RBI Reference Rate Feed" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-300 font-mono">Bunker (VLSFO):</span>
            <ProvenanceBadge provenance="PUBLIC_PROXY" label="PUBLIC PROXY" source="FRED Singapore 380CST / Crude Proxy" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-300 font-mono">Congestion:</span>
            <ProvenanceBadge provenance="SIMULATED" label="SIMULATED" source="Synthetic AIS Berthing Simulation" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastPanel;
