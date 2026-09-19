import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Procedural Dynamic Ocean Surface & Route Waypoint Visualization
 * Used for the top-down close-up cinematic sequence (Stage 1 to 3)
 */
export const OceanSurface = ({ 
  opacity = 1.0, 
  routeProgress = 0.0,
  vesselPosition = [0, 0, 0]
}) => {
  const oceanMeshRef = useRef();
  const routeLineRef = useRef();

  // Create nautical route trajectory points
  const routePoints = useMemo(() => {
    const points = [];
    const numPoints = 80;
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      // Gentle S-curve maritime navigation channel
      const x = (t - 0.5) * 6.0;
      const z = Math.sin(t * Math.PI * 1.5) * 1.2 + (t - 0.5) * 4.0;
      points.push(new THREE.Vector3(x, 0.02, z));
    }
    return points;
  }, []);

  // Geometry for the glowing route line
  const routeGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(routePoints);
  }, [routePoints]);

  // Animate subtle ocean water waves
  useFrame((state) => {
    if (oceanMeshRef.current && opacity > 0.01) {
      const t = state.clock.getElapsedTime();
      const geom = oceanMeshRef.current.geometry;
      const pos = geom.attributes.position;
      
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const wave = Math.sin(u * 2.0 + t * 1.2) * 0.015 + Math.cos(v * 2.5 + t * 0.9) * 0.012;
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group name="LocalOceanStage" visible={opacity > 0.01}>
      {/* 1. Dark Cinematic Ocean Water Surface */}
      <mesh 
        ref={oceanMeshRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.05, 0]} 
        receiveShadow
      >
        <planeGeometry args={[20, 20, 48, 48]} />
        <meshStandardMaterial
          color="#041226"
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={opacity * 0.92}
        />
      </mesh>

      {/* 2. Dynamic Illuminated Voyage Trajectory */}
      {routeProgress > 0.01 && (
        <group name="VoyageRoute">
          <line ref={routeLineRef} geometry={routeGeometry}>
            <lineBasicMaterial
              color="#00d4ff"
              transparent
              opacity={Math.min(1.0, routeProgress * 1.5) * opacity}
              linewidth={2.5}
              blending={THREE.AdditiveBlending}
            />
          </line>

          {/* Waypoint Telemetry Beacons along route */}
          {[-0.35, 0.0, 0.35].map((offset, idx) => {
            const idxPoint = Math.floor((offset + 0.5) * 70);
            const pt = routePoints[idxPoint] || new THREE.Vector3();
            return (
              <group key={idx} position={[pt.x, pt.y + 0.02, pt.z]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.06, 0.08, 24]} />
                  <meshBasicMaterial 
                    color="#00d4ff" 
                    transparent 
                    opacity={0.8 * opacity} 
                    side={THREE.DoubleSide} 
                  />
                </mesh>
                <pointLight color="#00d4ff" intensity={0.4 * opacity} distance={1.2} />
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
};
