import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Photorealistic Commercial Dry Bulk Carrier Model (Supramax / Panamax Class)
 * 
 * Modeled to authentic commercial shipping architectural proportions:
 * - Flared bow with bulbous stem line and forecastle
 * - 5 bulk cargo holds with raised coamings, hatch covers, and access coamings
 * - 4 electro-hydraulic deck cargo cranes with operator cabs & truss jibs
 * - Longitudinal deck pipelines, central walkway, mooring winches & bitts
 * - Multi-tier accommodation bridge with bridge wings, tinted glazing & radar mast
 * - Weathered marine steel PBR materials: dark charcoal topsides & red oxide draft
 */
export const PhotorealisticBulkCarrier = ({ scale = 0.085 }) => {
  // PBR Materials calibrated for real-world maritime photography
  const materials = useMemo(() => {
    return {
      // 1. Dark charcoal/navy painted steel topsides (high roughness, low metalness)
      hullSteel: new THREE.MeshStandardMaterial({
        color: '#131822',
        roughness: 0.82,
        metalness: 0.12,
        flatShading: false
      }),
      // 2. Red oxide antifouling waterline boot-topping (submerged hull)
      hullDraft: new THREE.MeshStandardMaterial({
        color: '#441419',
        roughness: 0.88,
        metalness: 0.05,
        flatShading: false
      }),
      // 3. Weathered dark slate steel deck surface
      deckSteel: new THREE.MeshStandardMaterial({
        color: '#1e2430',
        roughness: 0.85,
        metalness: 0.1
      }),
      // 4. Cargo hold steel hatch covers (weathered green/slate marine enamel)
      hatchCovers: new THREE.MeshStandardMaterial({
        color: '#283342',
        roughness: 0.78,
        metalness: 0.18
      }),
      // 5. Cargo hold raised coamings
      coamings: new THREE.MeshStandardMaterial({
        color: '#181f2b',
        roughness: 0.85,
        metalness: 0.1
      }),
      // 6. Deck cranes & equipment (matte maritime safety yellow)
      craneYellow: new THREE.MeshStandardMaterial({
        color: '#d97706',
        roughness: 0.65,
        metalness: 0.15
      }),
      // 7. Crane pedestals & winches (industrial grey)
      machineryGrey: new THREE.MeshStandardMaterial({
        color: '#64748b',
        roughness: 0.7,
        metalness: 0.25
      }),
      // 8. Multi-tier accommodation superstructure (clean matte marine white)
      superstructureWhite: new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        roughness: 0.55,
        metalness: 0.08
      }),
      // 9. Navigation bridge tinted glazing (deep dark reflective glass)
      bridgeGlass: new THREE.MeshStandardMaterial({
        color: '#082035',
        roughness: 0.12,
        metalness: 0.85
      }),
      // 10. Funnel red livery
      funnelRed: new THREE.MeshStandardMaterial({
        color: '#991b1b',
        roughness: 0.65,
        metalness: 0.1
      }),
      // 11. Masts & rigging (galvanized steel)
      mastsSteel: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.45,
        metalness: 0.4
      })
    };
  }, []);

  return (
    <group scale={scale} name="PhotorealisticBulkCarrier">
      {/* ------------------------------------------------------------- */}
      {/* 1. MAIN HULL STRUCTURE                                        */}
      {/* ------------------------------------------------------------- */}
      {/* Topsides Main Midbody Hull */}
      <mesh position={[0, 0.045, 0.02]} material={materials.hullSteel} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.135, 1.74]} />
      </mesh>

      {/* Red Oxide Antifouling Submerged Draft (at waterline y = 0) */}
      <mesh position={[0, -0.038, 0.02]} material={materials.hullDraft} receiveShadow>
        <boxGeometry args={[0.32, 0.055, 1.70]} />
      </mesh>

      {/* Main Cargo Deck Floor Plate */}
      <mesh position={[0, 0.114, 0.02]} material={materials.deckSteel} receiveShadow>
        <boxGeometry args={[0.33, 0.005, 1.72]} />
      </mesh>

      {/* Tapered Bow Section & Raked Stem */}
      <group position={[0, 0.045, 0.94]}>
        <mesh rotation={[0, Math.PI, 0]} material={materials.hullSteel} castShadow>
          <cylinderGeometry args={[0.02, 0.17, 0.14, 4]} />
        </mesh>
        {/* Forecastle Raised Deck Plate */}
        <mesh position={[0, 0.075, 0.04]} material={materials.deckSteel} castShadow>
          <boxGeometry args={[0.26, 0.02, 0.14]} />
        </mesh>
        {/* Forward Mooring Windlass & Anchor Chains */}
        <mesh position={[0, 0.09, 0.03]} material={materials.machineryGrey} castShadow>
          <boxGeometry args={[0.12, 0.018, 0.06]} />
        </mesh>
        {/* Forecastle Jackstaff Mast */}
        <mesh position={[0, 0.16, 0.08]} material={materials.mastsSteel} castShadow>
          <cylinderGeometry args={[0.003, 0.005, 0.14, 6]} />
        </mesh>
      </group>

      {/* Rounded Transom Stern Section */}
      <group position={[0, 0.045, -0.87]}>
        <mesh material={materials.hullSteel} castShadow>
          <cylinderGeometry args={[0.16, 0.14, 0.135, 12]} />
        </mesh>
        {/* Aft Mooring Deck Winches */}
        <mesh position={[0, 0.075, -0.02]} material={materials.machineryGrey} castShadow>
          <boxGeometry args={[0.14, 0.02, 0.06]} />
        </mesh>
      </group>

      {/* ------------------------------------------------------------- */}
      {/* 2. 5 CARGO HOLDS & STEEL HATCH COVERS                         */}
      {/* ------------------------------------------------------------- */}
      {[-0.48, -0.24, 0.0, 0.24, 0.48].map((zPos, idx) => (
        <group key={idx} position={[0, 0.116, zPos]}>
          {/* Raised Hatch Coaming Frame */}
          <mesh position={[0, 0.015, 0]} material={materials.coamings} castShadow>
            <boxGeometry args={[0.26, 0.026, 0.16]} />
          </mesh>
          {/* Hydraulic Steel Hatch Cover (2-Panel Folding Design) */}
          <mesh position={[0, 0.03, 0]} material={materials.hatchCovers} castShadow>
            <boxGeometry args={[0.244, 0.014, 0.146]} />
          </mesh>
          {/* Center Seam Cleat */}
          <mesh position={[0, 0.038, 0]} material={materials.machineryGrey}>
            <boxGeometry args={[0.246, 0.004, 0.008]} />
          </mesh>
        </group>
      ))}

      {/* ------------------------------------------------------------- */}
      {/* 3. 4 ELECTRO-HYDRAULIC DECK CARGO CRANES                      */}
      {/* ------------------------------------------------------------- */}
      {[-0.36, -0.12, 0.12, 0.36].map((zPos, idx) => (
        <group key={idx} position={[0, 0.12, zPos]}>
          {/* Cylindrical Crane Housing Pedestal */}
          <mesh position={[0, 0.035, 0]} material={materials.craneYellow} castShadow>
            <cylinderGeometry args={[0.022, 0.025, 0.07, 10]} />
          </mesh>
          {/* Operator's Cab (Port side offset) */}
          <mesh position={[-0.018, 0.055, 0.01]} material={materials.machineryGrey} castShadow>
            <boxGeometry args={[0.014, 0.02, 0.018]} />
          </mesh>
          {/* Articulated Crane Jib Boom (Angled forward over cargo hold) */}
          <mesh position={[0, 0.088, 0.055]} rotation={[-0.48, 0, 0]} material={materials.craneYellow} castShadow>
            <boxGeometry args={[0.012, 0.012, 0.13]} />
          </mesh>
          {/* Hoist Wire Sheave Head */}
          <mesh position={[0, 0.115, 0.105]} material={materials.machineryGrey}>
            <sphereGeometry args={[0.006, 6, 6]} />
          </mesh>
        </group>
      ))}

      {/* ------------------------------------------------------------- */}
      {/* 4. CENTRAL CATWALK & PIPELINES                                */}
      {/* ------------------------------------------------------------- */}
      {/* Longitudinal Center Walkway */}
      <mesh position={[0.138, 0.12, 0.02]} material={materials.deckSteel}>
        <boxGeometry args={[0.018, 0.008, 1.4]} />
      </mesh>
      {/* Longitudinal Bunkering / Ballast Pipe Lines */}
      <mesh position={[-0.138, 0.122, 0.02]} material={materials.machineryGrey}>
        <cylinderGeometry args={[0.004, 0.004, 1.4, 6]} rotation={[Math.PI / 2, 0, 0]} />
      </mesh>

      {/* ------------------------------------------------------------- */}
      {/* 5. AFT ACCOMMODATION SUPERSTRUCTURE & WHEELHOUSE BRIDGE       */}
      {/* ------------------------------------------------------------- */}
      <group position={[0, 0.12, -0.66]}>
        {/* Tier 1 Poop Deckhouse */}
        <mesh position={[0, 0.04, 0]} material={materials.superstructureWhite} castShadow>
          <boxGeometry args={[0.28, 0.08, 0.24]} />
        </mesh>
        {/* Tier 2 Crew Quarters Deckhouse */}
        <mesh position={[0, 0.10, 0]} material={materials.superstructureWhite} castShadow>
          <boxGeometry args={[0.26, 0.06, 0.22]} />
        </mesh>
        {/* Tier 3 Wheelhouse Navigation Bridge */}
        <mesh position={[0, 0.155, 0.01]} material={materials.superstructureWhite} castShadow>
          <boxGeometry args={[0.25, 0.05, 0.18]} />
        </mesh>
        {/* Navigation Bridge Tinted Panoramic Window Band */}
        <mesh position={[0, 0.165, 0.102]} material={materials.bridgeGlass}>
          <boxGeometry args={[0.235, 0.022, 0.006]} />
        </mesh>
        {/* Port & Starboard Flying Bridge Wings */}
        <mesh position={[0, 0.155, 0.03]} material={materials.superstructureWhite} castShadow>
          <boxGeometry args={[0.33, 0.012, 0.04]} />
        </mesh>

        {/* Engine Exhaust Funnel (Stepped Marine Profile with Livery) */}
        <group position={[0, 0.18, -0.06]}>
          <mesh material={materials.funnelRed} castShadow>
            <cylinderGeometry args={[0.022, 0.026, 0.09, 12]} />
          </mesh>
          {/* Black Funnel Top Cap */}
          <mesh position={[0, 0.05, 0]} material={materials.hullSteel}>
            <cylinderGeometry args={[0.022, 0.022, 0.015, 12]} />
          </mesh>
        </group>

        {/* Main Radar Mast & Navigation Equipment */}
        <group position={[0, 0.21, 0.03]}>
          {/* Main Lattice Radar Mast */}
          <mesh position={[0, 0.05, 0]} material={materials.mastsSteel} castShadow>
            <cylinderGeometry args={[0.003, 0.006, 0.10, 6]} />
          </mesh>
          {/* X-Band Rotating Radar Scanner */}
          <mesh position={[0, 0.095, 0.01]} material={materials.machineryGrey}>
            <boxGeometry args={[0.045, 0.004, 0.008]} />
          </mesh>
          {/* S-Band Radar Scanner */}
          <mesh position={[0, 0.075, -0.01]} material={materials.machineryGrey}>
            <boxGeometry args={[0.035, 0.004, 0.008]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
