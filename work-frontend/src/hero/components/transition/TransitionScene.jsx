import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TwinklingStars } from '../scene/TwinklingStars';
import { Earth } from './Earth';
import { ShipOnGlobe } from './ShipOnGlobe';
import { RouteOnGlobe } from './RouteOnGlobe';
import { GlobalMaritimeNetwork } from './GlobalMaritimeNetwork';
import { ContinuousCameraController } from './ContinuousCameraController';
import { HERO_CONFIG } from '../../config/heroConfig';

/**
 * NAVIC Continuous Ocean-to-Earth Transition Scene
 * 
 * Unified Planetary Coordinate System:
 * - Earth, Clouds, Ship, Vessel Route, and Global Maritime Corridors belong to the SAME parent group
 * - Realistic axial tilt (23.44° / 0.409 rad) with smooth, perceptible polar rotation (1 full turn ≈ 90s)
 * - Directional sunlight remains fixed in world space, creating a natural day/night terminator as Earth turns
 * - Back-side corridors and background stars are naturally occluded by the opaque Earth sphere
 * - Distant photorealistic twinkling stars in pure pitch-black space (#000000)
 */
export const TransitionScene = ({ progress = 0 }) => {
  const planetGroupRef = useRef();
  const { lighting } = HERO_CONFIG;

  // Smooth, constant, perceptible planetary rotation (~90 seconds per full rotation)
  useFrame((state, delta) => {
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y += delta * 0.068;
    }
  });

  return (
    <group name="NavikContinuousScene">
      {/* 1. Fixed Celestial Sunlight & Deep Contrast (Sun does NOT rotate with Earth) */}
      <ambientLight intensity={lighting.ambient.intensity} color={lighting.ambient.color} />

      {/* Main Directional Sun Light (Fixed in World Space for physical terminator) */}
      <directionalLight
        position={lighting.sun.position}
        intensity={lighting.sun.intensity}
        color={lighting.sun.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={45}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0001}
      />

      {/* Subtle Sky/Deep Space Back-fill */}
      <directionalLight
        position={lighting.rim.position}
        intensity={lighting.rim.intensity}
        color={lighting.rim.color}
      />

      {/* 2. Realistic Twinkling Star Field in Pitch-Black Space (GPU-accelerated) */}
      <TwinklingStars count={2200} innerRadius={55} outerRadius={150} />

      {/* 3. Physically Authentic Planetary System with 23.44° Axial Tilt */}
      <group 
        name="PlanetaryAxialTilt" 
        rotation={[0.06, 0, 0.409]} /* 23.44° true axial tilt */
      >
        {/* Continuous Polar Rotation System (Earth + Ship + Route + Global Network locked together) */}
        <group ref={planetGroupRef} name="SpinningEarthSystem">
          {/* Photorealistic NASA Blue Marble Earth Globe */}
          <Earth />

          {/* Commercial Bulk Carrier Vessel on Ocean Surface */}
          <ShipOnGlobe progress={progress} />

          {/* Continuous Maritime Navigation Route (Physically attached to globe) */}
          <RouteOnGlobe progress={progress} />

          {/* Curated Global Maritime Shipping Corridors (Physically attached to globe) */}
          <GlobalMaritimeNetwork progress={progress} />
        </group>
      </group>

      {/* 4. Continuous Single-Shot Camera Controller */}
      <ContinuousCameraController progress={progress} planetGroupRef={planetGroupRef} />
    </group>
  );
};
