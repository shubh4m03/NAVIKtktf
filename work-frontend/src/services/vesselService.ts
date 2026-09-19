import { VesselClass, CargoProfile, PortInfo } from '../types';
import { vesselApi } from './api/vesselApi';

export type Violation =
  | { kind: 'capacity'; requiredMt: number; vesselDwtMt: number }
  | { kind: 'draft'; vesselDraftM: number; portMaxDraftM: number }
  | { kind: 'cargoType'; commodity: string; vesselType: string }
  | { kind: 'beam'; vesselBeamM: number; limitM: number }
  | { kind: 'gear'; required: string; available: string };

export interface FeasibilityResult {
  vessel: VesselClass;
  isFeasible: boolean;
  violation?: Violation;
  // Ordinal ranking score
  compatibilityScore?: number;
}

export const vesselService = {
  getVessels: async (): Promise<VesselClass[]> => {
    try {
      return await vesselApi.getVesselClasses();
    } catch (e) {
      console.error("Failed to fetch vessels from backend, falling back to empty array.", e);
      throw e;
    }
  },

  calculateCompatibility: (vessel: VesselClass, cargo: CargoProfile): number => {
    let score = 0;
    
    // Capacity match (Vessel must be able to carry it, but ideally not be completely empty)
    if (cargo.weightTonnes <= vessel.capacityTonnes) {
      score += 0.3;
      // Penalize heavily if utilizing less than 40% of the vessel
      if (cargo.weightTonnes / vessel.capacityTonnes < 0.4) {
        score -= 0.15;
      }
    }

    return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
  },

  evaluateFeasibility: (
    vessels: VesselClass[], 
    cargo: CargoProfile, 
    destinationPort: PortInfo
  ): { feasible: FeasibilityResult[]; infeasible: FeasibilityResult[] } => {
    
    const results = vessels.map(vessel => {
      // Constraint (a): Cargo-type compatibility [HARD]
      if (!vessel.primaryCargo.includes(cargo.category)) {
        return { 
          vessel, 
          isFeasible: false, 
          violation: { kind: 'cargoType', commodity: cargo.category, vesselType: vessel.className } as Violation
        };
      }

      // Constraint (b): Deadweight capacity [HARD]
      if (cargo.weightTonnes > vessel.capacityTonnes) {
        return { 
          vessel, 
          isFeasible: false, 
          violation: { kind: 'capacity', requiredMt: cargo.weightTonnes, vesselDwtMt: vessel.capacityTonnes } as Violation
        };
      }

      // Constraint (c): Laden draft vs berth draft limit [HARD]
      // Approximate laden draft: maxDraftMeters * (0.5 + 0.5 * utilization)
      const utilization = cargo.weightTonnes / vessel.capacityTonnes;
      const operatingDraftM = vessel.maxDraftMeters * 0.5 + utilization * (vessel.maxDraftMeters * 0.5);
      if (operatingDraftM > destinationPort.maxDraftMeters) {
        return { 
          vessel, 
          isFeasible: false, 
          violation: { kind: 'draft', vesselDraftM: Number(operatingDraftM.toFixed(1)), portMaxDraftM: destinationPort.maxDraftMeters } as Violation
        };
      }

      // Constraint (e): Gear/Temperature requirement [HARD]
      if (cargo.status === 'perishable' && !vessel.capabilities.includes('temperature-control')) {
        return { 
          vessel, 
          isFeasible: false, 
          violation: { kind: 'gear', required: 'temperature-control', available: 'none' } as Violation
        };
      }

      // If it passes all hard constraints, it is feasible. Compute a score for ordinal ranking.
      const score = vesselService.calculateCompatibility(vessel, cargo);

      return {
        vessel,
        isFeasible: true,
        compatibilityScore: score
      };
    });

    return {
      feasible: results.filter(r => r.isFeasible).sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0)),
      infeasible: results.filter(r => !r.isFeasible)
    };
  }
};
