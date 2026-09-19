import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getMaritimeGlobeCurve, GLOBE_RADIUS } from '../../utils/globeCoordinates';

/**
 * Continuous Cinematic Camera Controller
 * 
 * Calibrated Opening Aerial Shot & Orbital Transition:
 * 1. 0.0s–1.0s (t: 0.00 -> 0.12): Dark open ocean establishing shot
 * 2. 1.0s–3.5s (t: 0.12 -> 0.44): High-angle aerial cinematic view of cargo vessel (distinguishable bow, hull, holds, cranes, bridge)
 * 3. 3.0s–4.2s (t: 0.38 -> 0.52): Subtle navigation route line emerges behind vessel
 * 4. 4.2s–6.2s (t: 0.52 -> 0.76): Smooth exponential pullback & Earth curvature reveal
 * 5. 6.2s–7.4s (t: 0.76 -> 0.90): Orbital Earth framing with Global Maritime Network
 * 6. 7.4s–8.2s (t: 0.90 -> 1.00): NAVIC Brand Reveal
 */
export const ContinuousCameraController = ({ progress = 0, planetGroupRef }) => {
  const { camera, size } = useThree();
  const curve = useMemo(() => getMaritimeGlobeCurve(GLOBE_RADIUS, 0), []);
  const currentLookAt = useRef(new THREE.Vector3(0, GLOBE_RADIUS, 0));

  useFrame((state, delta) => {
    const t = Math.min(1.0, Math.max(0.0, progress));
    const aspect = size.width / size.height;
    const isMobile = aspect < 1.0;

    // Vessel progression on the route
    const vesselT = Math.min(1.0, Math.max(0.0, (t - 0.08) / 0.82));

    // Calculate local coordinates on the globe
    const localShipPos = curve.getPoint(vesselT);
    const localLookAhead = curve.getPoint(Math.min(1.0, vesselT + 0.025));

    // Transform local coordinates by the spinning planet's world matrix
    if (planetGroupRef?.current) {
      planetGroupRef.current.updateWorldMatrix(true, false);
    }
    const worldMatrix = planetGroupRef?.current ? planetGroupRef.current.matrixWorld : new THREE.Matrix4();

    const worldShipPos = localShipPos.clone().applyMatrix4(worldMatrix);
    const worldLookAhead = localLookAhead.clone().applyMatrix4(worldMatrix);
    const worldPlanetCenter = new THREE.Vector3(0, 0, 0).applyMatrix4(worldMatrix);

    const worldNormal = worldShipPos.clone().sub(worldPlanetCenter).normalize();
    const worldTangent = worldLookAhead.clone().sub(worldShipPos).normalize();

    // 1. Continuous Altitude with S-Curve Easing
    let altitude;
    if (t < 0.46) {
      // Close aerial view: altitude h = 0.36 to 0.52 (clear structural readability of ship)
      const localT = t / 0.46;
      altitude = 0.36 + Math.pow(localT, 1.2) * 0.18;
    } else {
      // Exponential pullback into deep space
      const transT = (t - 0.46) / 0.54;
      const easedT = THREE.MathUtils.smoothstep(transT, 0.0, 1.0);
      const targetMaxAlt = isMobile ? 12.0 : 10.2;
      altitude = 0.54 + Math.pow(easedT, 1.6) * targetMaxAlt;
    }

    // 2. Camera Orientation
    // High-angle aerial cinematic position (pitched forward to reveal ship geometry clearly)
    const startCamOffset = worldNormal.clone().multiplyScalar(altitude)
      .add(worldTangent.clone().multiplyScalar(-0.16));
    const startCamPos = worldShipPos.clone().add(startCamOffset);
    const startFocal = worldShipPos.clone().add(worldTangent.clone().multiplyScalar(0.08));

    // 3. Subtle Majestic High-Altitude Satellite Orbital Motion (NASA Documentary Feel)
    const time = state.clock.getElapsedTime();
    const orbitalDistance = GLOBE_RADIUS + altitude + (isMobile ? 2.2 : 0.0);
    
    // Very subtle orbital satellite drift (0.012 rad/s - slow and majestic)
    const orbitAngle = time * 0.012;
    const driftX = Math.sin(orbitAngle) * (orbitalDistance * 0.12);
    const driftY = (isMobile ? 0.2 : 0.0) + Math.cos(time * 0.016) * 0.05;
    const driftZ = Math.cos(orbitAngle * 0.5) * orbitalDistance;

    const orbitalCamPos = new THREE.Vector3(driftX, driftY, driftZ);
    const orbitalFocal = new THREE.Vector3(0, 0, 0);

    // Smooth continuous transition from ship framing into global orbital view
    const transProgress = THREE.MathUtils.smoothstep(Math.max(0.0, (t - 0.44) / 0.56), 0.0, 1.0);
    const targetCamPos = new THREE.Vector3().lerpVectors(startCamPos, orbitalCamPos, transProgress);
    const targetFocal = new THREE.Vector3().lerpVectors(startFocal, orbitalFocal, transProgress);

    // Smooth camera damping for jitter-free cinematic motion
    camera.position.lerp(targetCamPos, delta * 4.2);
    currentLookAt.current.lerp(targetFocal, delta * 4.2);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
