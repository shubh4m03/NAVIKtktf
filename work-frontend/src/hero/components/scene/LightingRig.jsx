import React from 'react';
import { HERO_CONFIG } from '../../config/heroConfig';

/**
 * Atmospheric & Cinematic Maritime Lighting Rig
 */
export const LightingRig = ({ customLighting }) => {
  const lighting = { ...HERO_CONFIG.lighting, ...customLighting };

  return (
    <group name="LightingRig">
      {/* Ambient ambient fill */}
      <ambientLight intensity={lighting.ambientIntensity} />

      {/* Main directional Sun / Key Light */}
      <directionalLight
        position={lighting.sunLight.position}
        intensity={lighting.sunLight.intensity}
        color={lighting.sunLight.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Cyan Rim Light for futuristic maritime silhouette */}
      <directionalLight
        position={lighting.rimLight.position}
        intensity={lighting.rimLight.intensity}
        color={lighting.rimLight.color}
      />

      {/* Deep ocean upward bounce light */}
      <pointLight
        position={lighting.oceanGlowLight.position}
        intensity={lighting.oceanGlowLight.intensity}
        color={lighting.oceanGlowLight.color}
        distance={20}
        decay={2}
      />
    </group>
  );
};
