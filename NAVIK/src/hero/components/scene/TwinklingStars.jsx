import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Photorealistic Twinkling Star Field Component
 * 
 * Features:
 * - Single GPU-accelerated Points draw call (2,200 stars)
 * - Distributed in a distant background shell (radius 55 to 150) so stars never penetrate Earth
 * - Realistic stellar magnitude distribution (mostly faint stars, subtle variation)
 * - Authentic stellar colors (crisp white, soft ivory, pale celestial blue)
 * - Asynchronous, non-repeating smooth twinkling per star via vertex shader harmonics
 * - Depth testing ensures Earth naturally occludes all background stars
 */
export const TwinklingStars = ({ count = 2200, innerRadius = 55, outerRadius = 150 }) => {
  const pointsRef = useRef();
  const materialRef = useRef();

  // Generate star attributes once
  const { positions, baseBrightness, twinkleSpeeds, phases, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const bright = new Float32Array(count);
    const speeds = new Float32Array(count);
    const ph = new Float32Array(count);
    const col = new Float32Array(count * 3);

    // Realistic subtle stellar color palettes (primarily white/soft tint)
    const colorPalette = [
      new THREE.Color('#ffffff'), // Pure white
      new THREE.Color('#f8fafc'), // Crisp stellar white
      new THREE.Color('#f1f5f9'), // Cool white
      new THREE.Color('#e2e8f0'), // Soft white
      new THREE.Color('#fef3c7'), // Faint warm ivory
      new THREE.Color('#e0f2fe')  // Faint pale cyan/blue
    ];

    for (let i = 0; i < count; i++) {
      // Uniform spherical shell distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = innerRadius + Math.pow(Math.random(), 0.7) * (outerRadius - innerRadius);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Magnitude distribution: many faint stars, fewer bright stars
      const magRandom = Math.random();
      bright[i] = Math.pow(magRandom, 1.8) * 0.65 + 0.22;

      // Twinkle speed: slow, non-uniform frequencies (0.35 to 1.6 rad/s)
      speeds[i] = 0.35 + Math.random() * 1.25;

      // Randomized phase offset (0 to 2*PI) for completely asynchronous twinkling
      ph[i] = Math.random() * Math.PI * 2.0;

      // Pick subtle stellar tint
      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    return {
      positions: pos,
      baseBrightness: bright,
      twinkleSpeeds: speeds,
      phases: ph,
      colors: col
    };
  }, [count, innerRadius, outerRadius]);

  // Custom Twinkling Star Shader
  const starShader = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        attribute float aBaseBrightness;
        attribute float aTwinkleSpeed;
        attribute float aPhase;
        attribute vec3 aColor;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Asynchronous smooth harmonic twinkling
          float t1 = sin(uTime * aTwinkleSpeed + aPhase) * 0.28;
          float t2 = sin(uTime * (aTwinkleSpeed * 1.618) + aPhase * 2.4) * 0.12;
          float brightness = clamp(aBaseBrightness + t1 + t2, 0.10, 0.95);

          vColor = aColor * (0.85 + brightness * 0.3);
          vAlpha = brightness;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Perspective point size attenuation
          float pSize = (1.2 + aBaseBrightness * 1.3) * (200.0 / -mvPosition.z);
          gl_PointSize = clamp(pSize, 1.0, 3.2);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Circular anti-aliased point disc
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;

          // Soft radial falloff for natural star point glow
          float intensity = smoothstep(0.5, 0.08, dist);
          gl_FragColor = vec4(vColor, vAlpha * intensity);
        }
      `
    };
  }, []);

  // Update time uniform every frame (ultra-lightweight, 0 garbage collection)
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points ref={pointsRef} name="PhotorealisticTwinklingStars">
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aBaseBrightness"
          count={baseBrightness.length}
          array={baseBrightness}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aTwinkleSpeed"
          count={twinkleSpeeds.length}
          array={twinkleSpeeds}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={phases.length}
          array={phases}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[starShader]}
        transparent
        depthTest={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
