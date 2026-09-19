import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Global Dry Bulk Maritime Shipping Corridors
 * Lat/Lon coordinate pairs for realistic international maritime logistics
 */
const MARITIME_CORRIDORS = [
  // Dampier/Port Hedland (Australia) -> Qingdao (China) [Major Iron Ore Route]
  { from: { lat: -20.31, lon: 118.58 }, to: { lat: 36.06, lon: 120.38 }, color: '#00d4ff', label: 'C3 Iron Ore Corridor' },
  // Tubarao (Brazil) -> Rotterdam (Europe) [Iron Ore & Agricultural]
  { from: { lat: -20.28, lon: -40.24 }, to: { lat: 51.92, lon: 4.48 }, color: '#38bdf8', label: 'Trans-Atlantic Bulk' },
  // Tubarao (Brazil) -> Qingdao (China) via Cape of Good Hope [C3 Route]
  { from: { lat: -20.28, lon: -40.24 }, to: { lat: -34.35, lon: 18.47 }, color: '#00d4ff' },
  { from: { lat: -34.35, lon: 18.47 }, to: { lat: 1.35, lon: 103.82 }, color: '#00d4ff' },
  { from: { lat: 1.35, lon: 103.82 }, to: { lat: 36.06, lon: 120.38 }, color: '#00d4ff' },
  // Richards Bay (South Africa) -> Mundra (India) [Coal Corridor]
  { from: { lat: -28.78, lon: 32.04 }, to: { lat: 22.84, lon: 69.70 }, color: '#f59e0b', label: 'Indo-African Coal' },
  // Newcastle (Australia) -> Tokyo (Japan) [Thermal Coal & Minerals]
  { from: { lat: -32.93, lon: 151.78 }, to: { lat: 35.68, lon: 139.69 }, color: '#38bdf8' },
  // US Gulf / New Orleans -> Suez Canal -> Shanghai [Grain & Fertilizer Arterial]
  { from: { lat: 29.95, lon: -90.07 }, to: { lat: 36.14, lon: -5.35 }, color: '#10b981' }, // US Gulf -> Gibraltar
  { from: { lat: 36.14, lon: -5.35 }, to: { lat: 31.26, lon: 32.30 }, color: '#10b981' }, // Gibraltar -> Suez
  { from: { lat: 31.26, lon: 32.30 }, to: { lat: 1.35, lon: 103.82 }, color: '#10b981' }, // Suez -> Singapore
  // Trans-Pacific Bulk (Vancouver / US West Coast -> Tokyo / Shanghai)
  { from: { lat: 49.28, lon: -123.12 }, to: { lat: 35.68, lon: 139.69 }, color: '#00d4ff', label: 'Trans-Pacific Grain' },
  // Panama Canal Inter-Oceanic Link
  { from: { lat: 8.98, lon: -79.52 }, to: { lat: 29.95, lon: -90.07 }, color: '#f59e0b' },
  { from: { lat: 8.98, lon: -79.52 }, to: { lat: -12.04, lon: -77.04 }, color: '#f59e0b' } // Panama -> Peru/Chile
];

// Convert Lat/Lon to 3D Sphere coordinates
function latLonToVector3(lat, lon, radius = 2.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

// Generate elevated geodesic 3D bezier curve over the sphere
function createGeodesicCurve(p1, p2, globeRadius = 2.0) {
  const distance = p1.distanceTo(p2);
  const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  
  // Elevate mid-point slightly above globe surface based on distance
  const elevation = globeRadius + Math.min(distance * 0.28, 0.45);
  midPoint.normalize().multiplyScalar(elevation);

  return new THREE.QuadraticBezierCurve3(p1, midPoint, p2);
}

/**
 * Global Trade Routes Network Component
 */
export const GlobalTradeRoutes = ({ globeRadius = 2.0, opacity = 1.0 }) => {
  const particlesRef = useRef();

  // Generate curve geometries and animated particle data
  const { lines, particles } = useMemo(() => {
    const lineGeometries = [];
    const particlePositions = [];
    const particleColors = [];

    MARITIME_CORRIDORS.forEach((corridor, idx) => {
      const vFrom = latLonToVector3(corridor.from.lat, corridor.from.lon, globeRadius + 0.015);
      const vTo = latLonToVector3(corridor.to.lat, corridor.to.lon, globeRadius + 0.015);
      
      const curve = createGeodesicCurve(vFrom, vTo, globeRadius);
      const points = curve.getPoints(50);
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      lineGeometries.push({ geometry, color: corridor.color });

      // Add animated pulse particle tracking along each curve
      for (let p = 0; p < 2; p++) {
        particlePositions.push({
          curve,
          t: (p * 0.5 + idx * 0.1) % 1.0,
          speed: 0.0025 + (idx % 3) * 0.001
        });
        const col = new THREE.Color(corridor.color);
        particleColors.push(col.r, col.g, col.b);
      }
    });

    return { lines: lineGeometries, particles: particlePositions };
  }, [globeRadius]);

  // Particle positions buffer
  const particleGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const posArray = new Float32Array(particles.length * 3);
    geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    return geom;
  }, [particles]);

  // Animate trade pulses along curves
  useFrame(() => {
    if (particlesRef.current && opacity > 0.01) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      particles.forEach((item, i) => {
        item.t = (item.t + item.speed) % 1.0;
        const pt = item.curve.getPoint(item.t);
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y;
        positions[i * 3 + 2] = pt.z;
      });
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group name="GlobalTradeRoutes" visible={opacity > 0.01}>
      {/* Route lines */}
      {lines.map((item, idx) => (
        <line key={idx} geometry={item.geometry}>
          <lineBasicMaterial 
            color={item.color} 
            transparent 
            opacity={0.55 * opacity} 
            linewidth={1.5}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}

      {/* Moving Trade Vessel & Cargo Data Pulses */}
      <points ref={particlesRef} geometry={particleGeom}>
        <pointsMaterial
          size={0.06}
          color="#00d4ff"
          transparent
          opacity={0.9 * opacity}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
