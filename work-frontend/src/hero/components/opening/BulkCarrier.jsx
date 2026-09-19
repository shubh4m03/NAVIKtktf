import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MARITIME_CURVE } from './Route';
import { HERO_CONFIG } from '../../config/heroConfig';
import { ErrorBoundary } from '../common/ErrorBoundary';

/**
 * Realistic Bulk Carrier Geometry (Capesize/Panamax style)
 * Clean dark topsides, boot-topping waterline, 5 cargo holds, and aft bridge.
 */
const BulkCarrierHull = ({ scale = 0.65 }) => {
  return (
    <group scale={scale}>
      {/* Main Steel Hull */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.15, 1.7]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Red Antifouling Waterline */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.32, 0.05, 1.66]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
      </mesh>

      {/* Tapered Bow Section */}
      <mesh position={[0, 0.04, 0.92]} rotation={[0, Math.PI, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.17, 0.2, 3]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* 5 Dry Bulk Cargo Holds */}
      {[-0.45, -0.22, 0.01, 0.24, 0.47].map((zPos, idx) => (
        <mesh key={idx} position={[0, 0.12, zPos]} castShadow>
          <boxGeometry args={[0.24, 0.035, 0.15]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      ))}

      {/* Aft Superstructure & Bridge Tower */}
      <group position={[0, 0.2, -0.62]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.16, 0.2]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.2} />
        </mesh>
        {/* Navigation Bridge Window Band */}
        <mesh position={[0, 0.04, 0.105]}>
          <boxGeometry args={[0.22, 0.03, 0.015]} />
          <meshStandardMaterial color="#0284c7" roughness={0.2} />
        </mesh>
        {/* Exhaust Funnel */}
        <mesh position={[0, 0.12, -0.05]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.1, 10]} />
          <meshStandardMaterial color="#991b1b" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * GLTF Asset Loader with fallback
 */
const GLTFModelAsset = ({ path }) => {
  const { scene } = useGLTF(path);
  return <primitive object={scene} scale={0.65} />;
};

/**
 * Restrained Kelvin Wake Trail
 * Subtle expanding V-angle foam trail dispersing behind the vessel
 */
const KelvinWake = () => {
  return (
    <group position={[0, 0.005, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Central stern churn foam */}
      <mesh position={[0, 0.2, 0]}>
        <planeGeometry args={[0.25, 0.6]} />
        <meshBasicMaterial
          color="#e2e8f0"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Port wake feather */}
      <mesh position={[-0.14, 0.55, 0]} rotation={[0, 0, 0.14]}>
        <planeGeometry args={[0.08, 1.1]} />
        <meshBasicMaterial
          color="#cbd5e1"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Starboard wake feather */}
      <mesh position={[0.14, 0.55, 0]} rotation={[0, 0, -0.14]}>
        <planeGeometry args={[0.08, 1.1]} />
        <meshBasicMaterial
          color="#cbd5e1"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

/**
 * BulkCarrier Component
 * Animates along the curved maritime route with real-time buoyancy and wake.
 */
export const BulkCarrier = ({ progress = 0 }) => {
  const vesselGroupRef = useRef();
  const config = HERO_CONFIG.models.ship;

  useFrame((state) => {
    if (!vesselGroupRef.current) return;

    // 1. Calculate position on curve
    const clampedProgress = Math.min(1.0, Math.max(0.0, progress));
    const currentPoint = MARITIME_CURVE.getPoint(clampedProgress);
    
    // 2. Calculate tangent orientation along curve
    const nextPoint = MARITIME_CURVE.getPoint(Math.min(1.0, clampedProgress + 0.01));
    const tangent = new THREE.Vector3().subVectors(nextPoint, currentPoint).normalize();

    // 3. Subtle hydrodynamic buoyancy (pitch, roll, heave based on waves and speed)
    const t = state.clock.getElapsedTime();
    const heave = Math.sin(t * 1.5 + clampedProgress * 10) * 0.012;
    const pitch = Math.sin(t * 1.2) * 0.015;
    const roll = Math.cos(t * 0.9) * 0.01;

    // Apply translation
    vesselGroupRef.current.position.set(currentPoint.x, currentPoint.y + heave, currentPoint.z);

    // Orient forward along curve tangent
    vesselGroupRef.current.lookAt(
      currentPoint.x + tangent.x,
      currentPoint.y,
      currentPoint.z + tangent.z
    );

    // Apply buoyancy tilt
    vesselGroupRef.current.rotation.x += pitch;
    vesselGroupRef.current.rotation.z += roll;
  });

  return (
    <group ref={vesselGroupRef} name="BulkCarrierVessel">
      {/* 3D Ship Mesh with GLB support and fallback */}
      <ErrorBoundary
        name="BulkCarrierAsset"
        fallback={<BulkCarrierHull scale={0.65} />}
      >
        <Suspense fallback={<BulkCarrierHull scale={0.65} />}>
          <GLTFModelAsset path={config.path} />
        </Suspense>
      </ErrorBoundary>

      {/* Subtle, restrained ocean wake */}
      <KelvinWake />
    </group>
  );
};
