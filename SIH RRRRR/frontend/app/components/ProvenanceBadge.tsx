import React from 'react';
import { ProvenanceState } from '../lib/api-client';

export interface ProvenanceBadgeProps {
  provenance: ProvenanceState | string;
  source?: string;
  date?: string;
  label?: string;
  className?: string;
}

interface BadgeConfig {
  displayText: string;
  defaultTooltip: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const BADGE_CONFIGS: Record<ProvenanceState, BadgeConfig> = {
  REAL_VERIFIED: {
    displayText: 'REAL VERIFIED',
    defaultTooltip: 'Official citable source (IPA, RBI, Port Trust notices)',
    bgClass: 'bg-emerald-950/80',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
  },
  PUBLIC_PROXY: {
    displayText: 'PUBLIC PROXY',
    defaultTooltip: 'Real public benchmark used as stand-in (BDI, crude proxy)',
    bgClass: 'bg-sky-950/80',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500/40',
  },
  SIMULATED: {
    displayText: 'SIMULATED',
    defaultTooltip: 'Statistically generated stochastic simulation',
    bgClass: 'bg-amber-950/80',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/40',
  },
  ASSUMPTION: {
    displayText: 'ASSUMPTION',
    defaultTooltip: 'Assumption — confirm with port authority before operational use',
    bgClass: 'bg-purple-950/80',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/40',
  },
  MODEL_OUTPUT: {
    displayText: 'MODEL OUTPUT',
    defaultTooltip: 'Computed by Quantile LightGBM / Conformal / SPLIT Optimizer',
    bgClass: 'bg-cyan-950/80',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/40',
  },
};

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  provenance,
  source,
  date,
  label,
  className = '',
}) => {
  const normProvenance = (provenance || 'MODEL_OUTPUT').toUpperCase() as ProvenanceState;
  const config = BADGE_CONFIGS[normProvenance] || {
    displayText: normProvenance,
    defaultTooltip: `Data Provenance: ${normProvenance}`,
    bgClass: 'bg-slate-900/80',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-600/40',
  };

  const tooltipParts = [config.defaultTooltip];
  if (source) tooltipParts.push(`Source: ${source}`);
  if (date) tooltipParts.push(`Verified: ${date}`);
  const fullTooltip = tooltipParts.join(' | ');

  return (
    <span
      data-testid="provenance-badge"
      data-provenance={normProvenance}
      title={fullTooltip}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide uppercase border transition-all cursor-help select-none ${config.bgClass} ${config.textClass} ${config.borderClass} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px',
        fontFamily: 'monospace',
        fontWeight: 600,
        letterSpacing: '0.04em',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
          marginRight: '4px',
        }}
      />
      {label || config.displayText}
    </span>
  );
};

export default ProvenanceBadge;
