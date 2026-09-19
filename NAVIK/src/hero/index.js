/**
 * NAVIC Hero Experience Module
 * 
 * Public API for importing into host applications
 */
export { HeroExperience, default } from './HeroExperience';
export { HeroCanvas } from './components/scene/HeroCanvas';
export { HeroScene } from './components/scene/HeroScene';
export { EarthModel, preloadEarthModel } from './components/models/EarthModel';
export { EarthGlobe } from './components/models/EarthGlobe';
export { ShipModel, preloadShipModel } from './components/models/ShipModel';
export { HERO_CONFIG } from './config/heroConfig';
export { useHeroTimeline } from './hooks/useHeroTimeline';
