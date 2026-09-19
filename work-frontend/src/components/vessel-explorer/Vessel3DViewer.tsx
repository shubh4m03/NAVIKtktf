// ─────────────────────────────────────────────────────────────
// components/vessel-explorer/Vessel3DViewer.tsx
// Commercial Naval Architecture 3D Hydrodynamic Inspection Viewport
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';
import { VesselSubsystem, VisualRenderMode } from './VesselTypes';
import { createVesselMaterials } from './VesselMaterials';
import { defaultVesselModelProvider, applyVesselSubsystemHighlight, disposeThreeHierarchy } from './VesselModel';
import { updateVesselExplodedProgress } from './VesselGeometryBuilder';
import { createVesselLightingRig, LightingRig } from './VesselLighting';
import { VesselInspectionOverlay } from './VesselInspectionOverlay';

export interface Vessel3DViewerProps {
  vesselClass: string;
  dwt: number;
  draft: number;
  designDraft?: number;
  beam: number;
  lengthOverall: number;
  speedKnots?: number;
  payloadMt?: number;
  activeSubsystem: VesselSubsystem;
  onSelectSubsystem: (s: VesselSubsystem) => void;
  visualMode: VisualRenderMode;
  onChangeVisualMode: (m: VisualRenderMode) => void;
  explodedProgress: number;
  onChangeExplodedProgress: (val: number) => void;
}

