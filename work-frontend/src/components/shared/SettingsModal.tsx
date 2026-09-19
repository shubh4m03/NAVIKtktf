// ─────────────────────────────────────────────────────────────
// components/shared/SettingsModal.tsx
// Professional maritime workstation settings and preferences
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { Settings, X, Sliders, Shield, Database, Cpu, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-mono">
      <div
        className="w-full max-w-md rounded-md bg-surface border border-border-subtle shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-background-raised/50">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-primary" />
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
              System Settings &amp; Parameters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-elevated"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          {/* Operational Metrics */}
          <div className="space-y-2">
            <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider block">
              Hydrographic Standards
            </span>

            <div className="flex items-center justify-between p-2.5 rounded bg-background-raised border border-border-subtle">
              <div>
                <span className="text-ink font-semibold block">Distance &amp; Navigation</span>
                <span className="text-[10px] text-ink-muted">Geodesic Nautical Miles (NM)</span>
              </div>
              <span className="text-[10px] font-semibold text-brand-primary px-2 py-0.5 rounded bg-surface border border-border-subtle">
                Standard (NM)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-background-raised border border-border-subtle">
              <div>
                <span className="text-ink font-semibold block">Propulsion Velocity</span>
                <span className="text-[10px] text-ink-muted">Speed through water</span>
              </div>
              <span className="text-[10px] font-semibold text-brand-primary px-2 py-0.5 rounded bg-surface border border-border-subtle">
                Knots (kts)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-background-raised border border-border-subtle">
              <div>
                <span className="text-ink font-semibold block">Bunker Consumption Metric</span>
                <span className="text-[10px] text-ink-muted">Very Low Sulfur Fuel Oil (0.5% S)</span>
              </div>
              <span className="text-[10px] font-semibold text-brand-primary px-2 py-0.5 rounded bg-surface border border-border-subtle">
                Metric Tonnes (MT)
              </span>
            </div>
          </div>

          {/* Model Telemetry */}
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider block">
              Core Engine Baseline
            </span>

            <div className="p-2.5 rounded bg-background-raised border border-border-subtle space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Engine Version:</span>
                <span className="font-semibold text-ink">NAVIK Maritime Core 2.4.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Data Provenance:</span>
                <span className="font-semibold text-brand-primary">Deterministic SIH 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Classification Standard:</span>
                <span className="font-semibold text-ink">IACS Bulk Carrier Rules</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border-subtle bg-background-raised/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition-colors"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
