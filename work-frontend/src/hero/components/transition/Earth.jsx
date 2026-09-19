import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { AtmosphereShader } from '../scene/AtmosphereShader';
import { GLOBE_RADIUS } from '../../utils/globeCoordinates';
import { HERO_CONFIG } from '../../config/heroConfig';

/**
 * Photorealistic Earth Globe (NASA Blue Marble Satellite Data)
 * 
 * Features:
 * - Genuine NASA Blue Marble 2048x1024 satellite landmass and bathymetry surface
 * - Specular reflection mask (oceans reflect sun glint; continents remain realistic matte)
 * - True topographic normal relief mapping
 * - Authentic NASA Night Lights on the dark hemisphere
 * - Translucent atmospheric cloud layer with subtle physical differential drift
 * - Thin Rayleigh Fresnel limb fading into space
 */
export const Earth = ({ radius = GLOBE_RADIUS }) => {
  const cloudsRef = useRef();
  const texturePaths = HERO_CONFIG.models.earth.textures;

  // Load genuine NASA satellite textures
  const [dayMap, specularMap, normalMap, nightMap, cloudsMap] = useLoader(
    THREE.TextureLoader,
    [
      texturePaths.day,
      texturePaths.specular,
      texturePaths.normal,
      texturePaths.night,
      texturePaths.clouds
    ]
  );

  // Configure texture color spaces and filtering
  useMemo(() => {
    dayMap.colorSpace = THREE.SRGBColorSpace;
    dayMap.wrapS = THREE.RepeatWrapping;
    dayMap.wrapT = THREE.ClampToEdgeWrapping;

    nightMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.wrapS = THREE.RepeatWrapping;
    nightMap.wrapT = THREE.ClampToEdgeWrapping;

    cloudsMap.wrapS = THREE.RepeatWrapping;
    cloudsMap.wrapT = THREE.ClampToEdgeWrapping;

    specularMap.wrapS = THREE.RepeatWrapping;
    specularMap.wrapT = THREE.ClampToEdgeWrapping;

    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.ClampToEdgeWrapping;
  }, [dayMap, specularMap, normalMap, nightMap, cloudsMap]);

  // Extremely subtle differential cloud movement relative to surface
  useFrame((state, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.00015;
    }
  });

  return (
    <group name="PhotorealisticEarthGlobe">
      {/* 1. Authentic NASA Blue Marble Planetary Surface */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={dayMap}
          roughnessMap={specularMap}
          roughness={0.45}
          metalness={0.12}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.35, 0.35)}
          emissiveMap={nightMap}
          emissive="#ffffff"
          emissiveIntensity={0.55}
        />
      </mesh>

      {/* 2. Realistic Rotating Cloud Sphere */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius * 1.006, 96, 96]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.38}
          depthWrite={false}
          blending={THREE.NormalBlending}
          roughness={1.0}
        />
      </mesh>

      {/* 3. Subtle Rayleigh Atmospheric Scattering Horizon Limb */}
      <AtmosphereShader
        radius={radius * 1.065}
        color="#38bdf8"
        power={4.2}
        multiplier={1.9}
        sunPosition={HERO_CONFIG.lighting.sun.position}
      />
    </group>
  );
};
