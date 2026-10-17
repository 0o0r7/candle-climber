// Chain City — isometric grid math
// Converts grid (col,row) to screen (x,y) and handles hit-testing.

export const TILE_W = 64;
export const TILE_H = 32;
export const GRID_COLS = 12;
export const GRID_ROWS = 12;

export interface IsoPoint { x: number; y: number; }

export function gridToIso(col: number, row: number): IsoPoint {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

export function isoToGrid(x: number, y: number): { col: number; row: number } {
  const col = (x / (TILE_W / 2) + y / (TILE_H / 2)) / 2;
  const row = (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2;
  return { col: Math.floor(col), row: Math.floor(row) };
}

export function gridToScreen(col: number, row: number, camX: number, camY: number, zoom: number): IsoPoint {
  const iso = gridToIso(col, row);
  return {
    x: iso.x * zoom - camX,
    y: iso.y * zoom - camY,
  };
}

export function screenToGrid(sx: number, sy: number, camX: number, camY: number, zoom: number): { col: number; row: number } {
  const x = (sx + camX) / zoom;
  const y = (sy + camY) / zoom;
  return isoToGrid(x, y);
}

export function isInBounds(col: number, row: number): boolean {
  return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
}

// Get the bounding box of the entire grid in iso space (for initial camera centering)
export function gridBounds() {
  const tl = gridToIso(0, 0);
  const tr = gridToIso(GRID_COLS, 0);
  const bl = gridToIso(0, GRID_ROWS);
  const br = gridToIso(GRID_COLS, GRID_ROWS);
  return {
    minX: Math.min(tl.x, tr.x, bl.x, br.x),
    maxX: Math.max(tl.x, tr.x, bl.x, br.x),
    minY: Math.min(tl.y, tr.y, bl.y, br.y),
    maxY: Math.max(tl.y, tr.y, bl.y, br.y),
  };
}
