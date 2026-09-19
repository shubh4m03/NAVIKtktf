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
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load master data. Check backend connection.'
        }));
      });
  }, []);

  return state;
}
