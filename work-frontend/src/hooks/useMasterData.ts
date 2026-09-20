import { useState, useEffect } from 'react';
import { VesselClass, PortInfo } from '../types';
import { vesselService } from '../services/vesselService';
import { portService } from '../services/portService';

interface MasterDataState {
  vessels: VesselClass[];
  ports: PortInfo[];
  isLoading: boolean;
  error: string | null;
}

// Simple in-memory cache to avoid re-fetching on every component mount if we don't use Context
let cachedVessels: VesselClass[] | null = null;
let cachedPorts: PortInfo[] | null = null;
let fetchPromise: Promise<void> | null = null;

const fallbackVessels: VesselClass[] = [
  {
    id: 'vessel-handymax',
    className: 'Handymax',
    primaryCargo: ['dry-bulk', 'breakbulk'],
    capacityTonnes: 50000,
    maxDraftMeters: 12.5,
    avgSpeedKnots: 13.5,
    beamMeters: 23,
    lengthMeters: 190,
    capabilities: ['self-discharging', 'grab-fitted'],
    description: 'Flexible dry-bulk carrier for smaller parcels and draft-limited ports.'
  },
  {
    id: 'vessel-panamax',
    className: 'Panamax',
    primaryCargo: ['dry-bulk', 'breakbulk'],
    capacityTonnes: 75000,
    maxDraftMeters: 14.5,
    avgSpeedKnots: 14,
    beamMeters: 32,
    lengthMeters: 225,
    capabilities: ['self-discharging', 'grab-fitted'],
    description: 'Standard Panamax dry-bulk carrier for major coal and grain trades.'
  },
  {
    id: 'vessel-capesize',
    className: 'Capesize',
    primaryCargo: ['dry-bulk'],
    capacityTonnes: 180000,
    maxDraftMeters: 18,
    avgSpeedKnots: 14.5,
    beamMeters: 45,
    lengthMeters: 290,
    capabilities: ['grab-fitted'],
    description: 'Large dry-bulk carrier suited to deep-water terminals and major volumes.'
  }
];

const fallbackPorts: PortInfo[] = [
  {
    id: 'port-paradip',
    name: 'Paradip',
    country: 'India',
    region: 'East Coast India',
    maxDraftMeters: 15,
    congestionIndex: 0.28,
    lat: 20.26,
    lng: 86.67,
    unlocode: 'INPRT',
    status: 'normal',
    hasTerminals: true
  },
  {
    id: 'port-dhamra',
    name: 'Dhamra',
    country: 'India',
    region: 'East Coast India',
    maxDraftMeters: 18,
    congestionIndex: 0.22,
    lat: 20.78,
    lng: 86.96,
    unlocode: 'IN DAM',
    status: 'normal',
    hasTerminals: true
  },
  {
    id: 'port-hay-point',
    name: 'Hay Point',
    country: 'Australia',
    region: 'Queensland',
    maxDraftMeters: 18,
    congestionIndex: 0.35,
    lat: -21.29,
    lng: 149.30,
    unlocode: 'AUHPT',
    status: 'normal',
    hasTerminals: true
  }
];

export function useMasterData() {
  const [state, setState] = useState<MasterDataState>({
    vessels: cachedVessels || [],
    ports: cachedPorts || [],
    isLoading: !cachedVessels || !cachedPorts,
    error: null
  });

  useEffect(() => {
    if (cachedVessels && cachedPorts) {
      return;
    }

    if (!fetchPromise) {
      fetchPromise = Promise.all([
        vesselService.getVessels(),
        portService.getPorts()
      ]).then(([vessels, ports]) => {
        cachedVessels = vessels;
        cachedPorts = ports;
      }).catch(err => {
        throw err;
      });
    }

    fetchPromise
      .then(() => {
        setState({
          vessels: cachedVessels!,
          ports: cachedPorts!,
          isLoading: false,
          error: null
        });
      })
      .catch((err) => {
        fetchPromise = null; // Clear so subsequent attempts or reloads can retry
        cachedVessels = fallbackVessels;
        cachedPorts = fallbackPorts;
        setState(prev => ({
          ...prev,
          vessels: fallbackVessels,
          ports: fallbackPorts,
          isLoading: false,
          error: null
        }));
      });
  }, []);

  return state;
}
