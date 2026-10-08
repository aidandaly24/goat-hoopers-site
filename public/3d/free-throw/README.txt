GOAT HOOPERS — GAME INTEGRATION ASSETS

Contents
GOAT_HOOPERS_Basketball.glb — original textured basketball, 3,968 triangles, one PBR material, three embedded maps.
GOAT_HOOPERS_Court.glb — court, 576 triangles, one PBR material, three embedded maps.
GOAT_HOOPERS_Hoop.glb — one hoop, 3,866 triangles, two materials, with transparent backboard and named anchors.
ASSET_MANIFEST.json — exact court dimensions, rim/backboard/ground collision coordinates and full-court placements.

Integration
All GLBs are self-contained standard glTF 2.0. No decoder extensions or separate texture downloads are required. Preserve imported materials and use PBR lighting; an unlit replacement hides the basketball leather detail. Keep the backboard's alpha transparency.
The files are the completed, QA-checked exports, not regenerated versions. Copy them into the existing game asset location in ~/workplace/goat-hoopers-site and update the existing adapter URLs to the exact filenames above. Keep the existing game implementation and coordinate adapter; do not rebuild the application from this package.

Coordinate contract
Units are meters. glTF +Y is up. Basketball origin is its center, nominal radius 0.12 m, logo facing +Z.
Court center is (0,0,0), width 15.24 along X, length 28.65 along Z, playing surface Y=0.
Standalone hoop faces +Z. RimCenter is (0,3.048,0), marking the ring top/scoring plane. Rim inner radius is 0.2286 m, tube radius 0.01 m, torus major radius 0.2386 m and tube center Y=3.038 m.
Backboard front center is (0,3.2766,-0.381), facing +Z. Box collider center is (0,3.2766,-0.401), half extents (0.9144,0.5334,0.02).
Near hoop root: (0,0,-12.7248), Y rotation 0. Far hoop root: (0,0,+12.7248), Y rotation pi. Free-throw line Z coordinates are -8.5338 and +8.5338.
Use ASSET_MANIFEST.json as the machine-readable source of truth. Collision shapes and scoring logic belong to the game; no physics engine is embedded in these models.

All geometry and texture pixels are original generated assets. No secrets, credentials, account data, source Blender scenes or third-party models are included.
