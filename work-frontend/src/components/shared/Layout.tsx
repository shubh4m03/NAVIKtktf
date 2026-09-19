import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, Settings, Menu, X, Compass, LayoutDashboard, LineChart, Ship, ShieldAlert, BrainCircuit, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CommandPalette } from './CommandPalette';
import { SettingsModal } from './SettingsModal';
import { datasetMetadata } from '../../data/metadata';

const NAV_LINKS = [
  { name: 'Dashboard', path: '/decision', icon: LayoutDashboard },
  { name: 'Freight Forecast', path: '/market', icon: LineChart },
  { name: 'Vessel Analysis', path: '/carrier', icon: Ship },
  { name: 'Vessel Explorer', path: '/vessels', icon: Compass },
  { name: 'Disruption Risk', path: '/routes', icon: ShieldAlert },
  { name: 'What-If Simulator', path: '/what-if', icon: Settings },
  { name: 'NIRNAY AI Assistant', path: '/nirnay', icon: BrainCircuit },
  { name: 'Port Intelligence', path: '/ports', icon: Search },
  { name: 'Data & Reports', path: '/reports', icon: FileText },
];

export default function Layout() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-background text-ink selection:bg-brand-primary/30 overflow-hidden">
      
      {/* Global Left Sidebar Navigation */}
      <aside className="w-64 bg-surface border-r border-border-subtle flex-col hidden lg:flex shrink-0 relative z-50">
        
        {/* Brand Lockup */}
        <Link to="/decision" className="h-16 flex items-center px-6 border-b border-border-subtle group focus:outline-hidden">
          <div className="w-8 h-8 rounded bg-brand-primary/15 border border-brand-primary/40 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors shrink-0 mr-3">
            <Compass className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-wider text-ink text-sm font-mono leading-none">
              NAVIK
            </span>
            <span className="text-[9px] tracking-widest text-ink-muted font-mono leading-none mt-1">
              MARITIME INTELLIGENCE
            </span>
          </div>
        </Link>
        
        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-primary/10 text-brand-primary font-bold'
                    : 'text-ink-secondary hover:bg-background-raised hover:text-ink'
                }`
              }
            >
              {({ isActive }) => {
                const Icon = link.icon;
                return (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-ink-muted'}`} />
                    <span>{link.name}</span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>

        {/* Decorative / Utility Bottom Area */}
        <div className="p-4 border-t border-border-subtle mt-auto bg-background/30">
           <div className="flex items-center gap-2 mb-2 text-ink-secondary hover:text-ink cursor-pointer" onClick={() => setSettingsOpen(true)}>
             <Settings className="w-4 h-4 text-ink-muted" />
             <span className="text-xs font-medium">System Settings</span>
           </div>
           
           <div className="flex flex-col gap-1 mt-4">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase text-ink-muted tracking-wider">Status</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success shadow-[0_0_4px_#34d399]" />
                  <span className="text-[9px] font-mono font-bold text-ink">{datasetMetadata.status}</span>
                </div>
             </div>
             <div className="text-[9px] font-mono text-ink-secondary text-right">
                {datasetMetadata.lastUpdated}
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Mobile Header (Only visible on small screens) */}
        <header className="lg:hidden h-14 border-b border-border-subtle bg-surface flex items-center justify-between px-4 sticky top-0 z-40 shrink-0">
          <Link to="/decision" className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-primary" />
            <span className="font-bold font-mono text-ink">NAVIK</span>
          </Link>
          <div className="flex items-center gap-3">
             <button onClick={() => setSearchOpen(true)} className="p-1.5 text-ink-secondary"><Search className="w-4 h-4" /></button>
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 text-ink-secondary">
               {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
             </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-14 z-50 bg-black/80 backdrop-blur-sm flex flex-col animate-fadeIn">
            <div className="bg-surface border-b border-border-subtle shadow-2xl">
              <nav className="p-2 space-y-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${
                        isActive ? 'bg-brand-primary/10 text-brand-primary font-bold border-l-2 border-brand-primary' : 'text-ink-secondary'
                      }`
                    }
                  >
                    {({ isActive }) => {
                       const Icon = link.icon;
                       return (
                         <>
                           <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-ink-muted'}`} />
                           {link.name}
                         </>
                       );
                    }}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col relative overflow-hidden">
           <Outlet />
        </div>
      </main>

      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
