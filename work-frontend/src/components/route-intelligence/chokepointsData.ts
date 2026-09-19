// ─────────────────────────────────────────────────────────────
// components/route-intelligence/chokepointsData.ts
// Strategic maritime chokepoints with navigational clearances & risks
// ─────────────────────────────────────────────────────────────

export interface ChokepointInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  maxDraftMeters: number;
  maxBeamMeters?: number;
  trafficVolume: 'Ultra High' | 'Very High' | 'High' | 'Moderate';
  dailyTransits: number;
  primaryRisk: string;
  operationalStatus: 'Clear' | 'Slot Congestion' | 'War Risk Premium' | 'Draft Restriction';
  description: string;
}

export const MARITIME_CHOKEPOINTS: ChokepointInfo[] = [
  {
    id: 'suez',
    name: 'Suez Canal',
    lat: 30.58,
    lng: 32.34,
    maxDraftMeters: 20.1,
    maxBeamMeters: 77.5,
    trafficVolume: 'Very High',
    dailyTransits: 52,
    primaryRisk: 'Convoy slot scheduling & geopolitical surcharge',
    operationalStatus: 'Slot Congestion',
    description: 'Vital 193 km arterial canal connecting the Mediterranean Sea to the Red Sea; saves ~10 days over Cape routing.'
  },
  {
    id: 'bab',
    name: 'Bab-el-Mandeb',
    lat: 12.60,
    lng: 43.33,
    maxDraftMeters: 25.0,
    trafficVolume: 'High',
    dailyTransits: 45,
    primaryRisk: 'Regional conflict, drone/missile threat & high insurance premiums',
    operationalStatus: 'War Risk Premium',
    description: 'Strategic strait between Yemen and Djibouti connecting the Gulf of Aden to the southern entrance of the Red Sea.'
  },
  {
    id: 'malacca',
    name: 'Strait of Malacca',
    lat: 2.50,
    lng: 101.50,
    maxDraftMeters: 20.5, // Malaccamax draft restriction
    trafficVolume: 'Ultra High',
    dailyTransits: 140,
    primaryRisk: 'Extreme traffic density, shallow banks (One Fathom Bank), cross-strait ferries',
    operationalStatus: 'Clear',
    description: 'Main shipping channel between the Indian Ocean and the Pacific Ocean, linking major Asian economies.'
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    lat: 9.10,
    lng: -79.70,
    maxDraftMeters: 15.2, // Neopanamax locks limit; Panamax lock is 12.04m
    maxBeamMeters: 32.31,
    trafficVolume: 'High',
    dailyTransits: 36,
    primaryRisk: 'Freshwater lake draft restrictions & auction reservation surcharges',
    operationalStatus: 'Draft Restriction',
    description: '82 km artificial waterway in Panama that connects the Atlantic Ocean with the Pacific Ocean across the Isthmus of Panama.'
  },
  {
    id: 'cape',
    name: 'Cape of Good Hope',
    lat: -34.35,
    lng: 18.50,
    maxDraftMeters: 32.0, // Capesize unrestricted draft
    trafficVolume: 'High',
    dailyTransits: 85,
    primaryRisk: 'Severe Southern Ocean swells (Agulhas Current rough sea state)',
    operationalStatus: 'Clear',
    description: 'Southern tip of the African continent used as primary alternative to Suez Canal during regional Middle East disruptions.'
  }
];
