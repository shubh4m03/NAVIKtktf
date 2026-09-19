import React, { useState } from 'react';
import { ArrowRight, Waves, Globe, Cpu, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/services/api/client';

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          localStorage.setItem('navik_auth_token', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('navik_refresh_token', data.refreshToken);
          }
          onEnter();
        } else {
          setError('Invalid token received from server.');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to reach the authentication service. Is the backend running?');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-ink font-sans selection:bg-brand-primary/30 flex flex-col relative overflow-hidden">
      {/* Cinematic Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-primary/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-surface border border-border-strong flex items-center justify-center text-brand-primary">
            <Waves className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-widest text-sm font-mono text-ink">NAVIK by TKTF</span>
        </div>
        <div className="text-xs font-mono text-ink-secondary">
          WORKSTATION LOGIN
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-5xl mx-auto text-center mt-8 mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-strong bg-surface text-[10px] font-mono text-brand-primary uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
          Enterprise Maritime Intelligence Platform
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink mb-6 leading-tight">
          Data-Driven Naval Architecture <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-ink to-ink-muted">
            &amp; Freight Intelligence.
          </span>
        </h1>
        
        <p className="text-ink-secondary text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed">
          NAVIK by TKTF is an enterprise platform for voyage optimization, hydrodynamic simulation, and strategic chartering.
        </p>
        
        <form onSubmit={handleLogin} className="flex flex-col items-center w-full max-w-sm mx-auto space-y-4">
          <div className="w-full text-left">
            <label className="block text-xs font-mono text-ink-muted uppercase mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface border border-border-strong rounded px-4 py-3 text-ink focus:outline-none focus:border-brand-primary transition-colors text-sm"
              placeholder="admin"
              required
            />
          </div>
          
          <div className="w-full text-left">
            <label className="block text-xs font-mono text-ink-muted uppercase mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border-strong rounded px-4 py-3 text-ink focus:outline-none focus:border-brand-primary transition-colors text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="w-full flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoggingIn}
            className="group flex items-center justify-center gap-3 w-full px-8 py-4 bg-ink text-background font-semibold rounded hover:bg-ink-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm uppercase tracking-wider mt-4"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Enter Workstation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </main>

      {/* Feature Grid */}
      <section className="relative z-10 w-full bg-background-raised border-t border-border-subtle py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Feature 1 */}
          <div className="space-y-4">
            <div className="w-10 h-10 rounded border border-border-strong bg-surface flex items-center justify-center text-brand-primary">
              <Waves className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ink tracking-wide">Hydrodynamic Simulation</h3>
            <p className="text-ink-muted text-sm leading-relaxed">
              Real-time Draft &amp; DWT calculations. Visualize structural integrity and cargo load distribution instantly across multiple carrier classes.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="space-y-4">
            <div className="w-10 h-10 rounded border border-border-strong bg-surface flex items-center justify-center text-brand-primary">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ink tracking-wide">Algorithmic Routing</h3>
            <p className="text-ink-muted text-sm leading-relaxed">
              Geodesic pathfinding over a full 3D MapLibre globe. Monitor chokepoints, port draft limits, and voyage risk profiles natively.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="space-y-4">
            <div className="w-10 h-10 rounded border border-border-strong bg-surface flex items-center justify-center text-brand-primary">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-ink tracking-wide">Market Intelligence</h3>
            <p className="text-ink-muted text-sm leading-relaxed">
              Powered by NIRNAY AI. Synthesize live freight indexes, time-charter rates, and bunker spreads into actionable chartering decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-border-subtle bg-background py-8 text-center text-ink-muted text-xs font-mono uppercase tracking-widest">
        &copy; {new Date().getFullYear()} TKTF Maritime Data Systems. DEMO WORKSTATION.
      </footer>
    </div>
  );
}
