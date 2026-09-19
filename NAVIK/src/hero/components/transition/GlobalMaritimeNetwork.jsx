import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { 
  GLOBAL_MARITIME_NETWORK, 
  createSphericalArc, 
  GLOBE_RADIUS 
} from '../../utils/globeCoordinates';

/**
 * Global Maritime Shipping Network Component
 * 
 * Features:
 * - Rotates in physical lockstep with the Earth
 * - Natural depth occlusion: back-side routes disappear behind the opaque Earth sphere
 * - Progressive staggered reveal sequence (6.0s to 7.2s / progress 0.74 to 0.88)
 * - Subtle alive luminance breathing in the final global view
 */
export const GlobalMaritimeNetwork = ({ progress = 0 }) => {
  const lineRefs = useRef([]);

  // Pre-generate spherical arc geometries for all corridors
  const corridorGeometries = useMemo(() => {
    return GLOBAL_MARITIME_NETWORK.map((corridor) => {
      const points = createSphericalArc(corridor.points, GLOBE_RADIUS, 0.015, 24);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return {
        id: corridor.id,
        tier: corridor.tier,
        geometry,
        totalPoints: points.length
      };
    });
  }, []);

  // Progressive reveal animation & subtle alive breathing
  useFrame((state) => {
    if (progress < 0.72) {
      corridorGeometries.forEach((_, idx) => {
        const line = lineRefs.current[idx];
        if (line) line.visible = false;
      });
      return;
    }

    const time = state.clock.getElapsedTime();
    const pulseFactor = 0.52 + Math.sin(time * 1.5) * 0.08;

    corridorGeometries.forEach((item, idx) => {
      const line = lineRefs.current[idx];
      if (!line) return;

      // Tier reveal windows
      let tierStart = 0.74;
      let tierEnd = 0.81;

      if (item.tier === 2) {
        tierStart = 0.79;
        tierEnd = 0.85;
      } else if (item.tier === 3) {
        tierStart = 0.83;
        tierEnd = 0.89;
      }

      if (progress < tierStart) {
        line.visible = false;
      } else {
        line.visible = true;
        const tierProgress = Math.min(1.0, Math.max(0.0, (progress - tierStart) / (tierEnd - tierStart)));
        
        // Progressive draw range
        const visibleCount = Math.max(2, Math.floor(tierProgress * item.totalPoints));
        line.geometry.setDrawRange(0, visibleCount);

        // Soft restrained opacity
        line.material.opacity = Math.min(0.65, tierProgress * pulseFactor);
      }
    });
  });

  return (
    <group name="GlobalMaritimeNetwork">
      {corridorGeometries.map((item, idx) => (
        <line 
          key={item.id} 
          ref={(el) => (lineRefs.current[idx] = el)} 
          geometry={item.geometry}
          visible={false}
        >
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
      ))}
    </group>
  );
};
