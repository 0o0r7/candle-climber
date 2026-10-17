/// <reference types="bun-types" />
// Chain City 3D — pure scene-math contract (bun test).
// Pins the promises the R3F scene relies on:
//   1. GRID<->WORLD — the transforms are exact inverses, so a building rendered
//      at gridToWorld(cell) is picked back at the same cell.
//   2. PICKING — a cursor ray hits the intended cell; rays that miss the grid
//      or point away from the ground plane return null (no phantom ghost).
//   3. CAMERA — the isometric pose holds its 45°/30° framing and the 90° rotate
//      steps are quarter turns.
//   4. PLACEMENT — the engine's placement validity (bounds / overlap / cost)
//      stays the single source of truth for the ghost preview.
import { describe, test, expect } from "bun:test";
import { GRID_COLS, GRID_ROWS } from "@/game/city/grid";
import {
  gridToWorld,
  worldToGrid,
  isCellInGrid,
  rayGroundIntersect,
  pickCell,
  isoCameraPose,
  ISO_PITCH,
  type Vec3,
} from "@/game/city/math3d";
import { CityEngine } from "@/game/city/engine";
import { BUILDINGS } from "@/game/city/buildings";

describe("grid <-> world transforms", () => {
  test("every grid cell round-trips through world space", () => {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const { x, z } = gridToWorld(col, row);
        expect(worldToGrid(x, z)).toEqual({ col, row });
      }
    }
  });

  test("the city is centred on the origin", () => {
    const a = gridToWorld(0, 0);
    const b = gridToWorld(GRID_COLS - 1, GRID_ROWS - 1);
    expect(a.x + b.x).toBeCloseTo(0, 10);
    expect(a.z + b.z).toBeCloseTo(0, 10);
  });

  test("worldToGrid treats the cell interior and rejects the outside", () => {
    const { x, z } = gridToWorld(3, 4);
    expect(worldToGrid(x + 0.4, z - 0.4)).toEqual({ col: 3, row: 4 });
    expect(worldToGrid(x + 0.6, z)).toEqual({ col: 4, row: 4 });
  });

  test("isCellInGrid bounds-checks both axes", () => {
    expect(isCellInGrid({ col: 0, row: 0 })).toBe(true);
    expect(isCellInGrid({ col: GRID_COLS - 1, row: GRID_ROWS - 1 })).toBe(true);
    expect(isCellInGrid({ col: -1, row: 0 })).toBe(false);
    expect(isCellInGrid({ col: 0, row: GRID_ROWS })).toBe(false);
  });
});

describe("ray picking", () => {
  test("a straight-down ray hits the plane at its own x/z", () => {
    const hit = rayGroundIntersect({ x: 2, y: 10, z: -3 }, { x: 0, y: -1, z: 0 });
    expect(hit).toEqual({ x: 2, z: -3 });
  });

  test("parallel and upward rays miss", () => {
    expect(rayGroundIntersect({ x: 0, y: 5, z: 0 }, { x: 1, y: 0, z: 0 })).toBeNull();
    expect(rayGroundIntersect({ x: 0, y: 5, z: 0 }, { x: 0, y: 1, z: 0 })).toBeNull();
  });

  test("an angled ray lands on the cell it is aimed at", () => {
    const target = gridToWorld(3, 4);
    // Aim a ray from an offset point straight at the centre of cell (3,4).
    const origin: Vec3 = { x: target.x - 3, y: 8, z: target.z - 4 };
    const dir: Vec3 = { x: 3, y: -8, z: 4 };
    expect(pickCell(origin, dir)).toEqual({ col: 3, row: 4 });
  });

  test("an angled ray that overshoots the grid returns null", () => {
    // Same slope, but the plane hit lands well outside the city.
    const origin: Vec3 = { x: 40, y: 8, z: 40 };
    const dir: Vec3 = { x: 3, y: -8, z: 4 };
    expect(pickCell(origin, dir)).toBeNull();
  });

  test("a ray that misses the grid returns null", () => {
    expect(pickCell({ x: 999, y: 20, z: 999 }, { x: 0, y: -1, z: 0 })).toBeNull();
    expect(pickCell({ x: 0, y: 20, z: 0 }, { x: 0, y: 1, z: 0 })).toBeNull();
  });
});

describe("isometric camera pose", () => {
  test("holds the 30° pitch framing for every rotation", () => {
    for (let steps = -4; steps <= 4; steps++) {
      const p = isoCameraPose(0, 0, 60, steps);
      expect(p.y).toBeCloseTo(Math.sin(ISO_PITCH) * 60, 10);
    }
  });

  test("each step is a quarter turn around the target", () => {
    const a = isoCameraPose(2, -1, 50, 0);
    const b = isoCameraPose(2, -1, 50, 1);
    // Rotating the offset by 90° swaps the horizontal components (up to sign).
    expect(Math.abs(b.x - 2)).toBeCloseTo(Math.abs(a.z - -1), 8);
    expect(Math.abs(b.z - -1)).toBeCloseTo(Math.abs(a.x - 2), 8);
  });

  test("four steps return to the start", () => {
    const a = isoCameraPose(1, 2, 40, 0);
    const b = isoCameraPose(1, 2, 40, 4);
    expect(b.x).toBeCloseTo(a.x, 10);
    expect(b.z).toBeCloseTo(a.z, 10);
  });
});

describe("placement validity (engine — the ghost's source of truth)", () => {
  test("empty ground accepts a legal placement, bounds reject", () => {
    const e = new CityEngine();
    expect(e.canPlace("residential", { col: 0, row: 0 })).toBe(true);
    expect(e.canPlace("residential", { col: -1, row: 0 })).toBe(false);
    expect(e.canPlace("residential", { col: GRID_COLS, row: 0 })).toBe(false);
    // A 2x2 footprint that would overhang the edge is rejected.
    expect(e.canPlace("tech_foundry", { col: GRID_COLS - 1, row: 0 })).toBe(false);
  });

  test("an occupied footprint blocks overlap", () => {
    const e = new CityEngine();
    expect(e.placeBuilding("tech_foundry", { col: 2, row: 2 })).toBe(true);
    expect(e.canPlace("residential", { col: 2, row: 2 })).toBe(false);
    expect(e.canPlace("residential", { col: 3, row: 3 })).toBe(false);
    expect(e.canPlace("residential", { col: 4, row: 2 })).toBe(true);
  });

  test("cost gates the ghost", () => {
    const e = new CityEngine();
    e.state.wickBalance = BUILDINGS.bank_tower.cost - 1;
    expect(e.canPlace("bank_tower", { col: 1, row: 1 })).toBe(false);
    e.state.wickBalance = BUILDINGS.bank_tower.cost;
    expect(e.canPlace("bank_tower", { col: 1, row: 1 })).toBe(true);
  });
});
