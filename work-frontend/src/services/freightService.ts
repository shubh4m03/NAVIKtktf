import { FreightRate, MarketEvent } from '../types';
import { mockFreightRates } from '../data/mockFreightRates';
import { mockEvents } from '../data/mockEvents';
import { apiClient } from './api/client';

export type MarketTrend = 'RISING' | 'STABLE' | 'VOLATILE' | 'DECLINING';

export interface MarketAnalysis {
  currentRate: number;
  averageRate: number;
  trend: MarketTrend;
  volatility: number;
  percentageChange: number;
}

export const freightService = {
  getHistoricalRates: async (routeId: string, days: number = 30): Promise<FreightRate[]> => {
    try {
      // Map routeId to origin region and destination port id
      let originRegion = 'AUSTRALIA_HAY_POINT';
      let destinationPortId = '1';

      if (routeId.includes('aus') || routeId.includes('gladstone')) {
        originRegion = 'AUSTRALIA_GLADSTONE';
        destinationPortId = '2';
      } else if (routeId.includes('newcastle')) {
        originRegion = 'AUSTRALIA_NEWCASTLE';
        destinationPortId = '3';
      } else if (routeId.includes('indo') || routeId.includes('kalimantan')) {
        originRegion = 'INDONESIA_KALIMANTAN';
        destinationPortId = '1';
      } else if (routeId.includes('mozambique') || routeId.includes('nacala')) {
        originRegion = 'MOZAMBIQUE_NACALA';
        destinationPortId = '1';
      }

      const rows = await apiClient.get<Array<{
        date: string;
        rateUsdPerTonne: number;
        vesselClass?: string;
      }>>('/freight/history', {
        params: {
          originRegion,
          destinationPortId,
          days: days.toString()
        }
      });

      if (rows && rows.length > 0) {
        return rows.map(r => ({
          date: r.date,
          routeId,
          vesselClassId: r.vesselClass || 'Capesize',
          rateUsdPerTonne: r.rateUsdPerTonne
        }));
      }
    } catch (err) {
      console.warn('[freightService] Backend freight history request failed, using cached baseline', err);
    }

    // Baseline fallback if backend endpoint returned empty or error
    const filtered = mockFreightRates
      .filter(r => r.routeId === routeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days)
      .reverse();
    return filtered;
  },

  getMarketEvents: async (days: number = 90): Promise<MarketEvent[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Assume simulation "today" is Sept 18 2026 based on DEMO DATASET status
        const today = new Date('2026-09-18').getTime();
        const cutoff = today - days * 24 * 60 * 60 * 1000;
        const filtered = mockEvents.filter(e => {
          const t = new Date(e.date).getTime();
          return t >= cutoff && t <= today;
        });
        resolve(filtered);
      }, 200);
    });
  },

  getForecast: async (originRegion: string, destPort: string, vesselClass: string, days: number = 90) => {
    try {
      const response = await fetch('http://localhost:8000/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_region: originRegion,
          destination_port: destPort,
          vessel_class: vesselClass,
          horizon_days: days
        })
      });
      if (!response.ok) throw new Error('Forecast API failed');
      return await response.json();
    } catch (err) {
      console.warn("ML Forecast API unreachable. Falling back to mock data.", err);
      // Fallback mock
      return {
        expected_value_usd_per_ton: 28.50,
        interval_50: [27.0, 30.0],
        interval_90: [25.0, 32.0],
        prob_increase_gt_8pct: 0.25,
        confidence_score: 70.0,
        model_used: "fallback_mock",
        data_provenance: { point_model: "MOCK" },
        generated_at: new Date().toISOString()
      };
    }
  },

  analyzeMarket: (rates: FreightRate[]): MarketAnalysis => {
    if (rates.length === 0) {
      return { currentRate: 0, averageRate: 0, trend: 'STABLE', volatility: 0, percentageChange: 0 };
    }

    const first = rates[0];
    const last = rates[rates.length - 1];
    if (!first || !last) {
      return { currentRate: 0, averageRate: 0, trend: 'STABLE', volatility: 0, percentageChange: 0 };
    }

    const currentRate = last.rateUsdPerTonne;
    const startRate = first.rateUsdPerTonne;
    const percentageChange = startRate !== 0 ? ((currentRate - startRate) / startRate) * 100 : 0;
    
    const sum = rates.reduce((acc, curr) => acc + curr.rateUsdPerTonne, 0);
    const averageRate = sum / rates.length;

    // Calculate standard deviation for volatility
    const variance = rates.reduce((acc, curr) => acc + Math.pow(curr.rateUsdPerTonne - averageRate, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    const volatility = stdDev / averageRate; // Normalized volatility

    let trend: MarketTrend = 'STABLE';
    if (volatility > 0.15) {
      trend = 'VOLATILE';
    } else if (percentageChange > 5) {
      trend = 'RISING';
    } else if (percentageChange < -5) {
      trend = 'DECLINING';
    }

    return {
      currentRate,
      averageRate,
      trend,
      volatility,
      percentageChange
    };
  }
};
