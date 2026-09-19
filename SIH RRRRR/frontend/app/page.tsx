'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Animated Number Counter ──────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', prefix = '', decimals = 0 }: {
  target: number; suffix?: string; prefix?: string; decimals?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const duration = 1800;
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setValue(parseFloat((ease * target).toFixed(decimals)));
        if (progress < 1) requestAnimationFrame(step);
        else setValue(target);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, decimals]);

  return (
    <div ref={ref} className="tabular-nums">
      {prefix}{decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString()}{suffix}
    </div>
  );
}

// ─── Floating Particle Background ────────────────────────────────────────────
function OceanParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#818cf8' : '#34d399',
            animation: `float-particle ${Math.random() * 8 + 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent, delay }: {
  icon: string; title: string; desc: string; accent: string; delay: number;
}) {
  return (
    <div
      className="feature-card group relative rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm p-6 hover:border-opacity-100 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
      style={{ animationDelay: `${delay}ms`, borderColor: 'rgba(71,85,105,0.6)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = accent + '60';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${accent}20`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(71,85,105,0.6)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
      }}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-white font-bold text-base mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      <div
        className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
    </div>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => router.push('/command-center'), 600);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #040d1a;
          color: #e2e8f0;
          overflow-x: hidden;
        }

        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          75% { transform: translateY(15px) translateX(-10px); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.85); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(0.85); opacity: 0.8; }
        }

        @keyframes beacon-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes wave-x {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(1.04); }
        }

        .hero-title {
          animation: fadeInUp 0.8s ease forwards;
        }
        .hero-subtitle {
          animation: fadeInUp 0.8s 0.15s ease forwards;
          opacity: 0;
        }
        .hero-cta {
          animation: fadeInUp 0.8s 0.3s ease forwards;
          opacity: 0;
        }
        .stats-bar {
          animation: fadeInUp 0.8s 0.45s ease forwards;
          opacity: 0;
        }
        .features-grid {
          animation: fadeInUp 0.8s 0.6s ease forwards;
          opacity: 0;
        }

        .launch-btn {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%);
          background-size: 200% 200%;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .launch-btn:hover {
          transform: scale(1.04) translateY(-2px);
          box-shadow: 0 20px 50px rgba(99,102,241,0.5), 0 0 80px rgba(14,165,233,0.3);
        }
        .launch-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0284c7, #4f46e5, #7c3aed);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .launch-btn:hover::before { opacity: 1; }
        .launch-btn .btn-text { position: relative; z-index: 1; }

        .shimmer-text {
          background: linear-gradient(90deg, #38bdf8 0%, #818cf8 33%, #34d399 66%, #38bdf8 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .grid-bg {
          background-image:
            linear-gradient(rgba(14,165,233,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14,165,233,0.06) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .glow-orb-1 {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
          top: -200px;
          right: -100px;
          pointer-events: none;
        }
        .glow-orb-2 {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%);
          bottom: -100px;
          left: -150px;
          pointer-events: none;
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8));
          border: 1px solid rgba(51,65,85,0.7);
          border-radius: 16px;
          padding: 20px 24px;
          text-align: center;
          transition: border-color 0.3s;
          backdrop-filter: blur(10px);
        }
        .stat-card:hover {
          border-color: rgba(99,102,241,0.5);
        }

        .pipeline-step {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(51,65,85,0.6);
          border-radius: 10px;
          font-size: 12px;
          transition: all 0.3s;
        }
        .pipeline-step:hover {
          border-color: rgba(99,102,241,0.5);
          background: rgba(30,41,59,0.9);
        }

        .nav-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(4,13,26,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(51,65,85,0.4);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .badge-sail {
          background: rgba(14,165,233,0.15);
          border: 1px solid rgba(14,165,233,0.4);
          color: #38bdf8;
        }
        .badge-sih {
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.4);
          color: #a5b4fc;
        }

        .anchor-pulse {
          animation: pulse-ring 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* ─── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 'bold', color: 'white'
          }}>N</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.1em', color: 'white' }}>NAVIK</div>
            <div style={{ fontSize: '9px', color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Maritime Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="badge badge-sail">🏭 SAIL India</span>
          <span className="badge badge-sih">🏆 SIH 2024</span>
        </div>
      </nav>

      {/* ─── Hero Section ───────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0 }} />
        <OceanParticles />
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />

        {/* Hero Content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '820px', padding: '0 24px' }}>

          {/* Beacon / Anchor icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px' }}>
              <div className="anchor-pulse" style={{
                position: 'absolute', inset: '-8px',
                borderRadius: '50%',
                border: '1px solid rgba(14,165,233,0.4)',
              }} />
              <div style={{
                width: '96px', height: '96px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(99,102,241,0.2))',
                border: '1px solid rgba(14,165,233,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '40px',
                backdropFilter: 'blur(10px)',
              }}>⚓</div>
            </div>
          </div>

          {/* Title */}
          <div className="hero-title">
            <div style={{ fontSize: '13px', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#64748b', marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace" }}>
              AI‑Driven Maritime Decision Intelligence
            </div>
            <h1 style={{ fontSize: 'clamp(52px, 8vw, 88px)', fontWeight: 900, lineHeight: 1.05, marginBottom: '8px', letterSpacing: '-0.03em' }}>
              <span className="shimmer-text">NAVIK</span>
            </h1>
            <div style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', fontWeight: 300, color: '#94a3b8', letterSpacing: '0.02em', marginBottom: '24px' }}>
              Maritime Freight Command Center
            </div>
          </div>

          {/* Subtitle */}
          <p className="hero-subtitle" style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#64748b', lineHeight: 1.7, maxWidth: '640px', margin: '0 auto 40px' }}>
            SAIL's autonomous freight decision platform — real‑time vessel ranking, quantile forecasting,
            risk scoring, what‑if scenario simulation, and AI‑driven charter recommendations.
            All in one command center.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="launch-navik-btn"
              onClick={handleLaunch}
              disabled={launching}
              className="launch-btn"
              style={{
                padding: '16px 48px',
                fontSize: '16px',
                fontWeight: 700,
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                cursor: launching ? 'not-allowed' : 'pointer',
                letterSpacing: '0.05em',
                opacity: launching ? 0.8 : 1,
              }}
            >
              <span className="btn-text">
                {launching ? '⏳ Launching...' : '🚀 Launch NAVIK'}
              </span>
            </button>
            <a
              href="/command-center"
              style={{
                padding: '16px 32px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#94a3b8',
                border: '1px solid rgba(71,85,105,0.6)',
                borderRadius: '14px',
                cursor: 'pointer',
                textDecoration: 'none',
                background: 'rgba(15,23,42,0.6)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(99,102,241,0.6)'; (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(71,85,105,0.6)'; (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8'; }}
            >
              ⚙️ Command Center
            </a>
          </div>

          {/* Pipeline badge row */}
          <div style={{ marginTop: '48px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Vessel Feasibility', 'Quantile Forecast', 'Risk Engine', 'What‑If Sim', 'SPLIT Optimizer', 'Portfolio Strategy'].map((step, i) => (
              <div key={i} className="pipeline-step">
                <span style={{ color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                <span style={{ color: '#94a3b8' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ──────────────────────────────────────────────────────── */}
      <section className="stats-bar" style={{ padding: '0 24px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { value: 7, suffix: '+', label: 'Pipeline Stages', icon: '🔗', accent: '#38bdf8' },
            { value: 98.6, suffix: '%', label: 'Model Accuracy', icon: '🎯', accent: '#34d399', decimals: 1 },
            { value: 5, suffix: '', label: 'Vessel Classes', icon: '🚢', accent: '#818cf8' },
            { value: 21, suffix: '', label: 'SPLIT Nodes', icon: '⚖️', accent: '#f59e0b' },
            { value: 3, suffix: ' Routes', label: 'Repositioning Lanes', icon: '🗺️', accent: '#f472b6' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: s.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                <AnimatedCounter target={s.value} suffix={s.suffix} decimals={s.decimals || 0} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ──────────────────────────────────────────────────── */}
      <section className="features-grid" style={{ padding: '0 24px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6366f1', fontWeight: 700, marginBottom: '12px' }}>Capabilities</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, color: 'white' }}>Everything you need to make the right charter decision</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <FeatureCard delay={0} icon="🏗️" accent="#38bdf8" title="Vessel Feasibility Ranking" desc="Multi-objective scoring across draft, LOA, beam, DWT, cost, delay, and availability. Hard physical filter before any scoring." />
          <FeatureCard delay={100} icon="📈" accent="#34d399" title="Quantile Freight Forecast" desc="SARIMAX + CQR hybrid model with 50% and 90% prediction intervals. Conformal coverage guarantees on live data." />
          <FeatureCard delay={200} icon="⚠️" accent="#f59e0b" title="Multi-Factor Risk Engine" desc="Composite risk score across port congestion, forecast volatility, geopolitical disruption, and weather cyclone exposure." />
          <FeatureCard delay={300} icon="🔀" accent="#f472b6" title="What-If Scenario Simulator" desc="Inject freight shocks, congestion surges, bunker spikes, and fleet supply squeezes. Re-evaluate the full pipeline instantly." />
          <FeatureCard delay={400} icon="🎯" accent="#818cf8" title="SPLIT Market Entry Optimizer" desc="21-point optimal charter timing engine. Minimises Expected Total Landed Cost under deadline constraints." />
          <FeatureCard delay={500} icon="💼" accent="#06b6d4" title="Charter Portfolio Strategy" desc="Mean-variance optimisation across spot, short-term, and medium-term contracts. Risk aversion slider for conservative to aggressive." />
          <FeatureCard delay={600} icon="⚓" accent="#10b981" title="Idle & Repositioning Engine" desc="Post-discharge availability window + 3 opportunity repositioning lanes with seasonality, ballast cost, and trade flow analysis." />
          <FeatureCard delay={700} icon="🤖" accent="#a78bfa" title="NIRNAY AI Assistant" desc="Gemini-powered conversational assistant for maritime freight Q&A, route analysis, and decision rationale explanation." />
          <FeatureCard delay={800} icon="📊" accent="#fb923c" title="Data Provenance Tracking" desc="Every number carries a provenance badge: REAL_VERIFIED, PUBLIC_PROXY, MODEL_OUTPUT, SIMULATED, or ASSUMPTION." />
        </div>
      </section>

      {/* ─── Technology Stack ─────────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px', background: 'rgba(15,23,42,0.6)', borderTop: '1px solid rgba(30,41,59,0.8)', borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6366f1', fontWeight: 700, marginBottom: '32px' }}>Technology Stack</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {[
              { name: 'Spring Boot 3.2', color: '#34d399' },
              { name: 'PostgreSQL', color: '#38bdf8' },
              { name: 'FastAPI', color: '#818cf8' },
              { name: 'SARIMAX + CQR', color: '#f59e0b' },
              { name: 'Next.js 14', color: '#94a3b8' },
              { name: 'Gemini AI', color: '#f472b6' },
              { name: 'SciPy SLSQP', color: '#34d399' },
              { name: 'Flyway Migrations', color: '#38bdf8' },
              { name: 'JWT Auth', color: '#818cf8' },
              { name: 'Tailwind CSS', color: '#06b6d4' },
            ].map((t, i) => (
              <div key={i} style={{
                padding: '8px 16px', borderRadius: '999px',
                border: `1px solid ${t.color}40`,
                background: `${t.color}10`,
                color: t.color,
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
              }}>{t.name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer CTA ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, color: 'white', marginBottom: '16px' }}>
            Ready to navigate smarter?
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
            Open the Command Center and run your first cargo decision pipeline in under 30 seconds.
          </p>
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="launch-btn"
            style={{
              padding: '18px 64px', fontSize: '18px', fontWeight: 800,
              color: 'white', border: 'none', borderRadius: '16px',
              cursor: launching ? 'not-allowed' : 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            <span className="btn-text">{launching ? '⏳ Launching...' : '🚀 Launch NAVIK'}</span>
          </button>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '24px',
        borderTop: '1px solid rgba(30,41,59,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚓</span>
          <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>NAVIK</span>
          <span style={{ color: '#334155', fontSize: '12px' }}>by Team for SAIL India · SIH 2024 Grand Finale</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-sail">SAIL Maritime</span>
          <span className="badge badge-sih">SIH Finalist</span>
        </div>
      </footer>
    </>
  );
}
