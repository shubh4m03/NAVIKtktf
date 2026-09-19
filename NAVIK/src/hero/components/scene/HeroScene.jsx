import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { EarthGlobe } from '../models/EarthGlobe';
import { ShipModel } from '../models/ShipModel';
import { OceanSurface } from './OceanSurface';
import { LightingRig } from './LightingRig';

/**
 * Cinematic Hero 3D Scene Orchestrator
 * Seamlessly connects GSAP timeline state to Three.js camera, ocean stage, and Earth globe.
 */
export const HeroScene = ({ 
  animState, 
  isFinished, 
  enableFreeOrbit = false, 
  onAssetMissing 
}) => {
  const { camera } = useThree();
  const shipRef = useRef();
  const earthRef = useRef();

  // Camera interpolation and timeline transform binding
  useFrame((state, delta) => {
    if (!animState) return;

    // During cinematic timeline (when not in manual user orbit control)
    if (!enableFreeOrbit || !isFinished) {
      // Smooth camera position interpolation
      const targetPos = animState.cameraPosition;
      camera.position.lerp(new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]), 0.1);

      // Smooth camera lookAt interpolation
      const lookTarget = new THREE.Vector3(...animState.cameraTarget);
      camera.lookAt(lookTarget);
    }
  });

  const state = animState || {
    oceanOpacity: 1,
    routeProgress: 0,
    vesselPosition: [0, 0, 0],
    vesselRotation: [0, 0, 0],
    vesselOpacity: 1,
    earthPosition: [0, -0.3, 0],
    routesOpacity: 1.0
  };

  return (
    <group name="HeroSceneRoot">
      {/* Cinematic Lighting */}
      <LightingRig />

      {/* Atmospheric Starfield */}
      <Stars 
        radius={120} 
        depth={60} 
        count={3000} 
        factor={3.0} 
        saturation={0.4} 
        fade 
        speed={0.4} 
      />

      {/* -------------------------------------------------------- */}
      {/* 1. LOCAL NAUTICAL STAGE (Dark Ocean & Ingressing Vessel)  */}
      {/* -------------------------------------------------------- */}
      <OceanSurface 
        opacity={state.oceanOpacity} 
        routeProgress={state.routeProgress}
        vesselPosition={state.vesselPosition}
      />

      <ShipModel 
        position={state.vesselPosition}
        rotation={state.vesselRotation}
        opacity={state.vesselOpacity}
        onAssetMissing={onAssetMissing}
      />

      {/* -------------------------------------------------------- */}
      {/* 2. PLANETARY STAGE (Realistic 3D Earth & Trade Network)   */}
      {/* -------------------------------------------------------- */}
      <group position={state.earthPosition} name="EarthStage">
        <EarthGlobe 
          radius={2.0} 
          routesOpacity={state.routesOpacity}
          autoRotate={true}
          rotationSpeed={0.0012}
        />
      </group>
    </group>
  );
};
