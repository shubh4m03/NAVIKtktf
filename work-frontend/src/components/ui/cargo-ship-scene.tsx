import React, { Suspense, useLayoutEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, Center, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function ShipModel() {
  const { scene } = useGLTF('/models/cargo-ship.glb');
  const groupRef = useRef<THREE.Group>(null);
  
  useLayoutEffect(() => {
    // Enhance materials for a professional terminal look
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          
          materials.forEach(mat => {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
              mat.roughness = 0.25;
              mat.metalness = 0.85;
              mat.envMapIntensity = 1.5;
              mat.needsUpdate = true;
            }
          });
        }
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef} rotation={[0, -Math.PI / 4, 0]} scale={0.09}>
      <Center position={[0, 0, 0]}>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

useGLTF.preload('/models/cargo-ship.glb');

export function CargoShipScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [8, 4, 8], fov: 40 }} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          {/* Cyan/Teal Brand Primary */}
          <directionalLight position={[10, 10, 5]} intensity={1.2} color="#3DAFA0" />
          {/* Red Danger / Secondary Accent */}
          <directionalLight position={[-10, 5, -5]} intensity={0.4} color="#E5484D" />
          
          <ShipModel />
          
          <Environment preset="night" />
          <ContactShadows position={[0, -1.2, 0]} opacity={0.5} blur={2} />
          
          <OrbitControls 
            autoRotate 
            autoRotateSpeed={0.8} 
            enableZoom={false} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2.1} 
            minPolarAngle={Math.PI / 3} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
