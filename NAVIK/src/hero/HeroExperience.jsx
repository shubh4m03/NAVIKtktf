import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeroCanvas } from './components/scene/HeroCanvas';
import { BrandRevealOverlay } from './components/ui/BrandRevealOverlay';
import { useContinuousTimeline } from './hooks/useContinuousTimeline';
import './styles/hero.css';

/**
 * NAVIK Standalone Cinematic Hero Experience
 * 
 * Flow:
 * 1. 3D Cinematic Sequence (Ocean -> Bulk Carrier -> Earth Pullback -> Maritime Corridors -> Brand Reveal)
 * 2. Minimal "GET STARTED ↓" CTA reveals when sequence completes
 * 3. Either clicking "GET STARTED" or scrolling downwards initiates a smooth, cinematic
 *    fade and depth transition into the main NAVIK application.
 * 4. Control is handed off cleanly to the existing main website application.
 */
export const HeroExperience = ({
  autoPlay = true,
  onEnterNavik,
  checkSeenFlag = false
}) => {
  const [isTransitioningOut, setIsTransitioningOut] = useState(false);
  const transitionTriggeredRef = useRef(false);

  const {
    progress,
    restart,
    skipToEnd,
    resetIntroSeen
  } = useContinuousTimeline({
    autoPlay,
    loop: false,
    checkSeenFlag
  });

  // =========================================================================
  // NAVIK APPLICATION HANDOFF TRIGGER
  // Initiates the cinematic fade transition and locks interactions.
  // =========================================================================
  const handleTriggerEnter = useCallback(() => {
    // Prevent accidental repeated triggering — lock interaction
    if (transitionTriggeredRef.current) return;
    transitionTriggeredRef.current = true;
    setIsTransitioningOut(true);

    // Smooth cinematic fade transition (~1.3s) before handing off
    setTimeout(() => {
      if (onEnterNavik) {
        onEnterNavik();
      } else {
        window.location.href = '/app';
      }
    }, 1300);
  }, [onEnterNavik]);

  // Handle scroll / wheel / touch swipe / keydown to trigger entrance
  useEffect(() => {
    let touchStartY = 0;

    const handleWheel = (e) => {
      if (transitionTriggeredRef.current) return;
      if (e.deltaY > 15) {
        // If progress is near the end or finished, trigger transition
        if (progress >= 0.85) {
          handleTriggerEnter();
        } else {
          // If still in earlier intro sequence, scrolling down skips directly to settled brand reveal
          skipToEnd();
        }
      }
    };

    const handleTouchStart = (e) => {
      if (transitionTriggeredRef.current) return;
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (transitionTriggeredRef.current) return;
      if (!touchStartY || !e.touches || !e.touches[0]) return;
      const touchEndY = e.touches[0].clientY;
      const diffY = touchStartY - touchEndY;
      if (diffY > 40) { // Swiping up / scrolling down
        if (progress >= 0.85) {
          handleTriggerEnter();
        } else {
          skipToEnd();
        }
      }
    };

    const handleKeyDown = (e) => {
      if (transitionTriggeredRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') {
        if (progress >= 0.85) {
          handleTriggerEnter();
        } else {
          skipToEnd();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [progress, handleTriggerEnter, skipToEnd]);

  return (
    <div className={`navik-hero-wrapper ${isTransitioningOut ? 'transitioning-out' : ''}`}>
      {/* 1. Continuous 3D WebGL Canvas Layer */}
      <HeroCanvas progress={progress} />

      {/* 2. Cinematic Vignette Gradient */}
      <div className="navik-hero-vignette" />

      {/* 3. Final Cinematic Brand Reveal Typography & Controls */}
      <BrandRevealOverlay
        progress={progress}
        onGetStarted={handleTriggerEnter}
        onSkip={skipToEnd}
        onRestart={restart}
        onResetIntroSeen={resetIntroSeen}
      />
    </div>
  );
};

export default HeroExperience;

