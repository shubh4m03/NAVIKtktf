import { apiClient } from './client';
import { PortInfo } from '../../types';

interface BackendPortDto {
  id: number;
  name: string;
  code: string;
  region?: string;
  lat?: number;
  lon?: number;
  constraints?: Array<{
    maxDraftM?: number;
    maxLoaM?: number;
    maxBeamM?: number;
    handlingRateTph?: number;
  }>;
}

function mapToPortInfo(p: BackendPortDto): PortInfo {
  const primaryConstraint = p.constraints && p.constraints.length > 0 ? p.constraints[0] : undefined;
  return {
    id: `port-${p.id}`,
    name: p.name,
    country: p.region || 'India',
    region: p.region || 'East Coast India',
    maxDraftMeters: primaryConstraint?.maxDraftM ?? 15.0,
    congestionIndex: 0.28,
    lat: p.lat ?? 20.26,
    lng: p.lon ?? 86.67,
    unlocode: p.code,
    status: 'normal',
    hasTerminals: true,
  };
}

export const portApi = {
  getPorts: async (): Promise<PortInfo[]> => {
    const data = await apiClient.get<BackendPortDto[]>('/ports');
    return data.map(mapToPortInfo);
  },
  getPort: async (id: string): Promise<PortInfo> => {
    const rawId = id.replace('port-', '');
    const data = await apiClient.get<BackendPortDto>(`/ports/${rawId}`);
    return mapToPortInfo(data);
  }
};
