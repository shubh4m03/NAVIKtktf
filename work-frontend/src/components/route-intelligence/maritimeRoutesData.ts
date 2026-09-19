// ─────────────────────────────────────────────────────────────
// components/route-intelligence/maritimeRoutesData.ts
// Authentic geodesic commercial shipping routes and sea-lane waypoints
// ─────────────────────────────────────────────────────────────

import { RouteInfo } from '../../types';

export const DETAILED_MARITIME_ROUTES: RouteInfo[] = [
  {
    id: 'route-aus-paradip',
    originPortId: 'port-hay-point',
    destinationPortId: 'port-paradip',
    distanceNauticalMiles: 5200,
    estimatedTransitDays: 15.5,
    regions: ['Coral Sea', 'Torres Strait / Sunda', 'Indian Ocean', 'Bay of Bengal'],
    risks: ['Monsoon swells (seasonal)', 'Paradip outer anchorage queue', 'Malacca Strait traffic density'],
    waypoints: [
      [149.30, -21.28], // Hay Point
      [152.50, -18.20], // Coral Sea Outer Passage
      [148.00, -12.50], // Great Barrier Reef North Exit
      [142.20, -10.55], // Torres Strait / Prince of Wales Channel
      [135.00, -9.50],  // Arafura Sea
      [127.50, -10.20], // Timor Sea
      [120.50, -8.60],  // Ombai / Savu Strait Passage
      [112.00, -9.80],  // South of Java Island
      [104.50, -6.80],  // Sunda Strait Outer Sea Approach
      [95.50, -1.00],   // Equatorial Indian Ocean Shipping Corridor
      [93.50, 6.00],    // Great Nicobar / Six Degree Channel
      [89.50, 13.00],   // Central Bay of Bengal
      [87.20, 18.50],   // Paradip Fairway Approach
      [86.67, 20.26]    // Paradip Port
    ]
  },
  {
    id: 'route-aus-dhamra',
    originPortId: 'port-newcastle',
    destinationPortId: 'port-dhamra',
    distanceNauticalMiles: 5400,
    estimatedTransitDays: 16.2,
    regions: ['Tasman Sea', 'Lombok Strait', 'Indian Ocean', 'Bay of Bengal'],
    risks: ['Deep draft navigation channel', 'Southern Ocean heavy swell'],
    waypoints: [
      [151.78, -32.93], // Newcastle
      [150.50, -37.50], // SE Australia Coast
      [146.00, -39.50], // Bass Strait Deep Water Lane
      [136.00, -37.20], // Great Australian Bight East
      [124.00, -35.50], // Great Australian Bight West
      [114.80, -34.50], // Cape Leeuwin South Passage
      [108.00, -28.00], // Southeast Trade Winds Corridor
      [98.00, -16.00],  // Southern Indian Ocean
      [90.00, -2.00],   // Equatorial Indian Ocean
      [88.00, 8.00],    // Northward Bay of Bengal Corridor
      [87.80, 16.50],   // Upper Bay of Bengal
      [86.96, 20.82]    // Dhamra Deep Water Port
    ]
  },
  {
    id: 'route-aus-visakhapatnam',
    originPortId: 'port-hay-point',
    destinationPortId: 'port-visakhapatnam',
    distanceNauticalMiles: 5120,
    estimatedTransitDays: 15.2,
    regions: ['Coral Sea', 'Torres Strait', 'Indian Ocean', 'Bay of Bengal'],
    risks: ['Seasonal cyclones (Oct-Dec)', 'Outer anchorage congestion'],
    waypoints: [
      [149.30, -21.28], // Hay Point
      [152.50, -18.20],
      [148.00, -12.50],
      [142.20, -10.55], // Torres Strait
      [135.00, -9.50],
      [127.50, -10.20],
      [120.50, -8.60],
      [112.00, -9.80],
      [95.50, -1.00],
      [93.50, 6.00],    // Great Nicobar
      [87.50, 13.50],
      [83.22, 17.69]    // Visakhapatnam Port
    ]
  },
  {
    id: 'route-aus-gangavaram',
    originPortId: 'port-hay-point',
    destinationPortId: 'port-gangavaram',
    distanceNauticalMiles: 5110,
    estimatedTransitDays: 15.2,
    regions: ['Coral Sea', 'Torres Strait', 'Indian Ocean', 'Bay of Bengal'],
    risks: ['Deep laden Capesize approach corridor'],
    waypoints: [
      [149.30, -21.28],
      [152.50, -18.20],
      [142.20, -10.55],
      [127.50, -10.20],
      [112.00, -9.80],
      [95.50, -1.00],
      [93.50, 6.00],
      [87.20, 13.40],
      [83.24, 17.62]    // Gangavaram Deep Water Port
    ]
  },
  {
    id: 'route-aus-gopalpur',
    originPortId: 'port-hay-point',
    destinationPortId: 'port-gopalpur',
    distanceNauticalMiles: 5180,
    estimatedTransitDays: 15.4,
    regions: ['Coral Sea', 'Torres Strait', 'Bay of Bengal'],
    risks: ['Monsoon swells', 'Fairway draft monitoring'],
    waypoints: [
      [149.30, -21.28],
      [152.50, -18.20],
      [142.20, -10.55],
      [127.50, -10.20],
      [95.50, -1.00],
      [93.50, 6.00],
      [87.80, 15.00],
      [84.97, 19.30]    // Gopalpur Port
    ]
  },
  {
    id: 'route-aus-sagar',
    originPortId: 'port-hay-point',
    destinationPortId: 'port-sagar-sandheads',
    distanceNauticalMiles: 5260,
    estimatedTransitDays: 15.7,
    regions: ['Coral Sea', 'Torres Strait', 'Bay of Bengal / Sandheads'],
    risks: ['Estuary tidal currents', 'Deep lighterage transshipment'],
    waypoints: [
      [149.30, -21.28],
      [152.50, -18.20],
      [142.20, -10.55],
      [127.50, -10.20],
      [95.50, -1.00],
      [93.50, 6.00],
      [88.50, 17.50],
      [88.05, 21.65]    // Sagar-Sandheads Anchorage
    ]
  },
  {
    id: 'route-aus-haldia',
    originPortId: 'port-hay-point',
    destinationPortId: 'port-haldia',
    distanceNauticalMiles: 5290,
    estimatedTransitDays: 16.0,
    regions: ['Coral Sea', 'Torres Strait', 'Hooghly Estuary'],
    risks: ['Bore tides', 'Severe 8.5m draft restriction requiring Sandheads lightening'],
    waypoints: [
      [149.30, -21.28],
      [152.50, -18.20],
      [142.20, -10.55],
      [127.50, -10.20],
      [95.50, -1.00],
      [93.50, 6.00],
      [88.50, 17.50],
      [88.05, 21.65],   // Sandheads Pilot Boarding
      [88.10, 21.85],   // Hooghly River Channel
      [88.06, 22.02]    // Haldia Dock Complex
    ]
  },
  {
    id: 'route-singapore-rotterdam',
    originPortId: 'port-singapore',
    destinationPortId: 'port-rotterdam',
    distanceNauticalMiles: 8280,
    estimatedTransitDays: 21.0,
    regions: ['Malacca Strait', 'Indian Ocean', 'Suez Canal / Cape Route', 'English Channel'],
    risks: ['Red Sea security diversion (+10 days via Cape)', 'Suez transit slot scheduling', 'Bunker cost surge'],
    waypoints: [
      [103.85, 1.29],   // Singapore Port
      [100.50, 3.20],   // Malacca Strait Centerline
      [97.00, 5.50],    // Northwest Entrance Malacca Strait
      [80.00, 6.20],    // South of Sri Lanka
      [68.00, 8.50],    // Central Arabian Sea
      [54.00, 12.00],   // Gulf of Aden Outer Approach
      [43.33, 12.60],   // Bab-el-Mandeb Chokepoint
      [41.00, 16.00],   // Southern Red Sea Navigation Channel
      [36.00, 24.50],   // Central Red Sea
      [33.50, 28.00],   // Gulf of Suez
      [32.34, 30.58],   // Suez Canal Chokepoint
      [31.50, 32.50],   // Port Said Mediterranean Exit
      [24.00, 34.50],   // Ionian / Mediterranean Deep Water Lane
      [10.00, 37.20],   // Strait of Sicily
      [-5.50, 36.00],   // Strait of Gibraltar
      [-9.50, 43.00],   // Cape Finisterre (Biscay Passage)
      [-5.00, 48.50],   // English Channel Western Approach
      [-0.50, 50.20],   // Dover Strait Traffic Separation Scheme
      [4.48, 51.92]     // Rotterdam Port
    ]
  },
  {
    id: 'route-sa-mumbai',
    originPortId: 'port-richards-bay',
    destinationPortId: 'port-mumbai',
    distanceNauticalMiles: 4350,
    estimatedTransitDays: 13.2,
    regions: ['Mozambique Channel', 'Western Indian Ocean', 'Arabian Sea'],
    risks: ['Southwest monsoon headwinds', 'Piracy high-risk area transit protocol'],
    waypoints: [
      [32.04, -28.80],  // Richards Bay
      [36.50, -24.00],  // South Africa Coastal Lane
      [40.50, -17.00],  // Mozambique Channel Central Deep Water
      [46.00, -10.00],  // Comoros / North Madagascar Exit
      [55.00, -1.00],   // Western Indian Ocean
      [64.00, 8.00],    // Central Arabian Sea
      [71.00, 16.50],   // Mumbai High Offshore Zone
      [72.84, 18.95]    // Mumbai (JNPT)
    ]
  },
  {
    id: 'route-mumbai-rotterdam',
    originPortId: 'port-mumbai',
    destinationPortId: 'port-rotterdam',
    distanceNauticalMiles: 6300,
    estimatedTransitDays: 19.5,
    regions: ['Arabian Sea', 'Gulf of Aden', 'Red Sea', 'Suez Canal', 'Mediterranean Sea'],
    risks: ['Geopolitical tension in Red Sea', 'Suez Canal transit surcharge delays'],
    waypoints: [
      [72.84, 18.95],   // Mumbai (JNPT)
      [65.00, 16.00],   // Arabian Sea Crossing
      [54.00, 13.00],   // Gulf of Aden
      [43.33, 12.60],   // Bab-el-Mandeb
      [38.00, 20.00],   // Red Sea
      [32.34, 30.58],   // Suez Canal
      [24.00, 34.50],   // Mediterranean
      [-5.50, 36.00],   // Gibraltar
      [-9.50, 43.00],   // Bay of Biscay
      [0.00, 50.50],    // English Channel
      [4.48, 51.92]     // Rotterdam
    ]
  },
  {
    id: 'route-singapore-paradip',
    originPortId: 'port-singapore',
    destinationPortId: 'port-paradip',
    distanceNauticalMiles: 1650,
    estimatedTransitDays: 5.2,
    regions: ['Malacca Strait', 'Andaman Sea', 'Bay of Bengal'],
    risks: ['High vessel traffic density in Malacca'],
    waypoints: [
      [103.85, 1.29],   // Singapore
      [100.50, 3.20],   // Malacca Strait
      [97.00, 5.50],    // Malacca Exit
      [93.00, 8.50],    // Andaman Sea
      [89.00, 14.50],   // Central Bay of Bengal
      [86.67, 20.26]    // Paradip
    ]
  }
];
