/**
 * Procedural High-Fidelity Earth Texture Generator
 * Creates realistic, NASA-inspired planetary maps locally using HTML Canvas.
 * Generates:
 * 1. Day Surface Texture (Continents, topography, vegetation, ocean bathymetry)
 * 2. Specular Map (High reflectance on oceans, matte continents)
 * 3. Cloud Map (Realistic atmospheric cyclone swirls & cloud bands)
 * 4. Night Lights Map (Illuminated major maritime ports & global transit hubs)
 */
import * as THREE from 'three';

// Major global maritime trading hubs & dry bulk ports (lat, lon, size)
const MARITIME_HUBS = [
  { name: 'Singapore', lat: 1.35, lon: 103.82, intensity: 1.0 },
  { name: 'Rotterdam', lat: 51.92, lon: 4.48, intensity: 1.0 },
  { name: 'Shanghai', lat: 31.23, lon: 121.47, intensity: 1.0 },
  { name: 'Ningbo-Zhoushan', lat: 29.87, lon: 121.54, intensity: 0.9 },
  { name: 'Port Hedland (Iron Ore)', lat: -20.31, lon: 118.58, intensity: 0.95 },
  { name: 'Tubarao (Brazil)', lat: -20.28, lon: -40.24, intensity: 0.85 },
  { name: 'Richards Bay (Coal)', lat: -28.78, lon: 32.04, intensity: 0.85 },
  { name: 'Houston (US Gulf)', lat: 29.76, lon: -95.37, intensity: 0.95 },
  { name: 'Panama Canal', lat: 8.98, lon: -79.52, intensity: 0.9 },
  { name: 'Suez Canal / Port Said', lat: 31.26, lon: 32.30, intensity: 0.9 },
  { name: 'Tokyo / Yokohama', lat: 35.68, lon: 139.69, intensity: 1.0 },
  { name: 'Mundra (India)', lat: 22.84, lon: 69.70, intensity: 0.85 },
  { name: 'New York / New Jersey', lat: 40.71, lon: -74.01, intensity: 0.95 },
  { name: 'Newcastle (Australia)', lat: -32.93, lon: 151.78, intensity: 0.85 },
  { name: 'Hamburg', lat: 53.55, lon: 9.99, intensity: 0.9 },
  { name: 'Santos (Brazil)', lat: -23.96, lon: -46.33, intensity: 0.85 },
  { name: 'Gibraltar Strait', lat: 36.14, lon: -5.35, intensity: 0.85 }
];

