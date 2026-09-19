import * as THREE from 'three';

/**
 * Coordinate utility for spherical planetary navigation
 * Radius R = 5.0 centered at (0, 0, 0)
 */
export const GLOBE_RADIUS = 5.0;

/**
 * Convert Latitude and Longitude to Vector3 on the Globe
 */
export function latLonToGlobe(lat, lon, altitude = 0, radius = GLOBE_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const r = radius + altitude;

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Great-circle / spherical interpolation between two Lat/Lon points
 */
export function createSphericalArc(latLonPoints, radius = GLOBE_RADIUS, altitude = 0.015, pointsPerSegment = 24) {
  const sphericalPoints = [];

  for (let i = 0; i < latLonPoints.length - 1; i++) {
    const p1 = latLonPoints[i];
    const p2 = latLonPoints[i + 1];

    const v1 = latLonToGlobe(p1.lat, p1.lon, altitude, radius);
    const v2 = latLonToGlobe(p2.lat, p2.lon, altitude, radius);

    for (let j = 0; j < pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      // Slerp interpolation on sphere
      const v = new THREE.Vector3().copy(v1).lerp(v2, t).normalize().multiplyScalar(radius + altitude);
      sphericalPoints.push(v);
    }
  }

  const last = latLonPoints[latLonPoints.length - 1];
  sphericalPoints.push(latLonToGlobe(last.lat, last.lon, altitude, radius));
  return sphericalPoints;
}

/**
 * 1. The Original Anchor Maritime Route (followed by the bulk carrier)
 */
export const ANCHOR_MARITIME_ROUTE = [
  { lat: 14.0, lon: -28.0 },  // Mid-Atlantic entry
  { lat: 10.5, lon: -24.0 },  // Nav waypoint 1
  { lat: 6.0, lon: -19.5 },   // Nav waypoint 2
  { lat: 1.0, lon: -15.0 },   // Nav waypoint 3
  { lat: -4.5, lon: -11.0 }   // Nav waypoint 4
];

export function getMaritimeGlobeCurve(radius = GLOBE_RADIUS, altitude = 0.012) {
  const points = ANCHOR_MARITIME_ROUTE.map((wp) =>
    latLonToGlobe(wp.lat, wp.lon, altitude, radius)
  );
  return new THREE.CatmullRomCurve3(points);
}

/**
 * 2. Curated Global Maritime Corridors
 * Grouped into 3 progressive reveal tiers for authentic global expansion:
 */
export const GLOBAL_MARITIME_NETWORK = [
  // TIER 1: Direct extensions from the anchor route (Atlantic & Europe)
  {
    id: 'atlantic_south_extension',
    tier: 1,
    name: 'Mid-Atlantic to Cape of Good Hope',
    points: [
      { lat: -4.5, lon: -11.0 },
      { lat: -16.0, lon: -2.0 },
      { lat: -27.0, lon: 8.0 },
      { lat: -34.5, lon: 18.5 }
    ]
  },
  {
    id: 'atlantic_north_extension',
    tier: 1,
    name: 'Mid-Atlantic to English Channel & Rotterdam',
    points: [
      { lat: 14.0, lon: -28.0 },
      { lat: 28.0, lon: -22.0 },
      { lat: 42.0, lon: -14.0 },
      { lat: 49.5, lon: -5.0 },
      { lat: 51.9, lon: 4.5 }
    ]
  },
  {
    id: 'north_atlantic_trunk',
    tier: 1,
    name: 'US East Coast to Northern Europe',
    points: [
      { lat: 38.0, lon: -74.0 },
      { lat: 43.0, lon: -50.0 },
      { lat: 48.0, lon: -25.0 },
      { lat: 50.5, lon: -5.0 }
    ]
  },
  {
    id: 'us_gulf_gibraltar',
    tier: 1,
    name: 'US Gulf / Caribbean to Gibraltar',
    points: [
      { lat: 26.0, lon: -86.0 },
      { lat: 24.0, lon: -65.0 },
      { lat: 31.0, lon: -35.0 },
      { lat: 36.1, lon: -5.3 }
    ]
  },

  // TIER 2: Mediterranean, Suez Chokepoint & Middle East / Indian Ocean
  {
    id: 'mediterranean_suez',
    tier: 2,
    name: 'Gibraltar to Suez Canal',
    points: [
      { lat: 36.1, lon: -5.3 },
      { lat: 37.5, lon: 10.0 },
      { lat: 34.5, lon: 23.0 },
      { lat: 31.3, lon: 32.3 }
    ]
  },
  {
    id: 'suez_red_sea_arabian',
    tier: 2,
    name: 'Suez to Arabian Sea & India',
    points: [
      { lat: 31.3, lon: 32.3 },
      { lat: 24.0, lon: 37.0 },
      { lat: 12.6, lon: 43.5 },
      { lat: 12.0, lon: 54.0 },
      { lat: 19.0, lon: 68.0 },
      { lat: 22.8, lon: 69.7 } // Mundra Port
    ]
  },
  {
    id: 'persian_gulf_india',
    tier: 2,
    name: 'Persian Gulf to India / Asia',
    points: [
      { lat: 27.0, lon: 51.0 },
      { lat: 26.5, lon: 56.5 },
      { lat: 23.0, lon: 61.0 },
      { lat: 18.0, lon: 70.0 }
    ]
  },
  {
    id: 'cape_to_singapore',
    tier: 2,
    name: 'Cape of Good Hope to Malacca Strait',
    points: [
      { lat: -34.5, lon: 18.5 },
      { lat: -25.0, lon: 55.0 },
      { lat: -10.0, lon: 80.0 },
      { lat: 1.3, lon: 103.8 } // Singapore
    ]
  },

  // TIER 3: Asia-Pacific, Australia & East Asian corridors
  {
    id: 'india_to_singapore',
    tier: 3,
    name: 'India East Coast to Singapore',
    points: [
      { lat: 13.0, lon: 80.3 },
      { lat: 7.0, lon: 90.0 },
      { lat: 1.3, lon: 103.8 }
    ]
  },
  {
    id: 'australia_to_singapore',
    tier: 3,
    name: 'Western Australia to Singapore (Dry Bulk)',
    points: [
      { lat: -20.3, lon: 118.5 }, // Port Hedland
      { lat: -12.0, lon: 110.0 },
      { lat: -5.8, lon: 106.0 }, // Sunda Strait
      { lat: 1.3, lon: 103.8 }
    ]
  },
  {
    id: 'australia_to_east_asia',
    tier: 3,
    name: 'Australia to China & Japan (Iron Ore / Coal)',
    points: [
      { lat: -20.3, lon: 118.5 },
      { lat: -5.0, lon: 125.0 },
      { lat: 15.0, lon: 128.0 },
      { lat: 31.2, lon: 121.5 }, // Shanghai
      { lat: 35.6, lon: 139.7 }  // Tokyo
    ]
  },
  {
    id: 'singapore_to_china_japan',
    tier: 3,
    name: 'Singapore to Hong Kong, Shanghai & Tokyo',
    points: [
      { lat: 1.3, lon: 103.8 },
      { lat: 11.0, lon: 111.0 },
      { lat: 22.3, lon: 114.2 }, // Hong Kong
      { lat: 31.2, lon: 121.5 }, // Shanghai
      { lat: 35.6, lon: 139.7 }  // Tokyo
    ]
  }
];
