// ─────────────────────────────────────────────────────────────
// components/vessel-explorer/VesselMaterials.ts
// Physically plausible marine PBR materials for commercial vessels
// ─────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { VesselSubsystem, VisualRenderMode } from './VesselTypes';

export interface MaterialBundle {
  upperHull: THREE.MeshStandardMaterial;
  lowerHull: THREE.MeshStandardMaterial;
  bootTop: THREE.MeshStandardMaterial;
  deck: THREE.MeshStandardMaterial;
  superstructure: THREE.MeshStandardMaterial;
  bridgeGlass: THREE.MeshStandardMaterial;
  funnelBase: THREE.MeshStandardMaterial;
  funnelBand: THREE.MeshStandardMaterial;
  mast: THREE.MeshStandardMaterial;
  // Subsystem materials
  holds: THREE.MeshStandardMaterial;
  hatchCovers: THREE.MeshStandardMaterial;
  ballast: THREE.MeshStandardMaterial;
  engine: THREE.MeshStandardMaterial;
  fuel: THREE.MeshStandardMaterial;
  cranes: THREE.MeshStandardMaterial;
  containers: THREE.MeshStandardMaterial[];
  lngTanks: THREE.MeshStandardMaterial;
  water: THREE.MeshStandardMaterial;
}

