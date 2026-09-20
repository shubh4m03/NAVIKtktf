// ─────────────────────────────────────────────────────────────
// components/route-intelligence/MaritimeGlobe.tsx
// Professional 3D Maritime Globe powered by MapLibre GL JS
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, RotateCw, Globe, Layers, Navigation, ZoomIn, ZoomOut, Anchor, ShieldAlert, Ship, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PortInfo, RouteInfo } from '../../types';
import { MARITIME_CHOKEPOINTS, ChokepointInfo } from './chokepointsData';
import { DEMO_VESSEL_POSITIONS, DemoVesselPosition } from './vesselPositionsData';
export interface MaritimeGlobeProps {
  ports: PortInfo[];
  selectedPortId: string;
  onSelectPort: (port: PortInfo) => void;
  activeRoute: RouteInfo;
  chokepoints: ChokepointInfo[];
  onSelectChokepoint?: (chokepoint: ChokepointInfo) => void;
  onSelectVessel?: (vessel: DemoVesselPosition) => void;
}

const createBaseStyle = (isLight: boolean): maplibregl.StyleSpecification => ({
  version: 8,
  sources: {
    'base-map': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': isLight ? '#dbeafe' : '#071827',
      },
    },
    {
      id: 'base-map',
      type: 'raster',
      source: 'base-map',
      paint: {
        'raster-brightness-min': isLight ? 0 : 0.05,
        'raster-brightness-max': isLight ? 1 : 0.75,
        'raster-saturation': 0,
      },
    },
  ],
});

