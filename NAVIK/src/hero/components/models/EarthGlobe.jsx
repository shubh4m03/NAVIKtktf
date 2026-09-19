import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  createEarthDayTexture, 
  createEarthSpecularTexture, 
  createEarthCloudTexture, 
  createEarthNightTexture 
} from '../../utils/earthTextureGenerator';
import { AtmosphereShader } from '../scene/AtmosphereShader';
import { GlobalTradeRoutes } from '../scene/GlobalTradeRoutes';

/**
 * Realistic Multi-Layer 3D Earth Globe
 * Inspired by NASA Visible Earth & Earth3DMap realism:
 * - High-res bathymetric day surface
 * - Ocean specular reflection mask
 * - Rotating atmospheric cloud sphere
 * - Port & city night illumination
 * - Rayleigh Fresnel atmospheric horizon limb
 * - Integrated global dry bulk shipping routes
 */
export const EarthGlobe = ({
  radius = 2.0,
  position = [0, 0, 0],
  rotation = [0.2, 0, 0],
  routesOpacity = 1.0,
  autoRotate = true,
  rotationSpeed = 0.0012
}) => {
  const globeGroupRef = useRef();
  const cloudsRef = useRef();

  // Generate textures locally
  const dayTexture = useMemo(() => createEarthDayTexture(2048, 1024), []);
  const specularTexture = useMemo(() => createEarthSpecularTexture(1024, 512), []);
  const cloudsTexture = useMemo(() => createEarthCloudTexture(2048, 1024), []);
  const nightTexture = useMemo(() => createEarthNightTexture(1024, 512), []);

  useFrame((state, delta) => {
    if (autoRotate && globeGroupRef.current) {
      globeGroupRef.current.rotation.y += rotationSpeed;
    }
    // Cloud layer differential rotation (moves slightly faster than Earth crust)
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += rotationSpeed * 1.35;
    }
  });

  return (
    <group ref={globeGroupRef} position={position} rotation={rotation} name="EarthGlobe">
      {/* 1. Base Planetary Crust & Ocean Surface */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={dayTexture}
          roughnessMap={specularTexture}
          roughness={0.65}
          metalness={0.15}
          emissiveMap={nightTexture}
          emissive="#ffffff"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* 2. Rotating Atmospheric Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius * 1.012, 64, 64]} />
        <meshStandardMaterial
          map={cloudsTexture}
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.NormalBlending}
          roughness={1.0}
        />
      </mesh>

      {/* 3. Outer Rayleigh Atmospheric Scattering Rim */}
      <AtmosphereShader radius={radius * 1.12} color="#38bdf8" power={3.2} multiplier={2.4} />

      {/* 4. Global Maritime Trade Corridors */}
      <GlobalTradeRoutes globeRadius={radius} opacity={routesOpacity} />
    </group>
  );
};
