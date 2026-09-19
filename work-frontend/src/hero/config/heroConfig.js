/**
 * NAVIC Hero Experience Configuration
 * Centralizes model paths, camera settings, lighting, and animation defaults.
 */
export const HERO_CONFIG = {
  // Model paths and initial transform configurations
  models: {
    earth: {
      textures: {
        day: '/textures/earth/earth_day_2048.jpg',
        specular: '/textures/earth/earth_specular_2048.jpg',
        normal: '/textures/earth/earth_normal_2048.jpg',
        clouds: '/textures/earth/earth_clouds_2048.png',
        night: '/textures/earth/earth_lights_2048.png'
      }
    },
    ship: {
      path: '/models/bulk-carrier.glb',
      fallbackPath: '/models/ship.glb',
      scale: 0.08
    }
  },

  // Camera settings
  camera: {
    fov: 42,
    near: 0.05,
    far: 200,
    initialPosition: [0, 6.0, 1.2]
  },

  // Realistic Physical Celestial Lighting
  lighting: {
    sun: {
      position: [-14, 10, 18],
      intensity: 2.8,
      color: '#ffffff'
    },
    ambient: {
      intensity: 0.22,
      color: '#07152b'
    },
    rim: {
      position: [16, -8, -12],
      intensity: 0.65,
      color: '#38bdf8'
    }
  },

  // Pacing calibration (total ~8.0s)
  timeline: {
    totalDuration: 8.0,
    oceanStart: 0.0,
    shipIngress: 0.13,   // ~1.0s
    routeStart: 0.38,    // ~3.0s
    cameraPullback: 0.52,// ~4.2s
    globalNetwork: 0.75, // ~6.0s
    brandReveal: 0.90    // ~7.2s
  }
};
