import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Opening Scene Timeline Hook
 * 
 * Drives the vessel ingress, curved navigation, route reveal,
 * and camera elevation over a compact 2.8s duration.
 */
export const useOpeningTimeline = ({ autoPlay = true, loop = true } = {}) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const timelineRef = useRef(null);

  useEffect(() => {
    const progressObj = { value: 0 };

    const tl = gsap.timeline({
      paused: !autoPlay,
      repeat: loop ? -1 : 0,
      repeatDelay: 0.8,
      onUpdate: () => {
        setProgress(progressObj.value);
      }
    });

    timelineRef.current = tl;

    // 0.0s to 2.8s: Natural, smooth vessel progression across ocean
    tl.to(progressObj, {
      value: 1.0,
      duration: 2.8,
      ease: 'power1.inOut'
    });

    return () => {
      tl.kill();
    };
  }, [autoPlay, loop]);

  const play = () => {
    timelineRef.current?.play();
    setIsPlaying(true);
  };

  const pause = () => {
    timelineRef.current?.pause();
    setIsPlaying(false);
  };

  const restart = () => {
    timelineRef.current?.restart();
    setIsPlaying(true);
  };

  return {
    progress,
    isPlaying,
    play,
    pause,
    restart
  };
};
