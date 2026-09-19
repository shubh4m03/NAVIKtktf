export type CargoCategory = 'container' | 'dry-bulk' | 'liquid-bulk' | 'breakbulk' | 'project' | 'ro-ro';
export type CargoStatus = 'hazardous' | 'perishable' | 'standard';

export interface CargoProfile {
  id: string;
  type: string;
  category: CargoCategory;
  weightTonnes: number;
  volumeCbm?: number;
  status: CargoStatus;
  temperatureRequirement?: number; // in Celsius
  isOversized: boolean;
  requiredDeliveryDate?: string;
}

export interface VesselClass {
  id: string;
  className: string;
  primaryCargo: CargoCategory[];
  capacityTonnes: number;
  maxDraftMeters: number;
  avgSpeedKnots: number;
  beamMeters?: number;
  lengthMeters?: number;
  capabilities: string[];
  description: string;
}

export interface PortInfo {
  id: string;
  name: string;
  country: string;
  region?: string;
  maxDraftMeters: number;
  supportedCargo?: CargoCategory[];
  congestionIndex: number; // 0.0 to 1.0
  lat?: number;
  lng?: number;
  unlocode?: string;
  status?: string;
  hasTerminals?: boolean;
}

export interface RouteInfo {
  id: string;
  originPortId: string;
  destinationPortId: string;
  distanceNauticalMiles: number;
  estimatedTransitDays: number;
  regions: string[];
  risks: string[];
  waypoints?: [number, number][]; // Geodesic maritime waypoints [lng, lat]
}

export interface FreightRate {
  date: string; // YYYY-MM-DD
  routeId: string;
  vesselClassId: string;
  rateUsdPerTonne: number;
}

export interface MarketEvent {
  id: string;
  date: string;
  category: 'geopolitical' | 'supply-shock' | 'demand-spike' | 'weather';
  title: string;
  description: string;
  rateChangePercent: number;
}

export interface CharterScenario {
  cargoTonnage: number;
  commodity: string;
  origin: string;
  destinationPort: string;
  requiredDate: string;
  numVoyages: number;
}
