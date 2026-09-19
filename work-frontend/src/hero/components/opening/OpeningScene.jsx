import React from 'react';
import { Ocean } from './Ocean';
import { BulkCarrier } from './BulkCarrier';
import { Route } from './Route';
import { CameraController } from './CameraController';

/**
 * NAVIC Cinematic Opening Scene
 * 
 * Visual Tone:
 * - Low-key maritime lighting
 * - Dark open sea
 * - Continuous forward movement along maritime curve
 * - Subtle route reveal & restrained wake
 */
export const OpeningScene = ({ progress = 0 }) => {
  return (
    <group name="NavikOpeningScene">
      {/* Low-Key Cinematic Maritime Lighting */}
      <ambientLight intensity={0.35} color="#0f172a" />

      {/* Main Low-Angle Key Light (Moonlight / Low Horizon) */}
      <directionalLight
        position={[-6, 12, -8]}
        intensity={1.8}
        color="#f8fafc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0001}
      />

      {/* Cool Maritime Fill Light */}
      <directionalLight
        position={[8, 4, 6]}
        intensity={0.6}
        color="#38bdf8"
      />

      {/* 1. Photorealistic Dark Ocean */}
      <Ocean />

      {/* 2. Bulk Carrier Vessel with Buoyancy & Wake */}
      <BulkCarrier progress={progress} />

      {/* 3. Subtle Maritime Route Line */}
      <Route progress={progress} />

      {/* 4. Top-down to slight pullback Camera Controller */}
      <CameraController progress={progress} />
    </group>
  );
};
