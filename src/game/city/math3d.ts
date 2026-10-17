// Chain City — 3D scene math (pure, renderer-agnostic).
//
// Grid <-> world transforms, ground-plane ray picking and the isometric camera
// pose. Deliberately imports NOTHING from three.js: this module is unit-tested
// directly and is the single source of truth for the R3F scene layer, so the
// scene can never disagree with the engine about where a cell is.
import { GRID_COLS, GRID_ROWS } from "./grid";
import type { GridPos } from "./types";

export interface Vec3 { x: number; y: number; z: number; }

/** Grid cell -> world centre on the city plane (y = 0). Cell (0,0) is the -x/-z corner. */
export function gridToWorld(col: number, row: number): { x: number; z: number } {
  return { x: col - GRID_COLS / 2 + 0.5, z: row - GRID_ROWS / 2 + 0.5 };
}

/** World (x, z) -> the grid cell containing it. May be out of bounds — check with isCellInGrid. */
export function worldToGrid(x: number, z: number): GridPos {
  return { col: Math.floor(x + GRID_COLS / 2), row: Math.floor(z + GRID_ROWS / 2) };
}

export function isCellInGrid(pos: GridPos): boolean {
  return pos.col >= 0 && pos.col < GRID_COLS && pos.row >= 0 && pos.row < GRID_ROWS;
}

/**
 * Intersect a ray with the ground plane (y = planeY).
 * Returns null when the ray is parallel to the plane or points away from it.
 */
export function rayGroundIntersect(origin: Vec3, dir: Vec3, planeY = 0): { x: number; z: number } | null {
  if (Math.abs(dir.y) < 1e-6) return null;
  const t = (planeY - origin.y) / dir.y;
  if (t < 0) return null;
  return { x: origin.x + dir.x * t, z: origin.z + dir.z * t };
}

/** Cursor ray -> the grid cell under it (null when the ray misses the city grid). */
export function pickCell(origin: Vec3, dir: Vec3): GridPos | null {
  const hit = rayGroundIntersect(origin, dir);
  if (!hit) return null;
  const cell = worldToGrid(hit.x, hit.z);
  return isCellInGrid(cell) ? cell : null;
}

/** Base isometric framing: 45° yaw, 30° pitch. */
export const ISO_YAW = Math.PI / 4;
export const ISO_PITCH = Math.PI / 6;

/**
 * Camera position for a ground target and a 90°-step rotation.
 * `yawSteps` is taken modulo 4, so -1 and 3 are the same quarter turn.
 */
export function isoCameraPose(targetX: number, targetZ: number, dist: number, yawSteps: number): Vec3 {
  const steps = ((yawSteps % 4) + 4) % 4;
  const yaw = ISO_YAW + steps * (Math.PI / 2);
  const horizontal = Math.cos(ISO_PITCH) * dist;
  return {
    x: targetX + Math.sin(yaw) * horizontal,
    y: Math.sin(ISO_PITCH) * dist,
    z: targetZ + Math.cos(yaw) * horizontal,
  };
}
