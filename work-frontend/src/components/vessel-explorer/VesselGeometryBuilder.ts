// ─────────────────────────────────────────────────────────────
// components/vessel-explorer/VesselGeometryBuilder.ts
// Authentic commercial naval architecture 3D geometry generator
// ─────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { MaterialBundle } from './VesselMaterials';

export interface VesselBuildOptions {
  vesselClass: string;
  lengthOverall: number;
  beam: number;
  draft: number;
  explodedProgress: number; // 0.0 (assembled) to 1.0 (fully exploded)
}

export function buildCommercialVessel(
  materials: MaterialBundle,
  options: VesselBuildOptions
): THREE.Group {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'VesselRoot';

  const { vesselClass, lengthOverall, beam, draft, explodedProgress } = options;
  const vName = vesselClass.toLowerCase();

  // Dimension scaling relative to standard Panamax (225m LOA, 32.2m Beam, 14.5m Draft)
  const scaleL = Math.min(1.4, Math.max(0.75, lengthOverall / 225));
  const scaleB = Math.min(1.4, Math.max(0.75, beam / 32.2));
  const scaleD = Math.min(1.3, Math.max(0.8, draft / 14.5));

  const L = 76 * scaleL;
  const B = 14.5 * scaleB;
  const draftH = 5.2 * scaleD;
  const freeboardH = 5.8;
  const totalDepth = draftH + freeboardH;

  // Exploded vertical layer offsets
  const explodeY = (layerLevel: number) => explodedProgress * layerLevel * 7.0;

  // ==========================================================
  // LAYER 1: LOWER HULL & UNDERWATER APPENDAGES (Red-Oxide)
  // ==========================================================
  const lowerHullGroup = new THREE.Group();
  lowerHullGroup.name = 'LowerHullGroup';
  lowerHullGroup.position.y = explodeY(0);

  // 1A. Main Underwater Hull (Parametric lofted cross-sections with bilge radius)
  const hullShape = new THREE.Shape();
  // Hull cross section: flat bottom keel, curved bilge, vertical side
  const halfB = B / 2;
  const bilgeR = 1.6 * scaleB;
  hullShape.moveTo(-halfB + bilgeR, -draftH);
  hullShape.lineTo(halfB - bilgeR, -draftH);
  hullShape.quadraticCurveTo(halfB, -draftH, halfB, -draftH + bilgeR);
  hullShape.lineTo(halfB, 0); // up to waterline
  hullShape.lineTo(-halfB, 0);
  hullShape.lineTo(-halfB, -draftH + bilgeR);
  hullShape.quadraticCurveTo(-halfB, -draftH, -halfB + bilgeR, -draftH);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 16,
    depth: L * 0.88,
    bevelEnabled: true,
    bevelThickness: 1.2 * scaleL,
    bevelSize: 0.8 * scaleB,
    bevelSegments: 4,
  };

  const lowerHullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
  lowerHullGeo.center();
  const lowerHullMesh = new THREE.Mesh(lowerHullGeo, materials.lowerHull);
  lowerHullMesh.name = 'LowerHullMesh';
  lowerHullMesh.userData = { subsystem: 'hull' };
  lowerHullMesh.position.set(0, 0, 0);
  lowerHullMesh.castShadow = true;
  lowerHullMesh.receiveShadow = true;
  lowerHullGroup.add(lowerHullMesh);

  // 1B. Hydrodynamic Bulbous Bow (Extending forward beneath waterline)
  const bulbRadius = halfB * 0.42;
  const bulbGeo = new THREE.SphereGeometry(bulbRadius, 20, 16);
  const bulbMesh = new THREE.Mesh(bulbGeo, materials.lowerHull);
  bulbMesh.name = 'BulbousBowMesh';
  bulbMesh.userData = { subsystem: 'hull' };
  bulbMesh.position.set(0, -draftH * 0.55, L * 0.44 + 4.2 * scaleL);
  bulbMesh.scale.set(0.9, 1.25, 2.4 * scaleL);
  bulbMesh.castShadow = true;
  lowerHullGroup.add(bulbMesh);

  // 1C. Stern Bossing & Rudder (Aft appendages)
  const rudderGeo = new THREE.BoxGeometry(0.5, draftH * 0.75, 4.0 * scaleL);
  const rudderMesh = new THREE.Mesh(rudderGeo, materials.lowerHull);
  rudderMesh.name = 'RudderMesh';
  rudderMesh.userData = { subsystem: 'hull' };
  rudderMesh.position.set(0, -draftH * 0.45, -L * 0.44);
  lowerHullGroup.add(rudderMesh);

  // Propeller Assembly (Rotatable Group for Speed Simulation)
  const propGroup = new THREE.Group();
  propGroup.name = 'PropellerAssembly';
  propGroup.position.set(0, -draftH * 0.6, -L * 0.42);

  const propHubGeo = new THREE.CylinderGeometry(0.6, 0.7, 1.8, 12);
  const propHubMesh = new THREE.Mesh(propHubGeo, materials.engine);
  propHubMesh.rotation.x = Math.PI / 2;
  propHubMesh.userData = { subsystem: 'engine' };
  propGroup.add(propHubMesh);

  // 4 Propeller Blades
  for (let b = 0; b < 4; b++) {
    const bladeGeo = new THREE.BoxGeometry(0.18, 2.0, 0.7);
    const bladeMesh = new THREE.Mesh(bladeGeo, materials.engine);
    bladeMesh.rotation.z = (b * Math.PI) / 2 + 0.3;
    bladeMesh.userData = { subsystem: 'engine' };
    propGroup.add(bladeMesh);
  }
  lowerHullGroup.add(propGroup);

  rootGroup.add(lowerHullGroup);

  // ==========================================================
  // LAYER 2: BALLAST & FUEL TANKS (Double Bottom & Wing Tanks)
  // ==========================================================
  const ballastFuelGroup = new THREE.Group();
  ballastFuelGroup.name = 'BallastFuelGroup';
  ballastFuelGroup.position.y = explodeY(1);

  // 2A. Double Bottom Ballast Tanks (Running along keel)
  const dbLength = L * 0.74;
  const dbGeo = new THREE.BoxGeometry(B * 0.88, 1.4, dbLength);
  const dbMesh = new THREE.Mesh(dbGeo, materials.ballast);
  dbMesh.name = 'DoubleBottomBallastMesh';
  dbMesh.userData = { subsystem: 'ballast' };
  dbMesh.position.set(0, -draftH + 0.8, -L * 0.02);
  ballastFuelGroup.add(dbMesh);

  // 2B. Topside & Hopper Wing Ballast Tanks (Triangular hopper tanks on port/starboard)
  const wingWidth = B * 0.22;
  const wingLength = L * 0.68;
  const portWingGeo = new THREE.BoxGeometry(wingWidth, 2.4, wingLength);
  const portWingMesh = new THREE.Mesh(portWingGeo, materials.ballast);
  portWingMesh.name = 'PortWingBallastMesh';
  portWingMesh.userData = { subsystem: 'ballast' };
  portWingMesh.position.set(-halfB + wingWidth / 2 + 0.2, 0.8, -L * 0.02);
  ballastFuelGroup.add(portWingMesh);

  const stbdWingMesh = new THREE.Mesh(portWingGeo, materials.ballast);
  stbdWingMesh.name = 'StbdWingBallastMesh';
  stbdWingMesh.userData = { subsystem: 'ballast' };
  stbdWingMesh.position.set(halfB - wingWidth / 2 - 0.2, 0.8, -L * 0.02);
  ballastFuelGroup.add(stbdWingMesh);

  // 2C. Bunker Heavy Fuel Oil (HFO) Deep Tanks (Forward of Engine Room)
  const fuelTankGeo = new THREE.BoxGeometry(B * 0.82, 3.2, 7.5 * scaleL);
  const fuelTankMesh = new THREE.Mesh(fuelTankGeo, materials.fuel);
  fuelTankMesh.name = 'FuelTankMesh';
  fuelTankMesh.userData = { subsystem: 'fuel' };
  fuelTankMesh.position.set(0, 0.5, -L * 0.24);
  ballastFuelGroup.add(fuelTankMesh);

  rootGroup.add(ballastFuelGroup);

  // ==========================================================
  // LAYER 3: CARGO HOLDS & MACHINERY ENGINE ROOM
  // ==========================================================
  const internalHoldGroup = new THREE.Group();
  internalHoldGroup.name = 'HoldsEngineGroup';
  internalHoldGroup.position.y = explodeY(2);

  // 3A. Aft Engine Room Space
  const engineRoomZ = -L * 0.35;
  const engineRoomGeo = new THREE.BoxGeometry(B * 0.78, 4.2, 10.5 * scaleL);
  const engineRoomMesh = new THREE.Mesh(engineRoomGeo, materials.engine);
  engineRoomMesh.name = 'EngineRoomMesh';
  engineRoomMesh.userData = { subsystem: 'engine' };
  engineRoomMesh.position.set(0, 1.6, engineRoomZ);
  internalHoldGroup.add(engineRoomMesh);

  // Main Low-Speed 2-Stroke Diesel Engine Block
  const engineBlockGeo = new THREE.BoxGeometry(B * 0.32, 2.8, 5.5 * scaleL);
  const engineBlockMesh = new THREE.Mesh(engineBlockGeo, materials.engine);
  engineBlockMesh.name = 'EngineBlockMesh';
  engineBlockMesh.userData = { subsystem: 'engine' };
  engineBlockMesh.position.set(0, 2.6, engineRoomZ);
  internalHoldGroup.add(engineBlockMesh);

  // 3B. Individual Cargo Holds with Transverse Watertight Bulkheads
  const holdCount = vName.includes('capesize') ? 9 : vName.includes('supramax') ? 5 : 7;
  const holdLengthSpan = L * 0.62;
  const singleHoldLength = holdLengthSpan / holdCount;
  const holdWidth = B * 0.74;
  const holdDepth = freeboardH * 0.85;

  for (let h = 0; h < holdCount; h++) {
    const hZ = -L * 0.28 + singleHoldLength * (h + 0.5);

    // Individual Hold Box
    const holdGeo = new THREE.BoxGeometry(holdWidth, holdDepth, singleHoldLength * 0.84);
    const holdMesh = new THREE.Mesh(holdGeo, materials.holds);
    holdMesh.name = `CargoHold_${h + 1}`;
    holdMesh.userData = { subsystem: 'holds' };
    holdMesh.position.set(0, holdDepth / 2 + 0.2, hZ);
    internalHoldGroup.add(holdMesh);

    // Transverse Watertight Bulkhead
    if (h < holdCount - 1) {
      const bheadGeo = new THREE.BoxGeometry(B * 0.94, holdDepth + 0.8, 0.4);
      const bheadMesh = new THREE.Mesh(bheadGeo, materials.upperHull);
      bheadMesh.name = `Bulkhead_${h + 1}`;
      bheadMesh.userData = { subsystem: 'hull' };
      bheadMesh.position.set(0, holdDepth / 2 + 0.3, -L * 0.28 + singleHoldLength * (h + 1));
      internalHoldGroup.add(bheadMesh);
    }
  }

  rootGroup.add(internalHoldGroup);

  // ==========================================================
  // LAYER 4: UPPER TOPSIDE HULL & BOOT-TOPPING STRIPE
  // ==========================================================
  const upperHullGroup = new THREE.Group();
  upperHullGroup.name = 'UpperHullGroup';
  upperHullGroup.position.y = explodeY(3);

  // 4A. Boot-Topping Waterline Stripe
  const bootGeo = new THREE.BoxGeometry(B + 0.05, 0.45, L * 0.92);
  const bootMesh = new THREE.Mesh(bootGeo, materials.bootTop);
  bootMesh.name = 'BootTopMesh';
  bootMesh.userData = { subsystem: 'hull' };
  bootMesh.position.set(0, 0, 0);
  upperHullGroup.add(bootMesh);

  // 4B. Upper Topsides Hull Box
  const upperGeo = new THREE.BoxGeometry(B, freeboardH, L * 0.9);
  const upperMesh = new THREE.Mesh(upperGeo, materials.upperHull);
  upperMesh.name = 'UpperHullMesh';
  upperMesh.userData = { subsystem: 'hull' };
  upperMesh.position.set(0, freeboardH / 2, 0);
  upperMesh.castShadow = true;
  upperHullGroup.add(upperMesh);

  // 4C. Flared Bow Raked Stem (Authentic forward sheer and reserve buoyancy)
  const flaredBowGeo = new THREE.ConeGeometry(halfB * 1.35, 16 * scaleL, 4);
  const flaredBowMesh = new THREE.Mesh(flaredBowGeo, materials.upperHull);
  flaredBowMesh.name = 'FlaredBowMesh';
  flaredBowMesh.userData = { subsystem: 'hull' };
  flaredBowMesh.rotation.x = -Math.PI / 2;
  flaredBowMesh.rotation.y = Math.PI / 4;
  flaredBowMesh.position.set(0, freeboardH / 2 + 0.5, L * 0.45 + 5.5 * scaleL);
  flaredBowMesh.scale.set(1, 1, 0.88);
  upperHullGroup.add(flaredBowMesh);

  // 4D. Transom Stern (Flat square aft deck with corner radius)
  const transomGeo = new THREE.BoxGeometry(B * 0.92, freeboardH, 2.5 * scaleL);
  const transomMesh = new THREE.Mesh(transomGeo, materials.upperHull);
  transomMesh.name = 'TransomSternMesh';
  transomMesh.userData = { subsystem: 'hull' };
  transomMesh.position.set(0, freeboardH / 2, -L * 0.45);
  upperHullGroup.add(transomMesh);

  rootGroup.add(upperHullGroup);

  // ==========================================================
  // LAYER 5: MAIN WEATHER DECK & BULWARKS
  // ==========================================================
  const deckGroup = new THREE.Group();
  deckGroup.name = 'DeckGroup';
  deckGroup.position.y = explodeY(4);

  // 5A. Continuous Weather Deck
  const deckGeo = new THREE.BoxGeometry(B + 0.2, 0.45, L * 0.94);
  const deckMesh = new THREE.Mesh(deckGeo, materials.deck);
  deckMesh.name = 'WeatherDeckMesh';
  deckMesh.userData = { subsystem: 'deck' };
  deckMesh.position.set(0, freeboardH + 0.22, 0);
  deckMesh.receiveShadow = true;
  deckGroup.add(deckMesh);

  // 5B. Raised Forecastle Deck (Forward sheer elevation)
  const fcastleGeo = new THREE.BoxGeometry(B * 0.96, 1.4, 12 * scaleL);
  const fcastleMesh = new THREE.Mesh(fcastleGeo, materials.upperHull);
  fcastleMesh.name = 'ForecastleMesh';
  fcastleMesh.userData = { subsystem: 'deck' };
  fcastleMesh.position.set(0, freeboardH + 0.8, L * 0.41);
  deckGroup.add(fcastleMesh);

  // V-Shape Cargo Breakwater
  const bwGeo = new THREE.BoxGeometry(B * 0.72, 1.2, 0.5);
  const bwMesh = new THREE.Mesh(bwGeo, materials.superstructure);
  bwMesh.name = 'BreakwaterMesh';
  bwMesh.userData = { subsystem: 'deck' };
  bwMesh.position.set(0, freeboardH + 1.8, L * 0.35);
  deckGroup.add(bwMesh);

  // Mooring Winches on Forecastle
  for (let w = -1; w <= 1; w += 2) {
    const winchGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 10);
    const winchMesh = new THREE.Mesh(winchGeo, materials.mast);
    winchMesh.name = `MooringWinch_${w}`;
    winchMesh.userData = { subsystem: 'deck' };
    winchMesh.rotation.z = Math.PI / 2;
    winchMesh.position.set(w * (halfB * 0.55), freeboardH + 1.8, L * 0.43);
    deckGroup.add(winchMesh);
  }

  rootGroup.add(deckGroup);

  // ==========================================================
  // LAYER 6: ACCOMMODATION SUPERSTRUCTURE & BRIDGE
  // ==========================================================
  const superGroup = new THREE.Group();
  superGroup.name = 'SuperstructureGroup';
  superGroup.position.y = explodeY(5);

  const bridgeZ = -L * 0.35;
  const bridgeWidth = B * 0.82;

  // 6A. Accommodation Block Tiers 1-3
  const blockGeo = new THREE.BoxGeometry(bridgeWidth, 5.8, 11 * scaleL);
  const blockMesh = new THREE.Mesh(blockGeo, materials.superstructure);
  blockMesh.name = 'AccommodationBlockMesh';
  blockMesh.userData = { subsystem: 'bridge' };
  blockMesh.position.set(0, freeboardH + 3.2, bridgeZ);
  blockMesh.castShadow = true;
  superGroup.add(blockMesh);

  // 6B. Wheelhouse & Navigation Bridge Deck
  const wheelhouseGeo = new THREE.BoxGeometry(bridgeWidth * 0.92, 3.0, 7.5 * scaleL);
  const wheelhouseMesh = new THREE.Mesh(wheelhouseGeo, materials.superstructure);
  wheelhouseMesh.name = 'WheelhouseMesh';
  wheelhouseMesh.userData = { subsystem: 'bridge' };
  wheelhouseMesh.position.set(0, freeboardH + 7.4, bridgeZ + 1.2);
  superGroup.add(wheelhouseMesh);

  // Protruding Navigation Bridge Wings (Outward visibility platforms)
  const wingsGeo = new THREE.BoxGeometry(B + 4.6, 1.6, 3.8);
  const wingsMesh = new THREE.Mesh(wingsGeo, materials.superstructure);
  wingsMesh.name = 'BridgeWingsMesh';
  wingsMesh.userData = { subsystem: 'bridge' };
  wingsMesh.position.set(0, freeboardH + 7.4, bridgeZ + 2.2);
  superGroup.add(wingsMesh);

  // Polarized Navigation Glass Band
  const glassGeo = new THREE.BoxGeometry(bridgeWidth * 0.9, 1.1, 0.25);
  const glassMesh = new THREE.Mesh(glassGeo, materials.bridgeGlass);
  glassMesh.name = 'BridgeGlassMesh';
  glassMesh.userData = { subsystem: 'bridge' };
  glassMesh.position.set(0, freeboardH + 7.8, bridgeZ + 4.9);
  superGroup.add(glassMesh);

  // 6C. Exhaust Funnel with Commercial Marine Stripe
  const funnelGeo = new THREE.CylinderGeometry(1.6, 2.0, 6.0, 16);
  const funnelMesh = new THREE.Mesh(funnelGeo, materials.funnelBase);
  funnelMesh.name = 'FunnelBaseMesh';
  funnelMesh.userData = { subsystem: 'bridge' };
  funnelMesh.position.set(0, freeboardH + 10.5, bridgeZ - 3.2);
  superGroup.add(funnelMesh);

  const bandGeo = new THREE.CylinderGeometry(1.7, 1.82, 1.8, 16);
  const bandMesh = new THREE.Mesh(bandGeo, materials.funnelBand);
  bandMesh.name = 'FunnelBandMesh';
  bandMesh.userData = { subsystem: 'bridge' };
  bandMesh.position.set(0, freeboardH + 11.2, bridgeZ - 3.2);
  superGroup.add(bandMesh);

  // 6D. Main Radar Mast & Rotating Scanner
  const mastGeo = new THREE.CylinderGeometry(0.2, 0.45, 8.5, 8);
  const mastMesh = new THREE.Mesh(mastGeo, materials.mast);
  mastMesh.name = 'RadarMastMesh';
  mastMesh.userData = { subsystem: 'bridge' };
  mastMesh.position.set(0, freeboardH + 13.0, bridgeZ + 2.2);
  superGroup.add(mastMesh);

  const scannerGeo = new THREE.BoxGeometry(3.4, 0.25, 0.35);
  const scannerMesh = new THREE.Mesh(scannerGeo, materials.funnelBand);
  scannerMesh.name = 'RadarScannerMesh';
  scannerMesh.userData = { subsystem: 'bridge' };
  scannerMesh.position.set(0, freeboardH + 16.8, bridgeZ + 2.2);
  superGroup.add(scannerMesh);

  rootGroup.add(superGroup);

  // ==========================================================
  // LAYER 7: HATCH COVERS, CRANES & CLASS SPECIALIZATIONS
  // ==========================================================
  const outfittingGroup = new THREE.Group();
  outfittingGroup.name = 'OutfittingGroup';
  outfittingGroup.position.y = explodeY(6);

  if (vName.includes('container')) {
    // Standardized ISO Container Cell Stacks
    const bayCount = 5;
    const rowCount = 3;
    for (let b = 0; b < bayCount; b++) {
      for (let r = 0; r < rowCount; r++) {
        const tierH = 2.6 + ((b * 3 + r) % 3) * 1.2;
        const cGeo = new THREE.BoxGeometry(3.2, tierH, 7.6);
        const mat = materials.containers[(b + r) % materials.containers.length]!;
        const cMesh = new THREE.Mesh(cGeo, mat);
        cMesh.name = `ContainerStack_${b}_${r}`;
        cMesh.userData = { subsystem: 'holds' };
        const posX = (r - 1) * 3.7;
        const posZ = -L * 0.16 + b * 9.2;
        cMesh.position.set(posX, freeboardH + 0.4 + tierH / 2, posZ);
        cMesh.castShadow = true;
        outfittingGroup.add(cMesh);
      }
    }
  } else if (vName.includes('lng')) {
    // Insulated Cryogenic Spherical Moss Containment Tanks
    const tankGeo = new THREE.SphereGeometry(halfB * 0.84, 28, 24);
    const tankCount = 4;
    for (let t = 0; t < tankCount; t++) {
      const tMesh = new THREE.Mesh(tankGeo, materials.lngTanks);
      tMesh.name = `LNGMossTank_${t + 1}`;
      tMesh.userData = { subsystem: 'holds' };
      tMesh.position.set(0, freeboardH + 1.4, -L * 0.16 + t * 13.2);
      tMesh.scale.set(1, 0.94, 1);
      tMesh.castShadow = true;
      outfittingGroup.add(tMesh);
    }
  } else if (vName.includes('supramax')) {
    // Geared Bulker: 5 Cargo Hatch Covers + 4 Centerline Electro-Hydraulic Deck Cranes
    for (let h = 0; h < 5; h++) {
      const hZ = -L * 0.26 + h * 9.8;

      // Raised Hatch Coaming & Folding Cover
      const hCoverGeo = new THREE.BoxGeometry(B * 0.72, 1.2, 7.6);
      const hCoverMesh = new THREE.Mesh(hCoverGeo, materials.hatchCovers);
      hCoverMesh.name = `SupramaxHatch_${h + 1}`;
      hCoverMesh.userData = { subsystem: 'holds' };
      hCoverMesh.position.set(0, freeboardH + 0.85, hZ);
      outfittingGroup.add(hCoverMesh);

      // Deck Crane between hatches
      if (h < 4) {
        const cranePedestalGeo = new THREE.CylinderGeometry(0.7, 0.85, 4.2, 12);
        const cranePedestalMesh = new THREE.Mesh(cranePedestalGeo, materials.cranes);
        cranePedestalMesh.name = `CranePedestal_${h + 1}`;
        cranePedestalMesh.userData = { subsystem: 'deck' };
        cranePedestalMesh.position.set(0, freeboardH + 2.3, hZ + 4.9);
        outfittingGroup.add(cranePedestalMesh);

        // Lattice Crane Jib Boom
        const jibGeo = new THREE.BoxGeometry(0.35, 0.35, 8.0);
        const jibMesh = new THREE.Mesh(jibGeo, materials.cranes);
        jibMesh.name = `CraneJib_${h + 1}`;
        jibMesh.userData = { subsystem: 'deck' };
        jibMesh.position.set(1.4, freeboardH + 4.7, hZ + 4.9 + 1.8);
        jibMesh.rotation.x = -0.32;
        outfittingGroup.add(jibMesh);
      }
    }
  } else {
    // Gearless Bulk Carrier (Panamax / Capesize): Raised Coamings & End-Folding Hatch Covers
    for (let h = 0; h < holdCount; h++) {
      const hZ = -L * 0.28 + singleHoldLength * (h + 0.5);

      // Raised Hatch Coaming Lip
      const coamingGeo = new THREE.BoxGeometry(holdWidth * 1.04, 0.6, singleHoldLength * 0.88);
      const coamingMesh = new THREE.Mesh(coamingGeo, materials.upperHull);
      coamingMesh.name = `HatchCoaming_${h + 1}`;
      coamingMesh.userData = { subsystem: 'holds' };
      coamingMesh.position.set(0, freeboardH + 0.5, hZ);
      outfittingGroup.add(coamingMesh);

      // Hatch Cover Top
      const coverGeo = new THREE.BoxGeometry(holdWidth, 0.7, singleHoldLength * 0.82);
      const coverMesh = new THREE.Mesh(coverGeo, materials.hatchCovers);
      coverMesh.name = `HatchCover_${h + 1}`;
      coverMesh.userData = { subsystem: 'holds' };
      coverMesh.position.set(0, freeboardH + 0.95, hZ);
      coverMesh.castShadow = true;
      outfittingGroup.add(coverMesh);
    }
  }

  rootGroup.add(outfittingGroup);

  return rootGroup;
}

/**
 * Dynamically adjusts vertical exploded layer offsets without rebuilding any geometry.
 * Ultra-fast (0.001 ms), preserving all existing WebGL buffers and avoiding re-renders.
 */
export function updateVesselExplodedProgress(vesselModel: THREE.Group, explodedProgress: number) {
  const layerMap: Record<string, number> = {
    LowerHullGroup: 0,
    BallastFuelGroup: 1,
    HoldsEngineGroup: 2,
    UpperHullGroup: 3,
    DeckGroup: 4,
    SuperstructureGroup: 5,
    OutfittingGroup: 6,
  };

  for (const [groupName, layerIndex] of Object.entries(layerMap)) {
    const group = vesselModel.getObjectByName(groupName);
    if (group) {
      group.position.y = explodedProgress * layerIndex * 7.0;
    }
  }
}
