// ─────────────────────────────────────────────────────────────
// components/route-intelligence/vesselPositionsData.ts
// Demo commercial vessel positions explicitly demarcated as non-live AIS
// ─────────────────────────────────────────────────────────────

export interface DemoVesselPosition {
  id: string;
  vesselName: string;
  vesselClass: string;
  imoNumber: string;
  lat: number;
  lng: number;
  headingDegrees: number;
  speedKnots: number;
  origin: string;
  destination: string;
  cargo: string;
  cargoTonnage: number;
  isDemoData: true;
  dataSourceLabel: 'DEMO VESSEL POSITION';
  disclaimer: 'Simulated position for algorithmic validation · Not live satellite AIS';
}

export const DEMO_VESSEL_POSITIONS: DemoVesselPosition[] = [
  {
    id: 'vessel-kamsar-leader',
    vesselName: 'MV KAMSAR LEADER',
    vesselClass: 'Kamsarmax Bulk Carrier',
    imoNumber: 'IMO 9842104',
    lat: 13.80,
    lng: 88.90,
    headingDegrees: 320,
    speedKnots: 13.8,
    origin: 'Hay Point',
    destination: 'Paradip',
    cargo: 'Coking Coal',
    cargoTonnage: 78500,
    isDemoData: true,
    dataSourceLabel: 'DEMO VESSEL POSITION',
    disclaimer: 'Simulated position for algorithmic validation · Not live satellite AIS'
  },
  {
    id: 'vessel-mineral-dhamra',
    vesselName: 'MV MINERAL DHAMRA',
    vesselClass: 'Capesize Bulk Carrier',
    imoNumber: 'IMO 9723019',
    lat: -9.50,
    lng: 110.20,
    headingDegrees: 295,
    speedKnots: 12.6,
    origin: 'Newcastle',
    destination: 'Dhamra',
    cargo: 'Thermal Coal',
    cargoTonnage: 172000,
    isDemoData: true,
    dataSourceLabel: 'DEMO VESSEL POSITION',
    disclaimer: 'Simulated position for algorithmic validation · Not live satellite AIS'
  },
  {
    id: 'vessel-ocean-voyager',
    vesselName: 'MT ARABIAN VOYAGER',
    vesselClass: 'LR2 Product Tanker',
    imoNumber: 'IMO 9918042',
    lat: 15.20,
    lng: 66.80,
    headingDegrees: 48,
    speedKnots: 14.1,
    origin: 'Richards Bay',
    destination: 'Mumbai (JNPT)',
    cargo: 'Clean Petroleum Products',
    cargoTonnage: 105000,
    isDemoData: true,
    dataSourceLabel: 'DEMO VESSEL POSITION',
    disclaimer: 'Simulated position for algorithmic validation · Not live satellite AIS'
  }
];
