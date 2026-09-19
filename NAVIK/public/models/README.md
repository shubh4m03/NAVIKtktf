# 3D Assets Directory for NAVIC Hero

Place your 3D assets in this directory:

1. **Earth Model**:
   - Default expected path: `/models/earth.glb` (or `.gltf`)
   - Configurable in: `src/hero/config/heroConfig.js` -> `HERO_CONFIG.models.earth.path`

2. **Bulk Cargo / Bulk Carrier Ship Model**:
   - Default expected path: `/models/ship.glb` (or `.gltf`)
   - Configurable in: `src/hero/config/heroConfig.js` -> `HERO_CONFIG.models.ship.path`

### Notes:
- Binary GLTF (`.glb`) is recommended for optimal performance and single-file bundling of textures and geometries.
- If assets are temporarily missing or being updated, the Hero experience provides an automatic wireframe fallback and status indicator without crashing the application.
