import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/**
 * 3D Holographic/Wireframe fallback displayed when a 3D asset is not found
 * Keeps the scene interactive and visual without crashing.
 */
export const ModelFallback = ({ 
  type = 'sphere', 
  label = 'Asset Loading...',
  position = [0, 0, 0],
  scale = 1,
  color = '#00d4ff',
  dimensions = [1, 1, 1]
}) => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh ref={meshRef}>
        {type === 'sphere' ? (
          <sphereGeometry args={[1, 24, 24]} />
        ) : (
          <boxGeometry args={dimensions} />
        )}
        <meshStandardMaterial 
          color={color} 
          wireframe 
          transparent 
          opacity={0.35} 
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Non-intrusive 3D HUD tag */}
      <Html position={[0, type === 'sphere' ? 1.3 : 0.8, 0]} center distanceFactor={12}>
        <div style={{
          background: 'rgba(3, 7, 18, 0.85)',
          border: `1px solid ${color}`,
          borderRadius: '4px',
          padding: '2px 8px',
          color: color,
          fontSize: '10px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          boxShadow: `0 0 10px ${color}33`,
          pointerEvents: 'none'
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
};
