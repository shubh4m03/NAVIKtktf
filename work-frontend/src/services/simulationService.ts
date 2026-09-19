import { CharterScenario, VesselClass, RouteInfo } from '../types';

export interface VoyageCost {
  totalUsd: number;
  breakdown: {
    freight: number;
    fuel: number;
    port: number;
    waiting: number;
  };
}

export interface RiskAnalysis {
  marketRisk: number; // 0 to 1
  portCongestionRisk: number; // 0 to 1
  overallRating: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}

export const simulationService = {
  calculateVoyageCost: (
    scenario: CharterScenario, 
    vessel: VesselClass, 
    route: RouteInfo, 
    currentRate: number
  ): VoyageCost => {
    // Deterministic simulation
    const freightCost = scenario.cargoTonnage * currentRate;
    
    // Fuel: Assume 30 tons/day at $600/ton
    const transitDays = route.estimatedTransitDays;
    const fuelCost = transitDays * 30 * 600;

    // Port costs: flat rate based on vessel size
    const portCost = vessel.capacityTonnes > 100000 ? 45000 : 25000;

    // Waiting costs: dependent on route risks / congestion
    const waitingDays = route.risks.length * 1.5;
    const waitingCost = waitingDays * 15000; // Demurrage estimate

    const total = freightCost + fuelCost + portCost + waitingCost;

    return {
      totalUsd: total,
      breakdown: {
        freight: freightCost,
        fuel: fuelCost,
        port: portCost,
        waiting: waitingCost
      }
    };
  },

  analyzeRisk: (
    route: RouteInfo, 
    portCongestionIndex: number, 
    marketVolatility: number
  ): RiskAnalysis => {
    
    const marketRisk = Math.min(1, marketVolatility * 2.5);
    const portRisk = portCongestionIndex;
    
    const avgRisk = (marketRisk + portRisk) / 2;
    let overallRating: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (avgRisk > 0.6) overallRating = 'HIGH';
    else if (avgRisk > 0.3) overallRating = 'MEDIUM';

    const reasons: string[] = [];
    if (marketRisk > 0.5) reasons.push('High market volatility observed in current rates');
    if (portRisk > 0.7) reasons.push('Severe port congestion at destination');
    if (route.risks.length > 0) reasons.push(...route.risks);

    return {
      marketRisk,
      portCongestionRisk: portRisk,
      overallRating,
      reasons
    };
  }
};
