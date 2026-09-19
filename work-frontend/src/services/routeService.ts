import { RouteInfo } from '../types';
import { mockRoutes } from '../data/mockRoutes';

export const routeService = {
  getRoutes: async (): Promise<RouteInfo[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(mockRoutes), 200));
  },

  getRouteByPorts: async (originId: string, destId: string): Promise<RouteInfo | undefined> => {
    const routes = await routeService.getRoutes();
    return routes.find(r => r.originPortId === originId && r.destinationPortId === destId);
  }
};
