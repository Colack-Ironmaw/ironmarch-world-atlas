# Varelden Campaign Atlas

Live atlas: https://colack-ironmaw.github.io/ironmarch-world-atlas/

The native 3932 x 2614 HD background uses the user-supplied Political Borders Overlay v2. Borders toggle independently, with 0-100% opacity. The older political reference chart and its asset have been removed from the current release. Public location IDs and provisional HD positions are preserved; earlier releases remain in Git history.

## Coordinates and distance

Coordinates use the original HD image: origin at top left, X increases right/east and Y down/south. Placement retains fractional coordinates; cursor and party readouts display three decimal places plus normalized coordinates. SVG transforms account for zoom, pan and responsive layout. Fractional pixel precision is image precision, not surveyed geographic accuracy.

Select Measure distance / path and click two or more points. The ruler sums Euclidean lengths along the chosen segments. Undo point and Clear ruler edit the path. Uncalibrated results use source pixels. To calibrate, measure a reference with a known separation, enter its positive distance, unit and source/assumption, then choose Use measured reference. Results then include kilometres and miles (1 mile = 1.609344 km). Clear calibration removes that scale.

One planar scale cannot infer projection distortion, elevation, road curvature or travel time from an illustrated map. No mileage is assumed automatically. Calibrations are personal browser data and do not establish published canon.

## Party and personal markers

Select Place party and click the map. In Pan mode, drag the party star to move it. Its coordinates persist. Selecting a published place displays its straight-line distance from the party. Selecting a personal marker reports its distance in the editor.

Fill in marker name, icon, nation/region, quests/connections and notes/services, then choose Create, then click map. Icon options include cities, towns, villages, forts, camps, quests, ruins, dungeons, treasure, ports, temples and danger. Drag personal markers in Pan mode, use Move selected, or enter coordinates. Lock position blocks dragging, numerical movement and point relocation until unlocked and saved. Metadata remains editable while locked.

To adjust a published location personally, select it and choose Edit personal copy of selected atlas place. The copy starts locked and replaces the visible published pin in this browser. Its edits do not change public canon. Delete the copy to restore the published pin.

Transparent icons create no map symbol, label, clickable target or public-map search entry. They remain in the personal editor and JSON backup. This is visual hiding, not access protection against someone using this browser or reading a backup. Review backups before sharing. Personal data is never automatically published.

## Saving and backups

### Travel paths

Open **Travel paths** inside the personal tools. Choose **New path**, name it, select Road, Trail / track, River boat passage, Barge route, Ferry crossing or Shipping lane, and click successive points along the map. Choose **Save path** when finished. All paths are personal HD-map records; drawing a route does not establish its geography or advance campaign time.

Select a saved path and choose **Edit selected path** to change its details or shape. **Draw / extend** appends points, **Move points** lets you drag handles, and **Insert bend** inserts a point near the clicked segment. The point selector and X/Y fields allow exact adjustment. Remove a point, undo shape changes, reverse a path, or discard the draft. Shape locks protect geometry while allowing notes and other details to be edited. One-way routes show arrows from the first point toward the last; reversing swaps the named endpoints too. Changes take effect when you save the path.

Record endpoints, source, authority and conditions in the editor. Paths start as Proposed; confirmation is an explicit user choice. Route length sums the drawn segments, using the existing personal calibration when present and source pixels otherwise. It does not calculate travel times, river flow or navigability. Use the visibility checkbox to hide personal paths.

Saved routes use the optional `travelPaths` array in the version 1 personal backup. Existing backups without that field still restore exactly. New exports include saved paths together with markers, boundaries, party and scale. Save or discard a path draft before exporting. Restore replaces all personal data, including routes; export your current browser save first. Personal paths are never automatically published.

Party position, personal markers and calibration save in local browser storage for this site. They do not sync to GitHub, another browser or device. Export personal backup creates a portable JSON file. Restore backup validates and replaces personal data; export first if you want to preserve the current state. Storage failures are reported and export remains available. Ruler points are temporary. Location bookmarks remain separate.

## Architecture and maintenance

js/atlas.js renders reviewed geography; js/tools.js handles personal editing and measurement. Separate data/maps.json, locations.json, routes.json, factions.json and history.json hold public records. The local DM atlas and full campaign files stay outside this repository.

Eight city pins and six regional anchors remain provisional. Wrenford and five local places are still unpinned pending geographic review. Source-backed travel relationships retain day estimates without invented distances. Editing does not infer discoveries, visits or campaign-time advancement.

Run node scripts/validate.cjs before publishing. Preview through an HTTP server. GitHub Pages serves main from the root. No build, paid library, external service, account, telemetry or API key is needed. Public changes require an active repository update. Keep confidential campaign records out of public files and Git history.
