import { CargoProfile, VesselClass, RouteInfo } from '../types';
import { apiClient } from './api/client';

export interface NirnayContext {
  cargo?: CargoProfile;
  vessels?: VesselClass[];
  vesselClass?: string;
  route?: RouteInfo;
  currentChartPeriod?: string;
  scenario?: {
    origin: string;
    destination: string;
    cargoTonnage: number;
    commodity: string;
  };
}

export interface NirnayResponse {
  objective: string;
  recommendedApproach: string;
  rationale: string[];
  alternatives?: string[];
  tradeoffs?: string[];
  marketContext?: string;
  confidence: number;
  sources?: string[];
}

let globalNirnayContext: NirnayContext = {
  vesselClass: 'Panamax',
  scenario: {
    origin: 'Hay Point',
    destination: 'Paradip',
    cargoTonnage: 70000,
    commodity: 'Coal (Coking)',
  },
};

const contextListeners = new Set<(ctx: NirnayContext) => void>();

export const nirnaynService = {
  getActiveContext: (): NirnayContext => globalNirnayContext,
  setActiveContext: (update: Partial<NirnayContext>) => {
    globalNirnayContext = {
      ...globalNirnayContext,
      ...update,
      scenario: update.scenario ? { ...globalNirnayContext.scenario, ...update.scenario } : globalNirnayContext.scenario,
    };
    contextListeners.forEach((fn) => fn(globalNirnayContext));
  },
  subscribe: (fn: (ctx: NirnayContext) => void) => {
    contextListeners.add(fn);
    return () => {
      contextListeners.delete(fn);
    };
  },
  analyze: async (query: string, context?: NirnayContext, history?: any[]): Promise<NirnayResponse> => {
    const effectiveContext = context || globalNirnayContext;
    
    try {
      const data = await apiClient.post<any>('/nirnay/chat', {
        prompt: query,
        context: effectiveContext.scenario,
        history: history || []
      });

      // Map to contract
      return {
        objective: data.objective || 'Scenario Analysis',
        recommendedApproach: data.answer || data.recommendedApproach || data.text || '',
        rationale: data.rationale || [],
        sources: data.sources || [],
        confidence: data.confidence !== undefined ? data.confidence : 0.95
      };
    } catch (e) {
      console.error('Failed to analyze with NIRNAY backend', e);
      return {
        objective: 'System Error',
        recommendedApproach: 'Backend communication failed. Ensure Spring Boot backend is running.',
        rationale: [],
        confidence: 0.0
      };
    }
  }
};
