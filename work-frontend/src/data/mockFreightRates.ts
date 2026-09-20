import { FreightRate } from '../types';

// Generate some pseudo-random demo data for the Australia -> India route (Panamax)
const generateFreightData = (): FreightRate[] => {
  const rates: FreightRate[] = [];
  const BASE_RATE = 14.5;
  let currentRate = BASE_RATE; 

  // Generate for the past 12 months, roughly every 5 days
  const startDate = new Date('2025-09-18');
  for (let i = 0; i < 73; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + (i * 5));
    
    // Mean-reverting random walk with noise
    const noise = (Math.random() - 0.5) * 2.5; 
    const meanReversion = (BASE_RATE - currentRate) * 0.15;
    const volatility = (Math.random() > 0.8) ? (Math.random() - 0.5) * 3.0 : 0; // occasional spikes
    
    currentRate = Math.max(6.0, currentRate + meanReversion + noise + volatility);
    
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
