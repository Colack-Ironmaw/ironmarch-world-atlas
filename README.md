# Varelden Campaign Atlas

Interactive player atlas at https://colack-ironmaw.github.io/ironmarch-world-atlas/ . This repository now serves Varelden. The prior Ironmarch atlas remains in Git history at commit `6ef0c20e8372e3eb93677fdb65866ecac8d830c9`; its campaign records are not mixed into Varelden.

The default geographic background is the newly supplied Varelden HD Map, optimized at its native 3932 × 2614 dimensions. Original SHA-256: `c4b46b892584911d1ec889a52a966418d110ef6ba6652ba71ab57db1b0460c53`. WebP reduces transfer size without generating terrain, labels or settlements. The original remains unchanged on the user's computer. The political overlay has the identical canvas and real transparency; its pixels are preserved with lossless WebP compression.

## Use

Drag to pan, scroll or use +/− to zoom, and use Fit chart or the View menu to navigate. Search by place, region or political power. Click a marker or search result for evidence and placement confidence. Keyboard arrows pan the focused map; Home fits it. Bookmarks stay in this browser. Share links preserve the selected place and chart. Touch dragging and zoom buttons work on mobile.

The HD chart and older political reference retain independent coordinate frames. Political-reference pins follow printed stars, with an estimated ±4 pixel digitization tolerance. The HD image now supports the user's matching political overlay directly, with a separate on/off control and 0–100% opacity. Switching it does not move pins or change the view. It is not transferred from the older political chart. Source artwork labels remain part of the political layer.

Eight city/seat tokens on the HD chart are explicitly provisional proposals within the supplied political territories, guided by broad relative positions on the older chart. Their exact positions are not confirmed by the overlay. Each token carries low confidence and evidence explaining this limitation. HD regional anchors are also provisional. Dashed uncertainty circles are display guides, not surveyed boundaries or statistical estimates. Decorative buildings do not prove named city locations. City, village/town, watchtower and region token shapes are supported; tokens stay legible at a constant screen size while zooming and respond to mouse, touch and keyboard selection.

Wrenford and five local places are searchable but unpinned: Revision 05 leaves their exact placement unresolved. Their village, town, estate, watchtower and region classifications are retained for future reviewed placements. Three local travel relationships preserve source directions and day estimates without inventing road polylines, miles or kilometers. Known does not mean visited. No campaign time has been advanced.

## Files and maintenance

- `index.html`, `atlas.css`, `js/atlas.js`: reusable interface and engine.
- `data/maps.json`: artwork, coordinate frames, view bounds, scale status.
- `data/locations.json`: stable IDs, public descriptions, knowledge, provenance, placements.
- `data/routes.json`: stable endpoint IDs, status, source, optional map-specific polyline geometry.
- `data/factions.json`: nine mapped political powers; no invented territorial polygons.
- `data/history.json`: dated public changes; maintenance dates are separate from campaign dates.
- `assets/`: reviewed player-safe artwork only.

Run `node scripts/validate.cjs` before publishing. Preview through a local static HTTP server; module/JSON loading requires HTTP. GitHub Pages: deploy from `main`, root folder. No build step, keys, subscriptions, external fonts, analytics or mapping services are required.

## Publication rules

This public repository must contain only explicitly reviewed player-safe content. Keep source campaign volumes, full atlases, private registers and quest data outside this repository. A hidden control is not access protection. The local DM atlas remains separate. Do not add unknown destinations to public data or history, including old revisions.

Sources reviewed for the conversion: the exact uploaded Campaign Bible Volumes A–D Revision 05, Revision 05 canon audit, Expanded Cohabitation Manual Edition 05, Campaign Crafting Chat log, original HD artwork, political reference and existing offline atlas. Public geography is primarily sourced to Volume B B-C01/B-C02/B-C05/B-W01 and Volume D D-W02/D-C08. Audit and manual review governs private content handling; no private dossiers are reproduced here.

Update a location using its existing ID. Separate canon status, placement authority, and player knowledge. A corrected coordinate does not constitute a discovery. Add public dated changes only when established through play. Routes may acquire geometry only in an identified image frame with supporting evidence. Do not derive surveyed distances from decorative scales. Review artwork itself for printed disclosures before publishing.

GitHub changes happen during an active authorized update; browser changes do not write to GitHub and there is no continuous synchronization.
