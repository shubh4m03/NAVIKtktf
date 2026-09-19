import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getMaritimeGlobeCurve, GLOBE_RADIUS } from '../../utils/globeCoordinates';

/**
 * Route Line plotted directly on the planetary sphere
 * 
 * Features:
 * - Rotates in physical lockstep with Earth and connects into global network
 * - Real-world depth occlusion: hidden when on the back side of Earth
 * - Thin, elegant, restrained nautical slate-cyan styling (no laser beams or neon tubes)
 */
export const RouteOnGlobe = ({ progress = 0 }) => {
  const lineRef = useRef();
  const curve = useMemo(() => getMaritimeGlobeCurve(GLOBE_RADIUS, 0.014), []);

  useFrame(() => {
    if (!lineRef.current) return;

    // Route begins revealing after ship is established (progress >= 0.35)
    if (progress < 0.35) {
      lineRef.current.visible = false;
      return;
    }

    lineRef.current.visible = true;

    // Calculate vessel progress mapping (0.0 to 1.0)
    const vesselT = Math.min(1.0, Math.max(0.0, (progress - 0.08) / 0.82));
    const sampleCount = Math.max(3, Math.floor(vesselT * 80));
    const points = [];
    for (let i = 0; i <= sampleCount; i++) {
      const t = (i / 80);
      points.push(curve.getPoint(t));
    }

    lineRef.current.geometry.setFromPoints(points);

    // Subtle fade in opacity (0.0 to 0.45)
    const routeFade = Math.min(0.48, (progress - 0.35) * 2.5);
    lineRef.current.material.opacity = routeFade;
  });

  const initialGeometry = useMemo(() => new THREE.BufferGeometry(), []);

  return (
    <group name="GlobalRouteLine">
      <line ref={lineRef} geometry={initialGeometry} visible={false}>
        <lineBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.0}
          linewidth={1.2}
          depthTest={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>
    </group>
  );
};
