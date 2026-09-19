import { PortInfo } from '../types';
import { portApi } from './api/portApi';

export const portService = {
  getPorts: async (): Promise<PortInfo[]> => {
    return portApi.getPorts();
  },
  
  getPortById: async (id: string): Promise<PortInfo | undefined> => {
    return portApi.getPort(id);
  }
};
