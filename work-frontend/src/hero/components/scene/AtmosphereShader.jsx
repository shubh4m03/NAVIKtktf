import React, { useMemo } from 'react';
import * as THREE from 'three';

const AtmosphereVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const AtmosphereFragmentShader = `
uniform vec3 uColor;
uniform vec3 uSunPosition;
uniform float uPower;
uniform float uMultiplier;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // View direction in view space
  vec3 viewDirection = normalize(-vPosition);
  
  // Rayleigh Fresnel Rim calculation
  float fresnel = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
  fresnel = pow(fresnel, uPower);

  // Sun orientation factor
  vec3 sunDir = normalize(uSunPosition);
  float sunFactor = max(0.0, dot(normalize(vPosition), sunDir) * 0.5 + 0.5);

  vec3 finalColor = uColor * fresnel * uMultiplier * sunFactor;
  float alpha = fresnel * (0.8 + 0.2 * sunFactor);

  gl_FragColor = vec4(finalColor, alpha);
}
`;

/**
 * Realistic Rayleigh Atmospheric Scattering Halo
 */
export const AtmosphereShader = ({ 
  radius = 2.05, 
  color = '#4ea8de', 
  power = 3.5, 
  multiplier = 2.0,
  sunPosition = [12, 10, 8]
}) => {
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uSunPosition: { value: new THREE.Vector3(...sunPosition) },
    uPower: { value: power },
    uMultiplier: { value: multiplier }
  }), [color, power, multiplier, sunPosition]);

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        vertexShader={AtmosphereVertexShader}
        fragmentShader={AtmosphereFragmentShader}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};
