import React from 'react';
import { RotateCcw, TrendingUp, ShieldAlert, Navigation, Compass, ArrowDown } from 'lucide-react';

/**
 * NAVIK Final Cinematic Hero Composition Overlay
 * 
 * Hierarchy:
 * 1. Dominant NAVIK Wordmark & Tagline overlapping Earth
 * 2. Minimal "GET STARTED ↓" CTA (Thin, elegant, cinematic)
 * 3. Concise Left-Side Mission Introduction
 * 4. 4 Compact Information Panels communicating core capabilities
 */
export const BrandRevealOverlay = ({
  progress = 0,
  onGetStarted,
  onSkip,
  onRestart,
  onResetIntroSeen
}) => {
  // Staggered reveal milestones after camera completes pullback
  const showNavik = progress >= 0.88;
  const showTagline = progress >= 0.91;
  const showMission = progress >= 0.93;
  const showCards = progress >= 0.95;
  const showCta = progress >= 0.96;
  const isIntroEnding = progress >= 0.98;

  const handleGetStartedClick = (e) => {
    e.preventDefault();
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <div className="navik-brand-reveal-layer">
      {/* 1. Subtle "Skip →" control in top-right corner during intro */}
      {!isIntroEnding && (
        <button
          type="button"
          className="navik-skip-btn"
          onClick={onSkip}
          title="Skip to final view"
        >
          <span>Skip</span>
          <span className="navik-skip-arrow">→</span>
        </button>
      )}

      {/* 2. Left-Side Mission Introduction (Subtle contextual layer) */}
      <div className={`navik-mission-statement ${showMission ? 'visible' : ''}`}>
        <div className="navik-section-tag">
          <span className="navik-tag-dot" />
          <span>GLOBAL FREIGHT INTELLIGENCE</span>
        </div>
        <p className="navik-mission-desc">
          NAVIK transforms freight forecasts, vessel availability, voyage risk and operational constraints into clearer chartering decisions.
        </p>
      </div>

      {/* 3. Central Brand Stack (NAVIK Wordmark overlapping middle Earth) */}
      <div className="navik-brand-center-stack">
        {/* Large Cinematic NAVIK Wordmark */}
        <h1 className={`navik-wordmark ${showNavik ? 'visible' : ''}`}>
          NAVIK
        </h1>

        {/* Tagline directly beneath NAVIK */}
        <div className={`navik-tagline-text ${showTagline ? 'visible' : ''}`}>
          Predict. Optimize. Navigate.
        </div>

        {/* Minimal, Elegant "GET STARTED ↓" CTA */}
        <div className={`navik-cta-container ${showCta ? 'visible' : ''}`}>
          <button
            type="button"
            className="navik-cinematic-cta-btn"
            onClick={handleGetStartedClick}
            aria-label="Get Started with NAVIK"
            id="navik-get-started-cta"
          >
            <span className="navik-cinematic-cta-text">GET STARTED</span>
            <ArrowDown size={14} className="navik-cinematic-cta-arrow" />
          </button>
        </div>
      </div>

      {/* 4. 4 Compact Information Panels (Core Capabilities) */}
      <div className={`navik-capabilities-row ${showCards ? 'visible' : ''}`}>
        {/* Card 01 */}
        <div className="navik-cap-card">
          <div className="navik-card-header">
            <span className="navik-card-num">01</span>
            <TrendingUp size={15} className="navik-card-icon" />
          </div>
          <div className="navik-card-title">FREIGHT FORECASTING</div>
          <div className="navik-card-desc">Forecast future freight-rate movements using historical and market signals.</div>
        </div>

        {/* Card 02 */}
        <div className="navik-cap-card">
          <div className="navik-card-header">
            <span className="navik-card-num">02</span>
            <ShieldAlert size={15} className="navik-card-icon" />
          </div>
          <div className="navik-card-title">DISRUPTION INTELLIGENCE</div>
          <div className="navik-card-desc">Identify weather, port, congestion and geopolitical risks affecting voyages.</div>
        </div>

        {/* Card 03 */}
        <div className="navik-cap-card">
          <div className="navik-card-header">
            <span className="navik-card-num">03</span>
            <Navigation size={15} className="navik-card-icon" />
          </div>
          <div className="navik-card-title">VESSEL & ROUTE OPTIMIZATION</div>
          <div className="navik-card-desc">Evaluate vessel, route and chartering options under operational constraints.</div>
        </div>

        {/* Card 04 */}
        <div className="navik-cap-card">
          <div className="navik-card-header">
            <span className="navik-card-num">04</span>
            <Compass size={15} className="navik-card-icon" />
          </div>
          <div className="navik-card-title">DECISION INTELLIGENCE</div>
          <div className="navik-card-desc">Combine forecast, risk, feasibility and cost into an actionable chartering decision.</div>
        </div>
      </div>

      {/* 5. Discrete Dev Testing Controls (Bottom Corner) */}
      <div className="navik-dev-corner">
        <button
          type="button"
          className="navik-dev-btn"
          onClick={onRestart}
          title="Replay cinematic intro from beginning"
        >
          <RotateCcw size={12} />
          <span>Replay</span>
        </button>

        <button
          type="button"
          className="navik-dev-btn"
          onClick={onResetIntroSeen}
          title="Clear localStorage intro seen flag"
        >
          <span>Reset Flag</span>
        </button>
      </div>
    </div>
  );
};
