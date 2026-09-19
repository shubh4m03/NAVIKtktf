// ─────────────────────────────────────────────────────────────
// components/vessel-explorer/VesselTypes.ts
// Strict types for technical naval architecture 3D visualization
// ─────────────────────────────────────────────────────────────

export type VesselSubsystem = 'all' | 'holds' | 'engine' | 'ballast' | 'bridge' | 'fuel';
export type VisualRenderMode = 'solid' | 'wireframe' | 'xray';

export interface SubsystemInfo {
  id: VesselSubsystem;
  name: string;
  category: string;
  description: string;
  telemetry: string;
}

export const SUBSYSTEMS: SubsystemInfo[] = [
  {
    id: 'all',
    name: 'Complete Vessel',
    category: 'Assembly',
    description: 'Full naval architectural hull assembly including topsides, underwater anti-fouling, and outfitting.',
    telemetry: 'Full Class Survey'
  },
  {
    id: 'holds',
    name: 'Cargo Holds',
    category: 'Payload',
    description: 'Watertight cargo holds with transverse bulkheads, hopper bottoms, and hydraulic folding hatch covers.',
    telemetry: 'Grain & Bale Volume'
  },
  {
    id: 'ballast',
    name: 'Ballast Arrangement',
    category: 'Stability',
    description: 'Double bottom ballast tanks and topside hopper wing tanks for draft adjustment and trim control.',
    telemetry: 'Segregated Ballast (SBT)'
  },
  {
    id: 'engine',
    name: 'Engine Room & Propulsion',
    category: 'Machinery',
    description: 'Aft machinery space containing two-stroke low-speed main diesel engine, shaft line, and auxiliaries.',
    telemetry: 'MCR 9,800 kW @ 84 RPM'
  },
  {
    id: 'fuel',
    name: 'Bunker Fuel Tanks',
    category: 'Bunkers',
    description: 'Deep bunker storage and settling/service tanks for Very Low Sulfur Fuel Oil (VLSFO) and MGO.',
    telemetry: 'Capacity: 2,400 MT VLSFO'
  },
  {
    id: 'bridge',
    name: 'Bridge & Superstructure',
    category: 'Navigation',
    description: 'Tiered accommodation deckhouse, enclosed navigation bridge with docking wings, and communications mast.',
    telemetry: 'SOLAS ECDIS / Radar Class A'
  }
];
