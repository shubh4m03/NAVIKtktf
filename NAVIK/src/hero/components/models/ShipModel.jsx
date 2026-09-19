import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { HERO_CONFIG } from '../../config/heroConfig';
import { ErrorBoundary } from '../common/ErrorBoundary';

/**
 * Procedural Detailed Bulk Carrier Vessel Geometry
 * Realistic Capesize/Panamax dry bulk carrier:
 * - Red antifouling lower hull & dark navy topsides
 * - Cargo hold hatches
 * - Superstructure & bridge tower
 * - Forward mast & deck cranes
 * - Kelvin wake trail
 */
const ProceduralBulkCarrier = ({ scale = 1.0 }) => {
  return (
    <group scale={scale}>
      {/* 1. Main Hull (Elongated Dry Bulk Vessel) */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.16, 1.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* 2. Red Antifouling Boot-topping Bottom */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.36, 0.06, 1.76]} />
        <meshStandardMaterial color="#881337" roughness={0.6} />
      </mesh>

      {/* 3. Bow Section (Tapered Wedge) */}
      <mesh position={[0, 0.05, 0.98]} rotation={[0, Math.PI, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.19, 0.22, 3]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* 4. Cargo Hatches (5 Bulk Holds) */}
      {[-0.5, -0.25, 0, 0.25, 0.5].map((zPos, idx) => (
        <mesh key={idx} position={[0, 0.14, zPos]} castShadow>
          <boxGeometry args={[0.26, 0.04, 0.16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      ))}

      {/* 5. Aft Superstructure Bridge & Nav Tower */}
      <group position={[0, 0.22, -0.68]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.18, 0.22]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Bridge Navigation Windows */}
        <mesh position={[0, 0.05, 0.115]}>
          <boxGeometry args={[0.24, 0.04, 0.02]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.8} />
        </mesh>
        {/* Exhaust Funnel */}
        <mesh position={[0, 0.14, -0.06]} castShadow>
          <cylinderGeometry args={[0.03, 0.035, 0.12, 12]} />
          <meshStandardMaterial color="#e11d48" roughness={0.5} />
        </mesh>
      </group>

      {/* 6. Navigation Lights (Port/Starboard & Stern) */}
      <mesh position={[-0.15, 0.27, -0.58]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color="#ef4444" /> {/* Port Red */}
      </mesh>
      <mesh position={[0.15, 0.27, -0.58]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color="#22c55e" /> {/* Starboard Green */}
      </mesh>

      {/* 7. Ocean Kelvin Wake Foam */}
      <mesh position={[0, -0.02, -0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 1.2]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.35} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
    </group>
  );
};

/**
 * GLTF Asset Loader with Buoyancy Animation
 */
const GLTFShipAsset = ({ path, config }) => {
  const { scene } = useGLTF(path);
  return <primitive object={scene} scale={config.initialScale || 0.75} />;
};

/**
 * ShipModel with ocean wave simulation and GLB fallback
 */
export const ShipModel = ({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  scale = 1.0,
  opacity = 1.0,
  onAssetMissing 
}) => {
  const shipGroupRef = useRef();
  const config = HERO_CONFIG.models.ship;

  // Gentle oceanic buoyancy simulation
  useFrame((state) => {
    if (shipGroupRef.current && opacity > 0.01) {
      const t = state.clock.getElapsedTime() * 1.6;
      // Heave (vertical bobbing)
      shipGroupRef.current.position.y = position[1] + Math.sin(t) * 0.025;
      // Pitch (fore & aft tilt)
      shipGroupRef.current.rotation.x = rotation[0] + Math.sin(t * 0.7) * 0.018;
      // Roll (side-to-side sway)
      shipGroupRef.current.rotation.z = rotation[2] + Math.cos(t * 0.9) * 0.012;
    }
  });

  return (
    <group 
      ref={shipGroupRef} 
      position={position} 
      rotation={rotation} 
      scale={scale}
      visible={opacity > 0.01}
      name="ShipModelGroup"
    >
      <ErrorBoundary
        name="ShipModel"
        onError={() => {
          if (onAssetMissing) onAssetMissing('Ship Model', config.path);
        }}
        fallback={<ProceduralBulkCarrier scale={1.0} />}
      >
        <Suspense fallback={<ProceduralBulkCarrier scale={1.0} />}>
          <GLTFShipAsset path={config.path} config={config} />
        </Suspense>
      </ErrorBoundary>
    </group>
  );
};

// Preload helper
export const preloadShipModel = (path = HERO_CONFIG.models.ship.path) => {
  try {
    useGLTF.preload(path);
  } catch (e) {
    // Ignore preload error if file doesn't exist yet
  }
};
