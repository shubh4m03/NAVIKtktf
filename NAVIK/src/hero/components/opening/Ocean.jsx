import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Photorealistic Dark Ocean Surface for Cinematic Opening
 * 
 * Features:
 * - Low-key open sea palette (dark navy/blue-black)
 * - Subtle realistic multi-frequency wave vertex displacement
 * - Restrained specular reflection without cartoonishness or neon bloom
 */
export const Ocean = () => {
  const meshRef = useRef();

  // Create high-density grid for subtle wave displacement
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(60, 60, 96, 96);
  }, []);

  // Frame-rate independent wave animation
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;

    // Realistic open-sea wave calculation (primary swell + cross swells)
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);

      // Main ocean swell
      const wave1 = Math.sin(u * 0.4 + v * 0.3 + t * 0.7) * 0.04;
      // Cross chop
      const wave2 = Math.cos(u * 0.8 - v * 0.6 + t * 1.1) * 0.02;
      // Micro-surface ripples
      const wave3 = Math.sin(u * 1.6 + t * 1.8) * Math.cos(v * 1.4 + t * 1.4) * 0.008;

      pos.setZ(i, wave1 + wave2 + wave3);
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <group name="CinematicOceanStage">
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.06, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#030914" // Deep dark navy water
          roughness={0.22}
          metalness={0.35}
          flatShading={false}
        />
      </mesh>
    </group>
  );
};
