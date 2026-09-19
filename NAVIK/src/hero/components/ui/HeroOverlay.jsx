import React from 'react';
import { HERO_CONFIG } from '../../config/heroConfig';
import { 
  Compass, 
  ArrowRight, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Globe2, 
  Anchor, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

/**
 * Cinematic Hero UI Overlay
 * Presents:
 * - Dynamic Sequence Stage HUD
 * - Timeline Scrubber & Replay controls
 * - NAVIC Brand Reveal: "Predict. Optimize. Navigate." & "ENTER NAVIC →"
 * - Global Dry Bulk Telemetry
 */
export const HeroOverlay = ({
  currentStage,
  stageProgress = 0,
  isPlaying = true,
  isFinished = false,
  onPlay,
  onPause,
  onRestart,
  onSkip,
  onEnterNavik,
  missingAssets = []
}) => {
  const { branding } = HERO_CONFIG;
  const isBrandRevealed = stageProgress > 0.85 || isFinished;

  return (
    <div className="navik-hero-ui-overlay">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER                                                 */}
      {/* ------------------------------------------------------------- */}
      <header className="navik-hero-header">
        <div className="navik-brand-cluster">
          <div className="navik-logo-icon">
            <Compass color="#00d4ff" size={24} />
          </div>
          <span className="navik-brand-title">NAVIK</span>
        </div>

        {/* Live Stage Status Badge */}
        <div className="navik-stage-pill">
          <span className="navik-status-dot" />
          <span className="navik-stage-text">{currentStage || 'ORCHESTRATING SEQUENCE'}</span>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN HERO REVEAL & CTA BLOCK                               */}
      {/* ------------------------------------------------------------- */}
      <main className={`navik-hero-content ${isBrandRevealed ? 'revealed' : 'subtle'}`}>
        <div className="navik-tagline">MARITIME DECISION INTELLIGENCE</div>
        
        <h1 className="navik-headline">
          Predict. Optimize. Navigate.
        </h1>

        <p className="navik-description">
          Intelligent freight rate forecasting, bulk vessel chartering optimization, and predictive route orchestration for global dry bulk logistics.
        </p>

        <div className="navik-cta-group">
          <button 
            type="button" 
            className="navik-btn-primary" 
            onClick={onEnterNavik}
          >
            <span>ENTER NAVIK</span>
            <ArrowRight size={18} />
          </button>

          <button 
            type="button" 
            className="navik-btn-secondary"
            onClick={onRestart}
          >
            <RotateCcw size={15} />
            <span>Replay Intro</span>
          </button>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 3. TIMELINE CONTROLS & TELEMETRY FOOTER                       */}
      {/* ------------------------------------------------------------- */}
      <footer className="navik-hero-footer">
        {/* Playback & Sequence Bar */}
        <div className="navik-timeline-bar-container">
          <div className="navik-playback-buttons">
            {isPlaying ? (
              <button type="button" className="navik-ctrl-btn" onClick={onPause} title="Pause Sequence">
                <Pause size={14} />
              </button>
            ) : (
              <button type="button" className="navik-ctrl-btn" onClick={onPlay} title="Play Sequence">
                <Play size={14} />
              </button>
            )}

            <button type="button" className="navik-ctrl-btn" onClick={onRestart} title="Restart Sequence">
              <RotateCcw size={14} />
            </button>

            {!isFinished && (
              <button type="button" className="navik-ctrl-btn" onClick={onSkip} title="Skip to Earth Globe">
                <FastForward size={14} />
              </button>
            )}
          </div>

          <div className="navik-progress-track">
            <div 
              className="navik-progress-bar-fill" 
              style={{ width: `${Math.round(stageProgress * 100)}%` }} 
            />
          </div>

          <span className="navik-time-readout">
            {Math.round(stageProgress * 100)}%
          </span>
        </div>

        {/* Global Bulk Logistics Telemetry */}
        <div className="navik-telemetry-grid">
          <div className="navik-telemetry-item">
            <span className="navik-telemetry-label">Capesize / Panamax</span>
            <span className="navik-telemetry-value">Live AIS Corridors</span>
          </div>
          <div className="navik-telemetry-item">
            <span className="navik-telemetry-label">Baltic Dry Index</span>
            <span className="navik-telemetry-value">AI Projected +4.2%</span>
          </div>
          <div className="navik-telemetry-item">
            <span className="navik-telemetry-label">Engine</span>
            <span className="navik-telemetry-value">Photorealistic R3F</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
