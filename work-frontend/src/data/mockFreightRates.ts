import { FreightRate } from '../types';

// Generate some deterministic demo data for the Australia -> India route (Panamax)
const generateFreightData = (): FreightRate[] => {
  const rates: FreightRate[] = [];
  let currentRate = 12.5; // Starting base rate

  // Generate for the past 12 months, roughly every 5 days
  const startDate = new Date('2025-09-18');
  for (let i = 0; i < 73; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + (i * 5));
    
    // Add some noise and trend
    const noise = (Math.random() - 0.5) * 1.5;
    const trend = (i > 30 && i < 45) ? 0.2 : (i > 60 ? -0.1 : 0.05);
    
    currentRate = Math.max(8.0, currentRate + trend + noise);
    
    rates.push({
      date: d.toISOString().slice(0, 10),
      routeId: 'route-aus-paradip',
      vesselClassId: 'vessel-panamax',
      rateUsdPerTonne: Number(currentRate.toFixed(2)),
    });
  }
  return rates;
};

export const mockFreightRates: FreightRate[] = generateFreightData();
