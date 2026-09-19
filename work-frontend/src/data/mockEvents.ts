import { MarketEvent } from '../types';

export const mockEvents: MarketEvent[] = [
  {
    id: 'event-001',
    date: '2025-10-12',
    category: 'weather',
    title: 'Severe Monsoon at Paradip',
    description: 'Heavy rainfall and strong winds have temporarily halted loading/unloading operations at Paradip, increasing local congestion.',
    rateChangePercent: 4.5,
  },
  {
    id: 'event-002',
    date: '2026-02-18',
    category: 'demand-spike',
    title: 'Surge in Australian Coal Exports',
    description: 'Increased winter demand in South Asia led to a surge in coal chartering from Newcastle, tightening vessel supply.',
    rateChangePercent: 12.8,
  },
  {
    id: 'event-003',
    date: '2026-05-05',
    category: 'geopolitical',
    title: 'Suez Canal Diversions',
    description: 'Vessels are increasingly routing around the Cape of Good Hope, absorbing effective capacity and driving up global freight indices.',
    rateChangePercent: 8.2,
  },
  {
    id: 'event-004',
    date: '2026-08-20',
    category: 'supply-shock',
    title: 'New Capesize Deliveries',
    description: 'A wave of newbuild Capesize vessels hit the water in Q3, increasing capacity and putting downward pressure on rates.',
    rateChangePercent: -6.5,
  }
];