export const MaritimeGlobe: React.FC<MaritimeGlobeProps> = ({
  ports,
  selectedPortId,
  onSelectPort,
  activeRoute,
  chokepoints,
  onSelectChokepoint,
  onSelectVessel,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const [isGlobeProjection, setIsGlobeProjection] = useState<boolean>(true);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Initialize MapLibre GL JS Map instance
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: createBaseStyle(isLight),
      center: [80.0, 12.0], // Centered on Indo-Pacific maritime corridor
      zoom: 2.1,
      minZoom: 1.2,
      maxZoom: 15,
      pitch: 18,
      attributionControl: false,
    });

    mapRef.current = map;

    // Apply Globe Projection
    map.on('style.load', () => {
      if (isGlobeProjection) {
        map.setProjection({ type: 'globe' });
      }

      // Add Sources and Layers
      setupMaritimeLayers(map);
      updateRouteLayer(map, activeRoute);
      updatePortsLayer(map, ports, selectedPortId);
      updateChokepointsLayer(map, chokepoints);
      updateVesselsLayer(map);
    });

    // Cursor pointer on interactive elements
    const interactiveLayers = ['ports-layer', 'chokepoints-layer', 'vessels-layer'];
    interactiveLayers.forEach((layerId) => {
      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });
    });

    // Click handler for Ports
    map.on('click', 'ports-layer', (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature || !feature.properties) return;
      const portId = feature.properties.id;
      const foundPort = ports.find((p) => p.id === portId);
      if (foundPort) {
        onSelectPort(foundPort);
        map.flyTo({ center: [foundPort.lng || 80, foundPort.lat || 12], zoom: Math.max(map.getZoom(), 4.5), duration: 1200 });
      }
    });

    // Click handler for Chokepoints
    map.on('click', 'chokepoints-layer', (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature || !feature.properties) return;
      const chokepointId = feature.properties.id;
      const foundCp = chokepoints.find((c) => c.id === chokepointId);
      if (foundCp && onSelectChokepoint) {
        onSelectChokepoint(foundCp);
        map.flyTo({ center: [foundCp.lng, foundCp.lat], zoom: Math.max(map.getZoom(), 5.0), duration: 1200 });
      }
    });

    // Click handler for Demo Vessels
    map.on('click', 'vessels-layer', (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature || !feature.properties) return;
      const vesselId = feature.properties.id;
      const foundV = DEMO_VESSEL_POSITIONS.find((v) => v.id === vesselId);
      if (foundV && onSelectVessel) {
        onSelectVessel(foundV);
        map.flyTo({ center: [foundV.lng, foundV.lat], zoom: Math.max(map.getZoom(), 5.2), duration: 1200 });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isLight]);

  // Setup Maritime Layers on MapLibre Style
  const setupMaritimeLayers = (map: maplibregl.Map) => {
    // 1. ROUTE SOURCE & LAYERS
    if (!map.getSource('maritime-route-source')) {
      map.addSource('maritime-route-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Wide Glow Outer Line
      map.addLayer({
        id: 'route-glow-layer',
        type: 'line',
        source: 'maritime-route-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': isLight ? '#0b628c' : '#20b7d7',
          'line-width': 7,
          'line-opacity': 0.28,
        },
      });

      // Core Solid Maritime Corridors Line
      map.addLayer({
        id: 'route-core-layer',
        type: 'line',
        source: 'maritime-route-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': isLight ? '#0b628c' : '#38bdf8',
          'line-width': 2.5,
          'line-opacity': 0.95,
        },
      });

      // Animated Dash Track
      map.addLayer({
        id: 'route-dash-layer',
        type: 'line',
        source: 'maritime-route-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.5,
          'line-dasharray': [1, 3],
          'line-opacity': 0.75,
        },
      });
    }

    // 2. PORTS SOURCE & LAYERS
    if (!map.getSource('ports-source')) {
      map.addSource('ports-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Outer Selection Ring
      map.addLayer({
        id: 'ports-ring-layer',
        type: 'circle',
        source: 'ports-source',
        paint: {
          'circle-radius': ['case', ['get', 'isSelected'], 10, 6],
          'circle-color': 'transparent',
          'circle-stroke-width': ['case', ['get', 'isSelected'], 2.5, 1],
          'circle-stroke-color': ['case', ['get', 'isSelected'], '#06b6d4', isLight ? '#0b628c' : '#38bdf8'],
          'circle-stroke-opacity': ['case', ['get', 'isSelected'], 0.9, 0.5],
        },
      });

      // Inner Solid Port Marker
      map.addLayer({
        id: 'ports-layer',
        type: 'circle',
        source: 'ports-source',
        paint: {
          'circle-radius': ['case', ['get', 'isSelected'], 5.5, 3.5],
          'circle-color': ['case', ['get', 'isSelected'], '#00e5ff', isLight ? '#0284c7' : '#14b8a6'],
          'circle-opacity': 1.0,
        },
      });

      // Port Name Labels
      map.addLayer({
        id: 'ports-labels-layer',
        type: 'symbol',
        source: 'ports-source',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 1.35],
          'text-anchor': 'top',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': isLight ? '#0f172a' : '#f1f5f9',
          'text-halo-color': isLight ? '#ffffff' : '#071827',
          'text-halo-width': 1.8,
        },
      });
    }

    // 3. CHOKEPOINTS SOURCE & LAYERS
    if (!map.getSource('chokepoints-source')) {
      map.addSource('chokepoints-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'chokepoints-layer',
        type: 'circle',
        source: 'chokepoints-source',
        paint: {
          'circle-radius': 5.5,
          'circle-color': '#f59e0b', // Commercial amber alert
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      map.addLayer({
        id: 'chokepoints-label-layer',
        type: 'symbol',
        source: 'chokepoints-source',
        layout: {
          'text-field': ['concat', '▲ ', ['get', 'name']],
          'text-size': 10,
          'text-offset': [0, -1.4],
          'text-anchor': 'bottom',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': isLight ? '#b45309' : '#fbbf24',
          'text-halo-color': isLight ? '#ffffff' : '#071827',
          'text-halo-width': 1.8,
        },
      });
    }

    // 4. DEMO VESSELS SOURCE & LAYERS
    if (!map.getSource('vessels-source')) {
      map.addSource('vessels-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'vessels-layer',
        type: 'circle',
        source: 'vessels-source',
        paint: {
          'circle-radius': 5,
          'circle-color': '#10b981', // Commercial vessel green
          'circle-stroke-width': 1.8,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'vessels-label-layer',
        type: 'symbol',
        source: 'vessels-source',
        layout: {
          'text-field': ['concat', '🚢 ', ['get', 'vesselName'], '\n(DEMO VESSEL POSITION)'],
          'text-size': 9.5,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': isLight ? '#047857' : '#34d399',
          'text-halo-color': isLight ? '#ffffff' : '#071827',
          'text-halo-width': 1.6,
        },
      });
    }
  };

  // Update Route GeoJSON Source
  const updateRouteLayer = (map: maplibregl.Map, route: RouteInfo) => {
    const source = map.getSource('maritime-route-source') as maplibregl.GeoJSONSource | undefined;
    if (!source || !route.waypoints || route.waypoints.length === 0) return;

    source.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            id: route.id,
            distance: route.distanceNauticalMiles,
          },
          geometry: {
            type: 'LineString',
            coordinates: route.waypoints,
          },
        },
      ],
    });
  };

  // Update Ports GeoJSON Source
  const updatePortsLayer = (map: maplibregl.Map, portList: PortInfo[], selectedId: string) => {
    const source = map.getSource('ports-source') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const features = portList.map((port) => ({
      type: 'Feature' as const,
      properties: {
        id: port.id,
        name: port.name,
        country: port.country,
        region: port.region,
        maxDraftMeters: port.maxDraftMeters,
        congestionIndex: port.congestionIndex,
        isSelected: port.id === selectedId,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [port.lng || 0, port.lat || 0],
      },
    }));

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  };

  // Update Chokepoints Source
  const updateChokepointsLayer = (map: maplibregl.Map, currentChokepoints: ChokepointInfo[]) => {
    const source = map.getSource('chokepoints-source') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const features = currentChokepoints.map((cp) => ({
      type: 'Feature' as const,
      properties: {
        id: cp.id,
        name: cp.name,
        traffic: cp.trafficVolume,
        risk: cp.primaryRisk,
        status: cp.operationalStatus,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [cp.lng, cp.lat],
      },
    }));

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  };

  // Update Demo Vessels Source
  const updateVesselsLayer = (map: maplibregl.Map) => {
    const source = map.getSource('vessels-source') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const features = DEMO_VESSEL_POSITIONS.map((v) => ({
      type: 'Feature' as const,
      properties: {
        id: v.id,
        vesselName: v.vesselName,
        vesselClass: v.vesselClass,
        speed: v.speedKnots,
        heading: v.headingDegrees,
        cargo: v.cargo,
        sourceLabel: v.dataSourceLabel,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [v.lng, v.lat],
      },
    }));

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  };

  // Whenever activeRoute changes, update the route line and automatically frame the voyage
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    updateRouteLayer(map, activeRoute);

    if (activeRoute.waypoints && activeRoute.waypoints.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      activeRoute.waypoints.forEach(([lng, lat]) => bounds.extend([lng, lat]));

      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 70, left: 90, right: 90 },
        duration: 1800,
        maxZoom: 5.5,
      });
    }
  }, [activeRoute]);

  // Whenever selectedPortId changes, update port highlighting
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    updatePortsLayer(map, ports, selectedPortId);
  }, [selectedPortId, ports]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    updateChokepointsLayer(map, chokepoints);
  }, [chokepoints]);

  // Handle Projection Toggle (Globe 3D vs Mercator 2D)
  const handleToggleProjection = () => {
    const map = mapRef.current;
    if (!map) return;
    const nextGlobe = !isGlobeProjection;
    setIsGlobeProjection(nextGlobe);
    map.setProjection({ type: nextGlobe ? 'globe' : 'mercator' });
  };

  // Reset View to Central Indo-Pacific Maritime Corridor
  const handleResetMaritimeView = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [80.0, 12.0],
      zoom: 2.1,
      pitch: 18,
      bearing: 0,
      duration: 1400,
    });
  };

  // Auto-Spin Animation Loop
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isSpinning) return;

    let animId: number;
    const spin = () => {
      if (!isSpinning || !map) return;
      const center = map.getCenter();
      center.lng = (center.lng + 0.03) % 360;
      map.setCenter(center);
      animId = requestAnimationFrame(spin);
    };
    animId = requestAnimationFrame(spin);

    return () => cancelAnimationFrame(animId);
  }, [isSpinning]);

  return (
    <div className="relative w-full h-full min-h-[460px] overflow-hidden rounded bg-background-raised border border-border-subtle select-none">
      {/* MapLibre GL WebGL Viewport Container */}
      <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Oceanic Telemetry HUD */}
      <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none bg-surface/90 backdrop-blur-sm border border-border-subtle px-3.5 py-2.5 rounded shadow-subtle max-w-xs font-mono">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-brand-primary" />
          <h3 className="text-xs font-bold text-ink tracking-wider uppercase">
            {isGlobeProjection ? '3D MARITIME GLOBE' : 'MERCATOR CHART'}
          </h3>
        </div>
        <p className="text-[10px] text-ink-secondary mb-2">
          Real Geographic Corridors · Hydrographic Ports &amp; Chokepoints
        </p>

        <div className="flex items-center gap-3 text-[11px]">
          <div>
            <span className="text-ink-secondary block text-[9px] uppercase tracking-wider">Active Sea Lane</span>
            <span className="text-brand-primary font-semibold truncate block max-w-[170px]">
              {activeRoute.originPortId.replace('port-', '')} → {activeRoute.destinationPortId.replace('port-', '')}
            </span>
          </div>
          <div className="border-l border-border-subtle pl-3">
            <span className="text-ink-secondary block text-[9px] uppercase tracking-wider">Distance</span>
            <span className="text-ink font-semibold">{activeRoute.distanceNauticalMiles.toLocaleString()} NM</span>
          </div>
        </div>
      </div>

      {/* Top Right: Projection Switcher & Controls */}
      <div className="absolute top-3.5 right-3.5 z-10 flex flex-col gap-1.5 font-mono text-[11px]">
        <button
          onClick={handleToggleProjection}
          title={isGlobeProjection ? 'Switch to Mercator 2D Projection' : 'Switch to 3D Globe Projection'}
          className={`px-2.5 py-1.5 rounded border flex items-center justify-between gap-2 transition-colors shadow-subtle ${
            isGlobeProjection
              ? 'bg-brand-primary text-white border-brand-primary'
              : 'bg-surface/90 border-border-subtle text-ink-secondary hover:text-ink'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{isGlobeProjection ? 'GLOBE 3D' : 'MERCATOR'}</span>
        </button>

        <button
          onClick={() => setIsSpinning(!isSpinning)}
          title="Toggle Slow Equatorial Rotation"
          className={`px-2.5 py-1.5 rounded border flex items-center justify-between gap-2 transition-colors shadow-subtle ${
            isSpinning
              ? 'bg-brand-primary text-white border-brand-primary'
              : 'bg-surface/90 border-border-subtle text-ink-secondary hover:text-ink'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
          <span>SPIN</span>
        </button>

        <button
          onClick={handleResetMaritimeView}
          title="Reset to Indo-Pacific View"
          className="px-2.5 py-1.5 rounded border bg-surface/90 border-border-subtle text-ink-secondary hover:text-ink hover:bg-surface-elevated transition-colors shadow-subtle flex items-center justify-between gap-2"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>INDO-PACIFIC</span>
        </button>
      </div>

      {/* Bottom Floating Legend & Vessel Telemetry Disclaimer */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Maritime Legend */}
        <div className="pointer-events-auto bg-surface/90 backdrop-blur-sm border border-border-subtle px-3 py-1.5 rounded shadow-subtle flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block border border-white" />
            <span className="text-ink-secondary">Port</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-white" />
            <span className="text-ink-secondary">Chokepoint</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-white" />
            <span className="text-ink-secondary">Vessel Position</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1 bg-brand-primary inline-block rounded" />
            <span className="text-ink font-semibold">Geodesic Route</span>
          </div>
        </div>

        {/* Demo Data Disclaimer Badge */}
        <div className="pointer-events-auto bg-surface/95 backdrop-blur-sm border border-border-subtle px-3 py-1.5 rounded shadow-subtle flex items-center gap-1.5 text-[10px] font-mono text-ink-muted">
          <Info className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
          <span>DEMO VESSEL POSITION · Simulated algorithmic tracking</span>
        </div>
      </div>
    </div>
  );
};
