import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Predefined Curved Maritime Route Path
 * Starts from the upper screen/frame and curves naturally across open sea.
 */
export const MARITIME_CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(1.8, 0.01, -6.5),  // Upper entry point
  new THREE.Vector3(0.6, 0.01, -3.2),  // Mid-upper waypoint
  new THREE.Vector3(-0.4, 0.01, -0.4), // Mid-screen turn
  new THREE.Vector3(-0.9, 0.01, 2.2),  // Lower-mid turn
  new THREE.Vector3(-0.5, 0.01, 5.5)   // Exit forward
]);

/**
 * Restrained Maritime Navigation Route Line
 * 
 * Features:
 * - Appears subtly underneath and behind the vessel after a short distance
 * - Thin, elegant, slightly luminous nautical styling (no giant glowing beam)
 * - Subtle waypoint tick markers
 */
export const Route = ({ progress = 0 }) => {
  const lineRef = useRef();

  // Generate dynamic line vertices corresponding to current vessel progress
  useFrame(() => {
    if (!lineRef.current) return;
    
    // Only reveal after the vessel has moved a short distance (progress > 0.12)
    if (progress < 0.12) {
      lineRef.current.visible = false;
      return;
    }

    lineRef.current.visible = true;

    // Sample curve points from entry up to vessel current position
    const sampleCount = Math.max(2, Math.floor(progress * 60));
    const points = [];
    for (let i = 0; i <= sampleCount; i++) {
      const t = (i / 60);
      points.push(MARITIME_CURVE.getPoint(t));
    }

    lineRef.current.geometry.setFromPoints(points);
  });

  const initialGeometry = useMemo(() => new THREE.BufferGeometry(), []);

  return (
    <group name="MaritimeNavigationRoute">
      {/* Thin, elegant, slightly luminous nautical navigation trail */}
      <line ref={lineRef} geometry={initialGeometry} visible={false}>
        <lineBasicMaterial
          color="#94a3b8" // Restrained slate-cyan maritime trail
          transparent
          opacity={0.4}
          linewidth={1}
          blending={THREE.AdditiveBlending}
        />
      </line>

      {/* Subtle nautical waypoint markers */}
      {[0.25, 0.5, 0.75].map((tWaypoint, idx) => {
        const pt = MARITIME_CURVE.getPoint(tWaypoint);
        const isPassed = progress >= tWaypoint;
        return (
          <group key={idx} position={[pt.x, 0.015, pt.z]} visible={isPassed}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.035, 0.045, 16]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
