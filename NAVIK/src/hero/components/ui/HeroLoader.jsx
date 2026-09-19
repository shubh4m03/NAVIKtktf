import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

/**
 * Cinematic Asset Loader Overlay
 * Displays progress during initial GLTF/GLB/texture loading.
 */
export const HeroLoader = ({ onFinished }) => {
  const { active, progress, item } = useProgress();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // When progress reaches 100% or is inactive, delay slightly for smooth fade
    if (progress >= 100 || !active) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onFinished) onFinished();
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [progress, active, onFinished]);

  return (
    <div className={`navik-hero-loader-overlay ${!isVisible ? 'hidden' : ''}`}>
      <div className="navik-loader-spinner-ring" />
      
      <div className="navik-loader-text-group">
        <span className="navik-loader-title">INITIALIZING NAVIK ENGINE</span>
        <div className="navik-loader-progress-bar">
          <div 
            className="navik-loader-progress-fill" 
            style={{ width: `${Math.round(progress)}%` }} 
          />
        </div>
        <span className="navik-loader-item-name">
          {Math.round(progress)}% {item ? `// Loading ${item.slice(0, 30)}...` : '// Synchronizing 3D Telemetry'}
        </span>
      </div>
    </div>
  );
};
