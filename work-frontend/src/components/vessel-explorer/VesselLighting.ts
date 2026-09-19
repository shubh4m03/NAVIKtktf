// ─────────────────────────────────────────────────────────────
// components/vessel-explorer/VesselLighting.ts
// Maritime Natural Inspection Lighting (Key, Fill, Rim, Ambient)
// ─────────────────────────────────────────────────────────────

import * as THREE from 'three';

export interface LightingRig {
  hemisphere: THREE.HemisphereLight;
  keySun: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  rimLight: THREE.DirectionalLight;
  updateTheme: (isLight: boolean) => void;
}

export function createVesselLightingRig(scene: THREE.Scene, isLight: boolean): LightingRig {
  // 1. Natural Marine Sky & Ocean Ambient Hemisphere
  const hemisphere = new THREE.HemisphereLight(
    isLight ? 0xffffff : 0x88b0cc,
    isLight ? 0xaec3d2 : 0x05101a,
    isLight ? 1.4 : 0.95
  );
  scene.add(hemisphere);

  // 2. Primary Key Sun Light (Directional with soft maritime shadows)
  const keySun = new THREE.DirectionalLight(0xffffff, isLight ? 2.1 : 1.7);
  keySun.position.set(65, 85, 55);
  keySun.castShadow = true;
  keySun.shadow.mapSize.width = 1024;
  keySun.shadow.mapSize.height = 1024;
  keySun.shadow.camera.near = 10;
  keySun.shadow.camera.far = 300;
  keySun.shadow.bias = -0.0005;
  scene.add(keySun);

  // 3. Diffuse Fill Light (Simulating open water sea bounce)
  const fillLight = new THREE.DirectionalLight(isLight ? 0xcce3f0 : 0x0f3d5c, isLight ? 0.7 : 0.55);
  fillLight.position.set(-65, 30, -45);
  scene.add(fillLight);

  // 4. Subtle Rim Light (Subtle graze along hull lines, no neon glare)
  const rimLight = new THREE.DirectionalLight(isLight ? 0x93c5fd : 0x1e3a5f, isLight ? 0.45 : 0.65);
  rimLight.position.set(0, 15, -95);
  scene.add(rimLight);

  const updateTheme = (lightMode: boolean) => {
    hemisphere.color.setHex(lightMode ? 0xffffff : 0x88b0cc);
    hemisphere.groundColor.setHex(lightMode ? 0xaec3d2 : 0x05101a);
    hemisphere.intensity = lightMode ? 1.4 : 0.95;

    keySun.intensity = lightMode ? 2.1 : 1.7;
    fillLight.color.setHex(lightMode ? 0xcce3f0 : 0x0f3d5c);
    fillLight.intensity = lightMode ? 0.7 : 0.55;

    rimLight.color.setHex(lightMode ? 0x93c5fd : 0x1e3a5f);
    rimLight.intensity = lightMode ? 0.45 : 0.65;
  };

  return {
    hemisphere,
    keySun,
    fillLight,
    rimLight,
    updateTheme,
  };
}
