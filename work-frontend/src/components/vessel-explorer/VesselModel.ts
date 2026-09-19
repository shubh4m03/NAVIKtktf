// ─────────────────────────────────────────────────────────────
// components/vessel-explorer/VesselModel.ts
// VesselModel provider abstraction separating visual geometry from vessel data
// ─────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { MaterialBundle } from './VesselMaterials';
import { buildCommercialVessel, VesselBuildOptions } from './VesselGeometryBuilder';
import { VesselSubsystem, VisualRenderMode } from './VesselTypes';

export interface IVesselModelProvider {
  loadModel(
    vesselClass: string,
    options: VesselBuildOptions,
    materials: MaterialBundle
  ): Promise<THREE.Group>;
}

/**
 * Procedural Commercial Naval Architecture Generator Fallback.
 * Ensures that if high-quality GLB assets are not present,
 * an authentic, accurately-proportioned commercial naval architecture model is rendered.
 */
export class ProceduralVesselModelProvider implements IVesselModelProvider {
  async loadModel(
    _vesselClass: string,
    options: VesselBuildOptions,
    materials: MaterialBundle
  ): Promise<THREE.Group> {
    return buildCommercialVessel(materials, options);
  }
}

/**
 * GLTF/GLB Asset Provider Abstraction.
 * Prepared for future CAD/BIM maritime GLB file ingestion.
 */
export class GLTFVesselModelProvider implements IVesselModelProvider {
  private fallbackProvider = new ProceduralVesselModelProvider();
  private modelUrlMap: Record<string, string> = {
    // Extensible URL mapping for commercial GLTF assets
  };

  async loadModel(
    vesselClass: string,
    options: VesselBuildOptions,
    materials: MaterialBundle
  ): Promise<THREE.Group> {
    const url = this.modelUrlMap[vesselClass.toLowerCase()];
    if (!url) {
      // Gracefully fall back to procedural naval architecture generator
      return this.fallbackProvider.loadModel(vesselClass, options, materials);
    }

    try {
      // Dynamic import of GLTFLoader if an external asset is configured
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(url);
      return gltf.scene;
    } catch {
      return this.fallbackProvider.loadModel(vesselClass, options, materials);
    }
  }
}

// Global active model provider instance
export const defaultVesselModelProvider: IVesselModelProvider = new GLTFVesselModelProvider();

/**
 * Thoroughly disposes of all geometries and materials across a Three.js hierarchy.
 * Prevents GPU memory leaks and WebGL context bloat.
 */
export function disposeThreeHierarchy(root: THREE.Object3D) {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    }
  });
}

/**
 * Highlight & Subsystem Inspector.
 * Operates directly on the loaded scene graph without recreating any geometry or tearing down the canvas.
 * Restrained engineering highlighting without neon or sci-fi saturation.
 */
export function applyVesselSubsystemHighlight(
  rootGroup: THREE.Group,
  activeSubsystem: VesselSubsystem,
  visualMode: VisualRenderMode
) {
  const isXRay = visualMode === 'xray';
  const isWireframe = visualMode === 'wireframe';

  rootGroup.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const sub = (mesh.userData?.subsystem as string) || '';

      // Update wireframe property on the existing material
      if (mesh.material && !Array.isArray(mesh.material)) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if ('wireframe' in mat) {
          mat.wireframe = isWireframe;
        }
      }

      if (activeSubsystem === 'all') {
        mesh.visible = true;
        if (mesh.material && !Array.isArray(mesh.material)) {
          if (isXRay && (sub === 'hull' || sub === 'deck')) {
            mesh.material.transparent = true;
            mesh.material.opacity = 0.22;
            mesh.material.depthWrite = false;
          } else {
            mesh.material.transparent = false;
            mesh.material.opacity = 1.0;
            mesh.material.depthWrite = true;
          }
        }
        return;
      }

      // Targeted subsystem highlighting
      const isTarget = sub === activeSubsystem;
      const isStructuralShell = sub === 'hull' || sub === 'deck';

      if (isTarget) {
        mesh.visible = true;
        if (mesh.material && !Array.isArray(mesh.material)) {
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
          mesh.material.depthWrite = true;
        }
      } else if (isStructuralShell) {
        // Hull/Deck become ghosted context in X-Ray / Subsystem view
        mesh.visible = true;
        if (mesh.material && !Array.isArray(mesh.material)) {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.15;
          mesh.material.depthWrite = false;
        }
      } else {
        // Other non-targeted internal subsystems are hidden to give pristine clarity
        mesh.visible = isXRay;
        if (mesh.material && !Array.isArray(mesh.material)) {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.08;
          mesh.material.depthWrite = false;
        }
      }
    }
  });
}