function latLonToCanvas(lat, lon, width, height) {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

/**
 * Generate high-resolution Day Earth Texture
 */
export function createEarthDayTexture(width = 2048, height = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Deep ocean gradient background
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#04142b'); // Arctic deep blue
  oceanGrad.addColorStop(0.2, '#07244a');
  oceanGrad.addColorStop(0.5, '#0a3268'); // Equatorial ocean
  oceanGrad.addColorStop(0.8, '#07244a');
  oceanGrad.addColorStop(1, '#04142b'); // Antarctic deep blue
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Continental Shelf & Bathymetric coastal glows
  ctx.strokeStyle = 'rgba(0, 180, 216, 0.22)';
  ctx.lineWidth = 14;
  drawContinents(ctx, width, height, true);

  // True Landmass base colors (realistic greens, arid browns, mountain ranges)
  ctx.fillStyle = '#1e3d2f'; // Deep temperate forest
  drawContinents(ctx, width, height, false);

  // Add terrain shading & vegetation gradients
  addTerrainShading(ctx, width, height);

  // Polar ice caps
  drawIceCaps(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Generate Specular Mask (High shine on oceans, matte on continents)
 */
export function createEarthSpecularTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Ocean is highly reflective white/cyan
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Continents are matte black (no specular reflection)
  ctx.fillStyle = '#080808';
  drawContinents(ctx, width, height, false);

  // Coastal shallows have medium reflectivity
  ctx.fillStyle = '#222222';
  drawIceCaps(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Generate Cloud & Atmospheric Cyclone Layer
 */
export function createEarthCloudTexture(width = 2048, height = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);

  // Intertropical Convergence Zone & mid-latitude weather bands
  for (let y = 0; y < height; y += 4) {
    const lat = 90 - (y / height) * 180;
    const bandDensity = Math.cos((lat * Math.PI) / 180);
    const alpha = (Math.sin(lat * 0.12) * 0.5 + 0.5) * Math.max(0, bandDensity) * 0.45;

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
    ctx.fillRect(0, y, width, 4);
  }

  // Draw realistic atmospheric swirls & cyclones
  const numSwirls = 48;
  for (let i = 0; i < numSwirls; i++) {
    const cx = ((i * 137.5) % 360 / 360) * width;
    const cy = (((i * 93.3) % 140 - 70) / 180 + 0.5) * height;
    const radius = 40 + (i % 7) * 20;

    const radGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
    radGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
    radGrad.addColorStop(0.8, 'rgba(240, 248, 255, 0.1)');
    radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i * 45 * Math.PI) / 180);
    ctx.scale(1.8, 0.6);
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Generate Night Lights & Maritime Port Terminals
 */
export function createEarthNightTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#010307';
  ctx.fillRect(0, 0, width, height);

  // Major global maritime hubs & trade nodes
  MARITIME_HUBS.forEach((hub) => {
    const { x, y } = latLonToCanvas(hub.lat, hub.lon, width, height);

    // Warm amber & cyan port illumination
    const radGrad = ctx.createRadialGradient(x, y, 1, x, y, 16);
    radGrad.addColorStop(0, `rgba(255, 210, 120, ${hub.intensity})`);
    radGrad.addColorStop(0.3, `rgba(255, 170, 60, ${hub.intensity * 0.7})`);
    radGrad.addColorStop(0.7, `rgba(0, 212, 255, ${hub.intensity * 0.3})`);
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Helper to draw realistic world landmass contours
 */
function drawContinents(ctx, w, h, strokeOnly = false) {
  ctx.beginPath();

  // Eurasia & Africa
  drawPolygon(ctx, [
    [-10, 36], [0, 45], [15, 55], [30, 70], [60, 72], [100, 75], [170, 65], [140, 50],
    [120, 32], [105, 10], [100, 1], [80, 8], [70, 24], [55, 25], [45, 12], [50, -15],
    [35, -34], [18, -34], [10, 5], [-17, 15], [-5, 36]
  ], w, h);

  // North America
  drawPolygon(ctx, [
    [-165, 65], [-140, 70], [-100, 70], [-60, 60], [-65, 45], [-75, 25], [-80, 25],
    [-90, 16], [-105, 22], [-120, 35], [-125, 50], [-165, 65]
  ], w, h);

  // South America
  drawPolygon(ctx, [
    [-80, 10], [-50, 0], [-35, -5], [-40, -22], [-55, -38], [-70, -55], [-75, -45],
    [-80, -10], [-80, 10]
  ], w, h);

  // Australia
  drawPolygon(ctx, [
    [114, -22], [130, -12], [145, -15], [152, -28], [148, -38], [135, -35], [115, -34], [114, -22]
  ], w, h);

  // Maritime Southeast Asia / Indonesia / Japan / UK
  drawPolygon(ctx, [[100, 5], [110, -5], [120, -8], [110, 0], [100, 5]], w, h);
  drawPolygon(ctx, [[130, 32], [142, 43], [140, 35], [130, 32]], w, h);
  drawPolygon(ctx, [[-5, 50], [2, 58], [-4, 58], [-5, 50]], w, h);

  if (strokeOnly) {
    ctx.stroke();
  } else {
    ctx.fill();
  }
}

function drawPolygon(ctx, points, w, h) {
  points.forEach(([lon, lat], index) => {
    const { x, y } = latLonToCanvas(lat, lon, w, h);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
}

function addTerrainShading(ctx, w, h) {
  // Arid Sahara / Arabian / Australian deserts
  const deserts = [
    { lat: 24, lon: 15, rx: w * 0.08, ry: h * 0.06 }, // Sahara
    { lat: 23, lon: 45, rx: w * 0.04, ry: h * 0.04 }, // Arabia
    { lat: -25, lon: 135, rx: w * 0.04, ry: h * 0.04 } // Outback
  ];

  deserts.forEach(({ lat, lon, rx, ry }) => {
    const { x, y } = latLonToCanvas(lat, lon, w, h);
    const desertGrad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    desertGrad.addColorStop(0, 'rgba(194, 154, 88, 0.7)');
    desertGrad.addColorStop(0.7, 'rgba(160, 120, 60, 0.3)');
    desertGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = desertGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawIceCaps(ctx, w, h) {
  // Arctic
  ctx.fillStyle = 'rgba(240, 248, 255, 0.85)';
  ctx.fillRect(0, 0, w, h * 0.08);

  // Antarctic
  ctx.fillRect(0, h * 0.9, w, h * 0.1);
}