export const Vessel3DViewer: React.FC<Vessel3DViewerProps> = ({
  vesselClass,
  dwt,
  draft,
  designDraft,
  beam,
  lengthOverall,
  speedKnots = 14.0,
  activeSubsystem,
  onSelectSubsystem,
  visualMode,
  onChangeVisualMode,
  explodedProgress,
  onChangeExplodedProgress,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const [showWaterline, setShowWaterline] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  // Stable references for high-frequency interactive updates without tearing down Three.js
  const autoRotateRef = useRef<boolean>(autoRotate);
  const explodedProgressRef = useRef<number>(explodedProgress);
  const activeSubsystemRef = useRef<VesselSubsystem>(activeSubsystem);
  const visualModeRef = useRef<VisualRenderMode>(visualMode);
  const speedRef = useRef<number>(speedKnots);
  const isLightRef = useRef<boolean>(isLight);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const vesselRootRef = useRef<THREE.Group | null>(null);
  const waterlineMeshRef = useRef<THREE.Mesh | null>(null);
  const lightingRigRef = useRef<LightingRig | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Active loaded model reference and race-condition request ID
  const currentVesselModelRef = useRef<THREE.Group | null>(null);
  const currentVesselClassRef = useRef<string>('');
  const loadRequestIdRef = useRef<number>(0);

  // Spherical camera coordinate reference
  const sphericalRef = useRef({
    radius: 120,
    theta: 0.78,
    phi: 1.15,
  });

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const s = sphericalRef.current;
    s.phi = Math.max(0.10, Math.min(Math.PI / 2 - 0.04, s.phi));
    const x = s.radius * Math.sin(s.phi) * Math.sin(s.theta);
    const y = s.radius * Math.cos(s.phi);
    const z = s.radius * Math.sin(s.phi) * Math.cos(s.theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 4, 0);
  }, []);

  const handleSetCameraPreset = (preset: 'threeQuarter' | 'profile' | 'plan' | 'stern') => {
    const s = sphericalRef.current;
    switch (preset) {
      case 'threeQuarter':
        s.radius = 120;
        s.theta = 0.78;
        s.phi = 1.15;
        break;
      case 'profile':
        s.radius = 125;
        s.theta = Math.PI / 2;
        s.phi = Math.PI / 2 - 0.08;
        break;
      case 'plan':
        s.radius = 135;
        s.theta = 0.0;
        s.phi = 0.12;
        break;
      case 'stern':
        s.radius = 110;
        s.theta = Math.PI;
        s.phi = 1.25;
        break;
    }
    updateCameraPosition();
  };

  const handleResetCamera = () => {
    handleSetCameraPreset('threeQuarter');
  };

  // Sync state refs to prevent re-instantiating WebGL context during interactions
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    speedRef.current = speedKnots;
  }, [speedKnots]);

  useEffect(() => {
    isLightRef.current = isLight;
  }, [isLight]);

  // ─────────────────────────────────────────────────────────────
  // 1. Core Scene Lifecycle: MOUNTS ONCE. NEVER DESTROYED ON DETAIL CHANGES.
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const initialLight = isLightRef.current;
    const bgColor = initialLight ? 0xeaf3f7 : 0x071827;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(bgColor, 0.004);

    // 3/4 Elevated Inspection Camera
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.5,
      1200
    );
    cameraRef.current = camera;
    updateCameraPosition();

    // WebGL Renderer with High-Precision Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Natural Maritime Lighting Rig (Key, Fill, Rim, Sounding Grid)
    const lightingRig = createVesselLightingRig(scene, initialLight);
    lightingRigRef.current = lightingRig;

    // Dynamic Root Group for Vessel Assembly
    const rootGroup = new THREE.Group();
    rootGroup.name = 'VesselRootScene';
    scene.add(rootGroup);
    vesselRootRef.current = rootGroup;

    // Waterline Sea Plane (Hydrodynamic surface plane)
    const waterGeo = new THREE.PlaneGeometry(260, 260);
    const waterMat = new THREE.MeshStandardMaterial({
      color: initialLight ? 0x24587a : 0x071e30,
      transparent: true,
      opacity: initialLight ? 0.32 : 0.42,
      roughness: 0.15,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const waterlineMesh = new THREE.Mesh(waterGeo, waterMat);
    waterlineMesh.name = 'WaterlineSeaPlane';
    waterlineMesh.rotation.x = -Math.PI / 2;
    waterlineMesh.position.y = 0;
    scene.add(waterlineMesh);
    waterlineMeshRef.current = waterlineMesh;

    // Smooth Manual Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      sphericalRef.current.theta -= deltaX * 0.0065;
      sphericalRef.current.phi -= deltaY * 0.0065;
      updateCameraPosition();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalRef.current.radius = Math.max(35, Math.min(240, sphericalRef.current.radius + e.deltaY * 0.08));
      updateCameraPosition();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Window / Element Resize Observer
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Natural 60fps Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Continuous rotation when autoRotate is enabled
      if (autoRotateRef.current && !isDragging) {
        sphericalRef.current.theta += 0.0018;
        updateCameraPosition();
      }

      // Propeller assembly rotation tied to commanded transit speed
      if (currentVesselModelRef.current) {
        const prop = currentVesselModelRef.current.getObjectByName('PropellerAssembly');
        if (prop) {
          prop.rotation.z += (speedRef.current / 14.0) * 0.12;
        }
      }

      // Gentle buoyancy swell (only when fully assembled, suspended in exploded view)
      if (rootGroup && explodedProgressRef.current === 0) {
        rootGroup.rotation.z = Math.sin(elapsedTime * 0.5) * 0.006;
      } else if (rootGroup) {
        rootGroup.rotation.z = 0;
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);

      // Clean disposal of scene hierarchy and renderer
      disposeThreeHierarchy(scene);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      vesselRootRef.current = null;
      waterlineMeshRef.current = null;
    };
  }, [updateCameraPosition]);

  // ─────────────────────────────────────────────────────────────
  // 2. Theme Adaptation Effect: Updates colors without tearing down scene
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    const bgColor = isLight ? 0xeaf3f7 : 0x071827;
    if (sceneRef.current.fog) {
      sceneRef.current.fog.color = new THREE.Color(bgColor);
    }
    if (lightingRigRef.current) {
      lightingRigRef.current.updateTheme(isLight);
    }
    if (waterlineMeshRef.current) {
      const mat = waterlineMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.setHex(isLight ? 0x24587a : 0x071e30);
      mat.opacity = isLight ? 0.32 : 0.42;
    }
  }, [isLight]);

  // ─────────────────────────────────────────────────────────────
  // 3. Model Asset Replacement: ONLY triggered when vesselClass changes (Step 8 & 9)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const root = vesselRootRef.current;
    if (!root) return;

    const requestId = ++loadRequestIdRef.current;
    const effectiveDraft = designDraft || draft || 14.5;
    const materials = createVesselMaterials(isLight, visualModeRef.current, activeSubsystemRef.current);

    defaultVesselModelProvider
      .loadModel(
        vesselClass,
        {
          vesselClass,
          lengthOverall,
          beam,
          draft: effectiveDraft,
          explodedProgress: 0,
        },
        materials
      )
      .then((newModel) => {
        // Discard stale response if a newer vesselClass was selected in the meantime
        if (requestId !== loadRequestIdRef.current || !vesselRootRef.current) {
          disposeThreeHierarchy(newModel);
          return;
        }

        // Cleanly remove previous model without flicker
        if (currentVesselModelRef.current) {
          root.remove(currentVesselModelRef.current);
          disposeThreeHierarchy(currentVesselModelRef.current);
        }

        root.add(newModel);
        currentVesselModelRef.current = newModel;
        currentVesselClassRef.current = vesselClass;

        // Immediately apply current exploded, subsystem, and visual mode states
        updateVesselExplodedProgress(newModel, explodedProgressRef.current);
        applyVesselSubsystemHighlight(newModel, activeSubsystemRef.current, visualModeRef.current);
      })
      .catch((err) => {
        console.error('Failed to load commercial vessel 3D model:', err);
      });
  }, [vesselClass, lengthOverall, beam, designDraft, isLight]);

  // ─────────────────────────────────────────────────────────────
  // 4. Exploded View Layer Offset: Ultra-fast in-place group positioning (Step 6)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    explodedProgressRef.current = explodedProgress;
    if (currentVesselModelRef.current) {
      updateVesselExplodedProgress(currentVesselModelRef.current, explodedProgress);
    }
    if (waterlineMeshRef.current) {
      waterlineMeshRef.current.visible = showWaterline && explodedProgress < 0.2;
    }
  }, [explodedProgress, showWaterline]);

  // ─────────────────────────────────────────────────────────────
  // 5. Subsystem Targeting & Visual Mode: In-place mesh opacity/wireframe update (Step 5)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    activeSubsystemRef.current = activeSubsystem;
    visualModeRef.current = visualMode;
    if (currentVesselModelRef.current) {
      applyVesselSubsystemHighlight(currentVesselModelRef.current, activeSubsystem, visualMode);
    }
  }, [activeSubsystem, visualMode]);

  // ─────────────────────────────────────────────────────────────
  // 6. Hydrodynamic Waterline Immersion: Settles or floats vessel according to draft/payload (Steps 2 & 3)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (vesselRootRef.current) {
      const baseDraft = designDraft || 14.5;
      const draftDelta = (draft - baseDraft) * 0.28;
      vesselRootRef.current.position.y = -draftDelta;
    }
  }, [draft, designDraft]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden rounded bg-background-raised border border-border-subtle">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Technical Naval Architecture Inspection HUD & Controls Overlay */}
      <VesselInspectionOverlay
        vesselClass={vesselClass}
        dwt={dwt}
        draft={draft}
        beam={beam}
        lengthOverall={lengthOverall}
        speedKnots={speedKnots}
        activeSubsystem={activeSubsystem}
        onSelectSubsystem={onSelectSubsystem}
        visualMode={visualMode}
        onChangeVisualMode={onChangeVisualMode}
        explodedProgress={explodedProgress}
        onChangeExplodedProgress={onChangeExplodedProgress}
        showWaterline={showWaterline}
        onToggleWaterline={() => setShowWaterline(!showWaterline)}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        onResetCamera={handleResetCamera}
        onSetCameraPreset={handleSetCameraPreset}
      />
    </div>
  );
};
