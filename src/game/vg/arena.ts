// Signal Forge — arena generation from market data
// Converts candlestick data into a grid arena where each cell represents
// a market data point. Same daily seed as Candle Climber → same data source,
// different projection.

import type { Candle } from "@/game/cc/types";
import type { ArenaCell, CellType } from "./types";
import { hashString, mulberry32 } from "@/game/cc/rng";

export const GRID_COLS = 16;
export const GRID_ROWS = 12;
export const CELL_SIZE = 44; // px per cell

export function buildArena(candles: Candle[], seedStr: string): ArenaCell[][] {
  const rnd = mulberry32(hashString("vg-arena:" + seedStr));
  const grid: ArenaCell[][] = [];

  // Rolling normalization for candle properties
  const W = 10;
  for (let row = 0; row < GRID_ROWS; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const idx = (row * GRID_COLS + col) % candles.length;
      const candle = candles[idx];

      // Rolling window for normalization
      const lo0 = Math.max(0, idx - W + 1);
      let min = Infinity, max = -Infinity;
      for (let j = lo0; j <= idx; j++) {
        if (candles[j].c < min) min = candles[j].c;
        if (candles[j].c > max) max = candles[j].c;
      }
      const span = max - min || 1;

      // Body size as intensity (normalized 0-1)
      const bodySize = Math.abs(candle.c - candle.o) / span;
      const intensity = Math.min(1, bodySize * 2.5);

      // Determine cell type from candle direction
      const up = candle.c >= candle.o;
      let type: CellType;
      if (up) {
        type = "green";
      } else {
        type = "red";
      }

      // Small chance of neutral (spread) cells — based on wick ratio
      const wickRatio = (Math.abs(candle.h - candle.l) - Math.abs(candle.c - candle.o)) / span;
      if (wickRatio > 0.6 && rnd() < 0.3) {
        type = "neutral";
      }

      // Rare liquidity pools (iridescent cells) — ~3% of green cells
      if (type === "green" && rnd() < 0.04) {
        type = "pool";
      }

      grid[row][col] = {
        row,
        col,
        type,
        intensity,
        flipped: false,
        pulse: rnd() * Math.PI * 2,
      };
    }
  }

  // Ensure the starting area (top-left 3x3) is safe
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      grid[r][c].type = "green";
      grid[r][c].intensity = 0.3;
    }
  }

  return grid;
}

export function flipCell(cell: ArenaCell): void {
  cell.flipped = !cell.flipped;
  // Swap green/red on flip
  if (cell.type === "green") cell.type = "red";
  else if (cell.type === "red") cell.type = "green";
  else if (cell.type === "pool") cell.type = "red"; // pools become red when flipped
}

export function cellEffectType(cell: ArenaCell): CellType {
  return cell.type;
}
