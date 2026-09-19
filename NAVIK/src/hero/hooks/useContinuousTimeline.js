import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

const INTRO_STORAGE_KEY = 'navicIntroSeen';

/**
 * Continuous Ocean-to-Earth Timeline Hook with Realism Pacing
 * 
 * Calibrated Timeline (Total ~8.2s):
 * - 0.0s–1.0s (0.00 -> 0.12): Dark ocean establishing shot
 * - 1.0s–3.5s (0.12 -> 0.44): Bulk carrier enters & navigates visibly across ocean (SHIP = focus)
 * - 3.0s–4.2s (0.38 -> 0.52): Subtle navigation route line begins drawing
 * - 4.2s–6.2s (0.52 -> 0.76): Camera begins exponential pullback toward Earth curvature
 * - 6.2s–7.4s (0.76 -> 0.90): Orbital Earth view with progressive Global Maritime Corridors
 * - 7.4s–8.2s (0.90 -> 1.00): NAVIC brand reveal (Wordmark -> Tagline -> Minimal CTA)
 */
export const useContinuousTimeline = ({ 
  autoPlay = true, 
  loop = false,
  checkSeenFlag = false 
} = {}) => {
  const [progress, setProgress] = useState(() => {
    if (checkSeenFlag) {
      try {
        const seen = localStorage.getItem(INTRO_STORAGE_KEY);
        if (seen === 'true') return 1.0;
      } catch (e) {}
    }
    return 0;
  });

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFinished, setIsFinished] = useState(false);
  const timelineRef = useRef(null);

  useEffect(() => {
    const progressObj = { value: progress };

    const tl = gsap.timeline({
      paused: !autoPlay || progress >= 1.0,
      repeat: loop ? -1 : 0,
      repeatDelay: 1.5,
      onUpdate: () => {
        setProgress(progressObj.value);
      },
      onComplete: () => {
        setIsFinished(true);
        setIsPlaying(false);
        try {
          localStorage.setItem(INTRO_STORAGE_KEY, 'true');
        } catch (e) {}
      }
    });

    timelineRef.current = tl;

    // Smooth continuous single-shot timeline of ~8.2s total duration
    tl.to(progressObj, {
      value: 1.0,
      duration: 8.2,
      ease: 'power1.inOut'
    });

    return () => {
      tl.kill();
    };
  }, [autoPlay, loop]);

  const play = useCallback(() => {
    timelineRef.current?.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    timelineRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const restart = useCallback(() => {
    setIsFinished(false);
    timelineRef.current?.restart();
    setIsPlaying(true);
  }, []);

  const skipToEnd = useCallback(() => {
    timelineRef.current?.progress(1.0);
    setProgress(1.0);
    setIsFinished(true);
    setIsPlaying(false);
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, 'true');
    } catch (e) {}
  }, []);

  const resetIntroSeen = useCallback(() => {
    try {
      localStorage.removeItem(INTRO_STORAGE_KEY);
    } catch (e) {}
    restart();
  }, [restart]);

  return {
    progress,
    isPlaying,
    isFinished,
    play,
    pause,
    restart,
    skipToEnd,
    resetIntroSeen
  };
};