export function createVesselMaterials(
  isLight: boolean,
  visualMode: VisualRenderMode,
  activeSubsystem: VesselSubsystem
): MaterialBundle {
  const isWireframe = visualMode === 'wireframe';
  const isXRay = visualMode === 'xray';

  // In X-Ray mode, external hull panels become ghosted/translucent so internal arrangements stand out
  const hullOpacity = isXRay ? 0.18 : 1.0;
  const hullTransparent = isXRay;

  // Highlight color adjustments (restrained engineering tones, NOT neon glow)
  const isHoldHighlighted = activeSubsystem === 'holds';
  const isBallastHighlighted = activeSubsystem === 'ballast';
  const isEngineHighlighted = activeSubsystem === 'engine';
  const isFuelHighlighted = activeSubsystem === 'fuel';
  const isBridgeHighlighted = activeSubsystem === 'bridge';

  // 1. External Hull Materials
  const upperHull = new THREE.MeshStandardMaterial({
    color: isLight ? 0x1c2b38 : 0x14202c,
    roughness: 0.55,
    metalness: 0.3,
    wireframe: isWireframe,
    transparent: hullTransparent,
    opacity: hullOpacity,
    depthWrite: !hullTransparent,
  });

  const lowerHull = new THREE.MeshStandardMaterial({
    color: isLight ? 0x7c2622 : 0x6e201c, // Marine Red-Oxide anti-fouling
    roughness: 0.65,
    metalness: 0.2,
    wireframe: isWireframe,
    transparent: hullTransparent,
    opacity: hullOpacity,
    depthWrite: !hullTransparent,
  });

  const bootTop = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    wireframe: isWireframe,
    transparent: hullTransparent,
    opacity: isXRay ? 0.25 : 1.0,
  });

  const deck = new THREE.MeshStandardMaterial({
    color: isLight ? 0x344b5e : 0x253747,
    roughness: 0.75,
    metalness: 0.15,
    wireframe: isWireframe,
    transparent: isXRay && activeSubsystem !== 'all',
    opacity: isXRay && activeSubsystem !== 'all' ? 0.3 : 1.0,
  });

  // 2. Superstructure & Bridge
  const superstructure = new THREE.MeshStandardMaterial({
    color: isBridgeHighlighted ? 0x126b9a : 0xedf2f7,
    roughness: 0.35,
    metalness: 0.15,
    wireframe: isWireframe,
    transparent: isXRay && !isBridgeHighlighted && activeSubsystem !== 'all',
    opacity: isXRay && !isBridgeHighlighted && activeSubsystem !== 'all' ? 0.35 : 1.0,
  });

  const bridgeGlass = new THREE.MeshStandardMaterial({
    color: 0x112d42,
    roughness: 0.1,
    metalness: 0.85,
    wireframe: isWireframe,
  });

  const funnelBase = new THREE.MeshStandardMaterial({
    color: 0x14202c,
    roughness: 0.4,
    wireframe: isWireframe,
  });

  const funnelBand = new THREE.MeshStandardMaterial({
    color: 0x0b628c, // NAVIK Commercial Maritime Blue Band
    roughness: 0.3,
    wireframe: isWireframe,
  });

  const mast = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.3,
    wireframe: isWireframe,
  });

  // 3. Technical Subsystem Materials
  const holds = new THREE.MeshStandardMaterial({
    color: isHoldHighlighted ? 0x0e7490 : 0x1e3a52, // Cyan-slate highlight for holds
    roughness: 0.4,
    metalness: 0.35,
    wireframe: isWireframe,
    transparent: false,
    opacity: 1.0,
  });

  const hatchCovers = new THREE.MeshStandardMaterial({
    color: isHoldHighlighted ? 0x0e7490 : 0x7c2622,
    roughness: 0.5,
    metalness: 0.25,
    wireframe: isWireframe,
    transparent: isXRay && activeSubsystem !== 'all',
    opacity: isXRay && activeSubsystem !== 'all' ? 0.35 : 1.0,
  });

  const ballast = new THREE.MeshStandardMaterial({
    color: isBallastHighlighted ? 0x0284c7 : 0x155e75, // Sea water blue/cyan
    roughness: 0.35,
    metalness: 0.4,
    wireframe: isWireframe,
    transparent: false,
    opacity: 1.0,
  });

  const engine = new THREE.MeshStandardMaterial({
    color: isEngineHighlighted ? 0xc2410c : 0x7c3aed, // Machinery bronze/amber
    roughness: 0.45,
    metalness: 0.6,
    wireframe: isWireframe,
    transparent: false,
    opacity: 1.0,
  });

  const fuel = new THREE.MeshStandardMaterial({
    color: isFuelHighlighted ? 0xb45309 : 0x475569, // Petroleum amber
    roughness: 0.4,
    metalness: 0.5,
    wireframe: isWireframe,
    transparent: false,
    opacity: 1.0,
  });

  const cranes = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Commercial yellow/orange deck cranes
    roughness: 0.4,
    metalness: 0.3,
    wireframe: isWireframe,
  });

  const containerColors = [0x0b628c, 0x881337, 0x166534, 0x9a3412, 0x334155];
  const containers = containerColors.map((c) =>
    new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.6,
      metalness: 0.2,
      wireframe: isWireframe,
    })
  );

  const lngTanks = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.8,
    roughness: 0.2,
    wireframe: isWireframe,
  });

  // Sea Water Surface Plane
  const water = new THREE.MeshStandardMaterial({
    color: isLight ? 0x24587a : 0x071e30,
    transparent: true,
    opacity: isLight ? 0.32 : 0.42,
    roughness: 0.15,
    metalness: 0.8,
    side: THREE.DoubleSide,
  });

  const materials = {
    upperHull,
    lowerHull,
    bootTop,
    deck,
    superstructure,
    bridgeGlass,
    funnelBase,
    funnelBand,
    mast,
    holds,
    hatchCovers,
    ballast,
    engine,
    fuel,
    cranes,
    containers,
    lngTanks,
    water,
  };

  if (isWireframe) {
    const wireColor = isLight ? 0x587083 : 0x7daac3;
    Object.entries(materials).forEach(([key, mat]) => {
      if (key === 'water') return; // Keep water translucent
      if (Array.isArray(mat)) {
        mat.forEach(m => {
          m.color.setHex(wireColor);
          m.transparent = false;
          m.opacity = 1.0;
          m.depthWrite = true;
        });
      } else {
        mat.color.setHex(wireColor);
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.depthWrite = true;
      }
    });
  }

  return materials;
}
