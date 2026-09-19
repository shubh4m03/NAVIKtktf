import { apiClient } from './client';
import { VesselClass } from '../../types';

interface BackendVesselClassDto {
  id: number;
  name: string;
  dwtMin: number;
  dwtMax: number;
  typicalDraftM: number;
  typicalLoaM: number;
  typicalBeamM: number;
}

function mapToVesselClass(v: BackendVesselClassDto): VesselClass {
  return {
    id: `vessel-${v.name.toLowerCase()}`,
    className: v.name,
    primaryCargo: ['dry-bulk', 'breakbulk'],
    capacityTonnes: v.dwtMax,
    maxDraftMeters: v.typicalDraftM,
    avgSpeedKnots: 14.0,
    beamMeters: v.typicalBeamM,
    lengthMeters: v.typicalLoaM,
    capabilities: ['self-discharging', 'grab-fitted'],
    description: `Standard ${v.name} dry-bulk carrier with ${v.dwtMin.toLocaleString()}-${v.dwtMax.toLocaleString()} DWT capacity.`
  };
}

export const vesselApi = {
  getVesselClasses: async (): Promise<VesselClass[]> => {
    const data = await apiClient.get<BackendVesselClassDto[]>('/vessel-classes');
    return data.map(mapToVesselClass);
  }
};
