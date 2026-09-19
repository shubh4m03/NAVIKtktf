// ─────────────────────────────────────────────────────────────
// components/shared/CommandPalette.tsx
// Fast command & maritime search modal (Ctrl/Cmd + K)
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, Ship, Anchor, Globe, FileText, ArrowRight, X } from 'lucide-react';
import { MARITIME_CHOKEPOINTS } from '../route-intelligence/chokepointsData';
import { useMasterData } from '../../hooks/useMasterData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  category: 'Navigation' | 'Port' | 'Vessel' | 'Chokepoint';
  title: string;
  subtitle: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { vessels: mockVessels, ports: mockPorts } = useMasterData();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allItems: SearchItem[] = [
    // Navigation Modules
    {
      id: 'nav-overview',
      category: 'Navigation',
      title: 'Overview',
      subtitle: 'Executive freight dashboard & scenario economics',
      action: () => {
        navigate('/overview');
        onClose();
      },
    },
    {
      id: 'nav-carrier',
      category: 'Navigation',
      title: 'Carrier Intelligence',
      subtitle: 'Fleet optimization, vessel ratings & DWT utilization',
      action: () => {
        navigate('/carrier');
        onClose();
      },
    },
    {
      id: 'nav-market',
      category: 'Navigation',
      title: 'Freight Market',
      subtitle: 'Forward curves, bunker pricing & historical indices',
      action: () => {
        navigate('/market');
        onClose();
      },
    },
    {
      id: 'nav-vessels',
      category: 'Navigation',
      title: 'Vessel Explorer',
      subtitle: 'Parametric 3D commercial vessel inspection & compartments',
      action: () => {
        navigate('/vessels');
        onClose();
      },
    },
    {
      id: 'nav-routes',
      category: 'Navigation',
      title: 'Route Intelligence',
      subtitle: '3D maritime globe, nautical corridors & chokepoints',
      action: () => {
        navigate('/routes');
        onClose();
      },
    },
    {
      id: 'nav-decision',
      category: 'Navigation',
      title: 'Decision Center',
      subtitle: 'Multi-variable chartering feasibility & risk analysis',
      action: () => {
        navigate('/decision');
        onClose();
      },
    },
    {
      id: 'nav-nirnay',
      category: 'Navigation',
      title: 'NIRNAY',
      subtitle: 'Naval architecture decision intelligence & synthesis',
      action: () => {
        navigate('/nirnayn');
        onClose();
      },
    },

    // Commercial Ports
    ...mockPorts.map((p) => ({
      id: `port-${p.id}`,
      category: 'Port' as const,
      title: `${p.name}, ${p.country}`,
      subtitle: `Max Draft: ${p.maxDraftMeters}m · Region: ${p.region} · Congestion: ${(p.congestionIndex * 100).toFixed(0)}%`,
      action: () => {
        navigate('/routes');
        onClose();
      },
    })),

    // Commercial Vessels
    ...mockVessels.map((v) => ({
      id: `vessel-${v.id}`,
      category: 'Vessel' as const,
      title: v.className,
      subtitle: `Capacity: ${(v.capacityTonnes / 1000).toFixed(0)}k DWT · Max Draft: ${v.maxDraftMeters}m · ${v.capabilities.join(', ')}`,
      action: () => {
        navigate('/vessels');
        onClose();
      },
    })),

    // Chokepoints
    ...MARITIME_CHOKEPOINTS.map((cp) => ({
      id: `cp-${cp.id}`,
      category: 'Chokepoint' as const,
      title: cp.name,
      subtitle: `Max Draft: ${cp.maxDraftMeters}m · Status: ${cp.operationalStatus} · ${cp.primaryRisk}`,
      action: () => {
        navigate('/routes');
        onClose();
      },
    })),
  ];

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-xl rounded-md bg-surface border border-border-subtle shadow-2xl overflow-hidden flex flex-col font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle bg-background-raised/50">
          <Search className="w-4 h-4 text-brand-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search maritime corridors, ports, vessels, chokepoints..."
            className="flex-1 bg-transparent border-none outline-hidden text-xs text-ink placeholder:text-ink-muted"
          />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-ink-muted">
            ESC
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-elevated"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-muted">
              No matching maritime resources found for &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full px-3 py-2 rounded text-left flex items-center justify-between gap-3 hover:bg-background-raised transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-brand-primary">
                    {item.category === 'Navigation' && <Compass className="w-3.5 h-3.5" />}
                    {item.category === 'Port' && <Anchor className="w-3.5 h-3.5" />}
                    {item.category === 'Vessel' && <Ship className="w-3.5 h-3.5" />}
                    {item.category === 'Chokepoint' && <Globe className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink group-hover:text-brand-primary transition-colors truncate">
                        {item.title}
                      </span>
                      <span className="text-[9px] px-1 rounded bg-surface-elevated text-ink-secondary">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-muted truncate">{item.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border-subtle bg-background-raised/30 flex items-center justify-between text-[10px] text-ink-muted">
          <span>NAVIK Maritime Directory</span>
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
