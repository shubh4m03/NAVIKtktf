import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MARITIME_CURVE } from './Route';

/**
 * Camera Controller for Cinematic Opening Scene
 * 
 * Flow:
 * 1. Starts almost top-down high above the dark ocean to establish: SHIP + OCEAN + MOVEMENT
 * 2. Very slowly pulls backward and slightly pitches upward as the vessel advances
 * 3. Does NOT reveal Earth at this stage
 */
export const CameraController = ({ progress = 0 }) => {
  const { camera } = useThree();
  const targetLookAt = useRef(new THREE.Vector3(1.0, 0, -4.0));

  useFrame((state, delta) => {
    // Vessel's current coordinate on the maritime curve
    const shipPos = MARITIME_CURVE.getPoint(Math.min(1.0, Math.max(0.0, progress)));

    // 1. Calculate camera position interpolation:
    // Start: High top-down (y: 8.5, z: shipPos.z + 0.6)
    // End: Slightly pulled back & tilted (y: 6.8, z: shipPos.z + 3.8)
    const t = Math.min(1.0, Math.max(0.0, progress));

    const startY = 8.5;
    const endY = 6.8;
    const currentY = startY + (endY - startY) * t;

    const startZOffset = 0.6;
    const endZOffset = 3.6;
    const currentZOffset = startZOffset + (endZOffset - startZOffset) * t;

    // Camera smoothly tracks slightly behind and above the vessel
    const targetCameraPos = new THREE.Vector3(
      shipPos.x * 0.4,
      currentY,
      shipPos.z + currentZOffset
    );

    camera.position.lerp(targetCameraPos, delta * 3.5);

    // 2. Smoothly track focal target (ship + slight lookahead)
    const targetFocal = new THREE.Vector3(shipPos.x, 0, shipPos.z + 0.4);
    targetLookAt.current.lerp(targetFocal, delta * 4.0);
    camera.lookAt(targetLookAt.current);
  });

  return null;
};
