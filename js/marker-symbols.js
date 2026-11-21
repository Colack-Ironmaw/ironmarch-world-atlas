// Paths use a 24-unit drawing area centered on the pin's map coordinate.
const groups = {
  'General': [
    ['pin', 'Location pin', 'M0 10Q-7 2 -7 -3a7 7 0 1 1 14 0Q7 2 0 10ZM0 -6a3 3 0 1 0 .01 0Z'],
    ['transparent', 'Transparent (hidden on map)', null],
  ],
  'Seats of power': [
    ['capital', 'National capital', 'M-10 -6l5 4 5 -7 5 7 5 -4 -2 12h-16ZM-7 9H7'],
    ['political-seat', 'Confederation / major political seat', 'M0 9V-10M-9 8H9M0 -8h9l-3 3 3 3H0M-2 -4h-8l3 3 -3 3h8'],
  ],
  'Settlements': [
    ['major-city', 'Major city', 'M-10 8V-3h4v11M-6 4h3V-6l3 -4 3 4V4h3M6 8V-3h4V8ZM-1 8V4h2v4'],
    ['city', 'City', 'M-9 8V-3l4 -4 4 4v2l5 -5 5 5v9ZM-9 -3h8M-1 -1H9M-6 8V3h3v5M3 8V3h3v5'],
    ['town', 'Town', 'M-10 -1l6 -6 6 6M-8 -2v10h9V-2M0 -2l4 -4 6 6M8 -1v9H1M-5 8V3h3v5'],
    ['village', 'Village', 'M-10 1l10 -9 10 9ZM-7 1v7H7V1M-2 8V3h4v5'],
  ],
  'Defenses': [
    ['fort', 'Fortress', 'M-10 8V-7h3v3h3v-3h3v7h2v-7h3v3h3v-3h3V8ZM-3 8V5a3 3 0 0 1 6 0v3'],
    ['stronghold', 'Stronghold / keep', 'M-7 9l1 -13 -2 -1v-4h3v2h3v-2h4v2h3v-2h3v4l-2 1 1 13ZM-2 9V4a2 2 0 0 1 4 0v5M-2 -2v2M2 -2v2'],
    ['watchtower', 'Watchtower', 'M-7 9h14M-4 9l1 -11h6L4 9M-6 -3h12v-4H-6ZM-8 -7l8 -4 8 4'],
  ],
  'Workings & institutions': [
    ['mine', 'Mine', 'M-9 8l1 -15H8L9 8ZM-5 8l1 -11h8L5 8M-6 1l-2 3M6 1l2 3'],
    ['underground-hold', 'Underground hold', 'M-11 4l6 -11 3 4 4 -7 9 14M-7 7h14M-5 7V3a5 5 0 0 1 10 0v4M0 1v6'],
    ['port', 'Port / harbor', 'M0 -5a3 3 0 1 0 -.01 0ZM0 -5V9M-5 -2H5M-9 2q0 6 9 8 9 -2 9 -8M-10 5l1 -4 4 2M10 5L9 1 5 3'],
    ['temple', 'Religious institution', 'M-10 -2l10 -7 10 7ZM-9 8H9M-7 5V0M-2 5V0M2 5V0M7 5V0M-8 5H8'],
  ],
  'Sites & terrain': [
    ['ruin', 'Ruins', 'M-10 8h20M-8 7V-7l3 2 3 -3v5l-2 2 2 2v6M2 7V1l3 -1v-4l3 2V7'],
    ['camp', 'Mobile camp / warband', 'M-10 8 0 -7 10 8ZM-4 8l4 -7 4 7M-2 -10l4 5M2 -10l-4 5'],
    ['dungeon', 'Dungeon entrance', 'M-9 8V0a9 9 0 0 1 18 0v8ZM-6 8V2H1v2h3v2h3M-5 -4l2 2M0 -8v3M5 -4 3 -2'],
    ['bridge', 'Bridge / crossing', 'M-10 1H10M-8 6V-6M8 6V-6M-8 -5Q0 3 8 -5M-4 -2V1M4 -2V1M-10 8q3 -2 5 0t5 0 5 0 5 0'],
    ['pass', 'Mountain pass', 'M-11 4l6 -13 5 9 5 -9 6 13M-2 10Q4 6 1 3T1 -1'],
    ['region', 'Geographic region', 'M0 -10 10 0 0 10 -10 0ZM-6 2l3 -5 3 4 2 -3 4 4'],
  ],
  'Campaign': [
    ['quest', 'Quest', 'M0 -9v12M0 7a1 1 0 1 0 .01 0Z'],
    ['treasure', 'Treasure', 'M-9 7V-3q0 -4 4 -4H5q4 0 4 4V7ZM-9 -1H9M-2 -2h4v4h-4Z'],
    ['danger', 'Danger', 'M0 -10 10 8h-20ZM0 -3v5M0 5v.4'],
    ['party', 'Party', 'M0 -10l3 7 7 1 -5.5 5 1.5 7 -6 -3.5 -6 3.5 1.5 -7 -5.5 -5 7 -1Z'],
  ],
};

const symbols = new Map(Object.values(groups).flat().map(([id, label, path]) => [id, {label, path}]));
export const hasSymbol = id => symbols.has(id);
export const symbolLabel = id => symbols.get(id).label;
const svgNS = 'http://www.w3.org/2000/svg';

export function drawSymbol(parent, id) {
  const path = symbols.get(id).path;
  if (!path) return;
  const glyph = document.createElementNS(svgNS, 'path');
  glyph.setAttribute('d', path);
  glyph.setAttribute('class', 'cartographic-glyph');
  parent.append(glyph);
}

export function buildSymbolPicker(select, preview) {
  for (const [name, entries] of Object.entries(groups)) {
    const group = document.createElement('optgroup');
    group.label = name;
    for (const [id, label] of entries) group.append(new Option(label, id));
    select.append(group);
  }
  const refresh = () => {
    preview.replaceChildren();
    drawSymbol(preview, select.value);
  };
  select.addEventListener('change', refresh);
  refresh();
  return refresh;
}
