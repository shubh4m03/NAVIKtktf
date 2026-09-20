import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function CommandStepper() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const STEPS = [
    { id: 1, label: 'Cargo', sub: 'Volume & Spec', path: '/decision' },
    { id: 2, label: 'Ports', sub: 'Draft & Berthing', path: '/ports' },
    { id: 3, label: 'Feasibility', sub: 'Vessel Check', path: '/carrier' },
    { id: 4, label: 'Route', sub: 'Distance & Fuel', path: '/routes' },
    { id: 5, label: 'Market', sub: 'Freight Rates', path: '/market' },
    { id: 6, label: 'Charter', sub: 'Final Output', path: '/what-if' },
  ];

  // Determine active step based on current path
  const activeIndex = STEPS.findIndex(s => s.path === currentPath);
  const isCommandCenter = STEPS.some(s => s.path === currentPath);

  // If not on one of the stepper pages, maybe don't show it or just show it as inactive
  if (!isCommandCenter && currentPath !== '/') return null;

  return (
    <div className="relative z-10 px-6 py-4 bg-background border-b border-border-subtle shrink-0">
      <div className="flex items-center justify-between max-w-4xl mx-auto xl:mx-0">
        {STEPS.map((stage, idx, arr) => {
          const isActive = idx === activeIndex || (activeIndex === -1 && idx === 0 && currentPath === '/decision');
          return (
            <div 
              key={stage.id} 
              onClick={() => navigate(stage.path)} 
              className="flex flex-col items-center relative flex-1 text-center cursor-pointer group"
            >
              {idx < arr.length - 1 && (
                <div className="absolute top-3 left-[50%] right-[-50%] h-px bg-border-strong -z-10" />
              )}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1.5 z-10 transition-colors ${
                isActive ? 'bg-brand-primary text-background ring-4 ring-surface' : 'bg-surface border border-border-strong text-ink-muted group-hover:border-ink-secondary group-hover:text-ink-secondary'
              }`}>
                {stage.id}
              </div>
              <span className={`text-[11px] uppercase tracking-wide font-bold transition-colors ${isActive ? 'text-ink' : 'text-ink-secondary group-hover:text-ink'}`}>
                {stage.label}
              </span>
              <span className="text-[9px] text-ink-muted font-mono">{stage.sub}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
