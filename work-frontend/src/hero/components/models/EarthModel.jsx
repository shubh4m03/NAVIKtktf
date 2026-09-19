import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { HERO_CONFIG } from '../../config/heroConfig';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ModelFallback } from './ModelFallback';

/**
 * Internal loader for Earth GLTF/GLB asset
 */
const EarthAsset = ({ config, onLoaded }) => {
  const earthRef = useRef();
  const { scene } = useGLTF(config.path);

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += config.rotationSpeed || 0.001;
    }
  });

  return (
    <primitive 
      ref={earthRef}
      object={scene} 
      position={config.initialPosition} 
      rotation={config.initialRotation} 
      scale={config.initialScale} 
    />
  );
};

/**
 * Robust EarthModel component with Suspense and ErrorBoundary safety
 */
export const EarthModel = ({ customConfig, onAssetMissing }) => {
  const config = { ...HERO_CONFIG.models.earth, ...customConfig };

  return (
    <ErrorBoundary 
      name="EarthModel"
      onError={(err) => {
        if (onAssetMissing) onAssetMissing('Earth Model', config.path);
      }}
      fallback={
        <ModelFallback 
          type="sphere" 
          label={`Earth Model (${config.path})`}
          position={config.initialPosition}
          scale={config.initialScale}
          color={config.fallback.color}
        />
      }
    >
      <Suspense fallback={
        <ModelFallback 
          type="sphere" 
          label="Loading Earth..."
          position={config.initialPosition}
          scale={config.initialScale}
          color={config.fallback.color}
        />
      }>
        <EarthAsset config={config} />
      </Suspense>
    </ErrorBoundary>
  );
};

// Preload helper
export const preloadEarthModel = (path = HERO_CONFIG.models.earth.path) => {
  try {
    useGLTF.preload(path);
  } catch (e) {
    // Ignore preload error if file doesn't exist yet
  }
};
