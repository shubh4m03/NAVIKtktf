import { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';

/**
 * GSAP Cinematic Timeline Orchestration Hook
 * Manages the multi-stage narrative sequence:
 * 1. Dark ocean top-down
 * 2. Bulk carrier ingress
 * 3. Route trajectory line
 * 4. Camera pull-back & Earth curvature
 * 5. Full Earth globe & Global trade routes
 * 6. NAVIC Brand Reveal: "Predict. Optimize. Navigate." -> "ENTER NAVIC ->"
 */
export const useHeroTimeline = ({ autoPlay = true, onComplete } = {}) => {
  const [currentStage, setCurrentStage] = useState('OCEAN_START');
  const [stageProgress, setStageProgress] = useState(0); // 0 to 1
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFinished, setIsFinished] = useState(false);

  // Animated properties ref accessed in useFrame
  const animStateRef = useRef({
    // Camera transform
    cameraPosition: [0, 1.8, 0.4],
    cameraTarget: [0, 0, 0],
    cameraFov: 45,

    // Local Stage (Ocean & Single Ship)
    oceanOpacity: 1.0,
    routeProgress: 0.0,
    vesselPosition: [-3.0, 0, -1.8],
    vesselRotation: [0, -0.7, 0],
    vesselScale: 0.85,
    vesselOpacity: 1.0,

    // Planetary Stage (Realistic Earth Globe & Trade Corridors)
    earthPosition: [0, -4.5, -2.0],
    earthScale: 1.0,
    earthOpacity: 0.0,
    earthCurvatureReveal: 0.0,
    routesOpacity: 0.0,

    // UI & Brand
    uiStage: 1,
    showBranding: false
  });

  const timelineRef = useRef(null);

  useEffect(() => {
    const state = animStateRef.current;

    // Master Cinematic Sequence (Total duration: ~13.5s)
    const tl = gsap.timeline({
      paused: !autoPlay,
      onUpdate: () => {
        setStageProgress(tl.progress());
      },
      onComplete: () => {
        setIsFinished(true);
        setIsPlaying(false);
        if (onComplete) onComplete();
      }
    });

    timelineRef.current = tl;

    // -------------------------------------------------------------
    // STAGE 1 (0.0s - 2.5s): Dark ocean top-down, quiet tension
    // -------------------------------------------------------------
    tl.addLabel('ocean_start', 0)
      .call(() => setCurrentStage('01/05 // DARK OCEAN NAUTICAL INGRESS'), null, 0)
      .to(state.cameraPosition, {
        0: 0, 1: 1.6, 2: 0.8,
        duration: 2.5,
        ease: 'power1.inOut'
      }, 0);

    // -------------------------------------------------------------
    // STAGE 2 (2.0s - 5.0s): Bulk carrier enters frame along route
    // -------------------------------------------------------------
    tl.addLabel('vessel_ingress', 2.0)
      .call(() => setCurrentStage('02/05 // CAPESIZE BULK CARRIER VOYAGE'), null, 2.0)
      .to(state.vesselPosition, {
        0: 0.2, 1: 0, 2: 0.3,
        duration: 3.5,
        ease: 'power2.out'
      }, 1.5)
      .to(state.cameraPosition, {
        0: 0.4, 1: 2.2, 2: 1.4,
        duration: 3.0,
        ease: 'power1.out'
      }, 2.0);

    // -------------------------------------------------------------
    // STAGE 3 (4.0s - 7.0s): Illuminated route line & waypoints draw
    // -------------------------------------------------------------
    tl.addLabel('route_synthesis', 4.0)
      .call(() => setCurrentStage('03/05 // OPTIMAL ROUTE TRAJECTORY SYNTHESIS'), null, 4.0)
      .to(state, {
        routeProgress: 1.0,
        duration: 2.5,
        ease: 'power2.inOut'
      }, 3.8);

    // -------------------------------------------------------------
    // STAGE 4 (6.0s - 10.0s): Camera pulls far back, curvature emerges
    // -------------------------------------------------------------
    tl.addLabel('planetary_pullback', 6.0)
      .call(() => setCurrentStage('04/05 // PLANETARY ELEVATION & CURVATURE'), null, 6.0)
      // Exponential camera zoom out
      .to(state.cameraPosition, {
        0: 0.2, 1: 1.8, 2: 6.8,
        duration: 4.0,
        ease: 'power3.inOut'
      }, 6.0)
      .to(state.cameraTarget, {
        0: 0, 1: -0.2, 2: 0,
        duration: 4.0,
        ease: 'power2.inOut'
      }, 6.0)
      // Fade out ocean surface & local vessel as we enter orbit
      .to(state, {
        oceanOpacity: 0.0,
        vesselOpacity: 0.0,
        earthOpacity: 1.0,
        duration: 2.8,
        ease: 'power2.inOut'
      }, 6.5)
      // Earth positions into center
      .to(state.earthPosition, {
        0: 0, 1: -0.3, 2: 0,
        duration: 3.8,
        ease: 'power2.out'
      }, 6.2);

    // -------------------------------------------------------------
    // STAGE 5 (9.0s - 12.5s): Full Earth globe & Global trade routes
    // -------------------------------------------------------------
    tl.addLabel('global_network', 9.0)
      .call(() => setCurrentStage('05/05 // GLOBAL MARITIME DRY BULK CORRIDORS'), null, 9.0)
      .to(state, {
        routesOpacity: 1.0,
        duration: 2.0,
        ease: 'power2.in'
      }, 9.2)
      .to(state.cameraPosition, {
        0: 0, 1: 0.5, 2: 6.2,
        duration: 3.5,
        ease: 'power1.out'
      }, 9.5);

    // -------------------------------------------------------------
    // STAGE 6 (11.5s+): NAVIC Brand Reveal: "Predict. Optimize. Navigate."
    // -------------------------------------------------------------
    tl.addLabel('brand_reveal', 11.5)
      .call(() => {
        state.showBranding = true;
        setCurrentStage('DECISION INTELLIGENCE SYSTEM READY');
      }, null, 11.5);

    return () => {
      tl.kill();
    };
  }, [autoPlay, onComplete]);

  // Timeline Controls
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

  const seek = useCallback((progress) => {
    timelineRef.current?.progress(progress);
  }, []);

  const skipToEnd = useCallback(() => {
    timelineRef.current?.progress(1.0);
    setIsFinished(true);
    setIsPlaying(false);
  }, []);

  return {
    animState: animStateRef.current,
    currentStage,
    stageProgress,
    isPlaying,
    isFinished,
    play,
    pause,
    restart,
    seek,
    skipToEnd
  };
};
