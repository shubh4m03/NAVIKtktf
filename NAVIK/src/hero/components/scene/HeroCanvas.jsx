import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { TransitionScene } from '../transition/TransitionScene';

/**
 * Fullscreen Cinematic Canvas for Continuous Ocean-to-Earth Transition
 */
export const HeroCanvas = ({ progress = 0 }) => {
  return (
    <div className="navik-hero-canvas-container">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        shadows
      >
        {/* Pure Pitch-Black Space Environment */}
        <color attach="background" args={['#000000']} />

        <PerspectiveCamera
          makeDefault
          fov={42}
          near={0.05}
          far={200}
          position={[0, 6.0, 1.2]}
        />

        <Suspense fallback={null}>
          <TransitionScene progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  );
};
