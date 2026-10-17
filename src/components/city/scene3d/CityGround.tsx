"use client";

// Chain City 3D — the city plane.
// One InstancedMesh carries every ground tile (single draw call) with a subtle
// checker via per-instance colour; the grid overlay is a single line-segments
// geometry toggled from the view controls.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GRID_COLS, GRID_ROWS } from "@/game/city/grid";
import { gridToWorld } from "@/game/city/math3d";

const TILE_COUNT = GRID_COLS * GRID_ROWS;

function buildGridGeometry(): THREE.BufferGeometry {
  const pts: number[] = [];
  const y = 0.06;
  const x0 = -GRID_COLS / 2;
  const x1 = GRID_COLS / 2;
  const z0 = -GRID_ROWS / 2;
  const z1 = GRID_ROWS / 2;
  for (let c = 0; c <= GRID_COLS; c++) {
    const x = x0 + c;
    pts.push(x, y, z0, x, y, z1);
  }
  for (let r = 0; r <= GRID_ROWS; r++) {
    const z = z0 + r;
    pts.push(x0, y, z, x1, y, z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

export default function CityGround({ showGrid }: { showGrid: boolean }) {
  const tiles = useRef<THREE.InstancedMesh>(null);
  const grid = useMemo(() => buildGridGeometry(), []);

  useEffect(() => {
    const mesh = tiles.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const i = row * GRID_COLS + col;
        const { x, z } = gridToWorld(col, row);
        m.makeTranslation(x, 0, z);
        mesh.setMatrixAt(i, m);
        c.set((col + row) % 2 === 0 ? "#0c121d" : "#101a28");
        mesh.setColorAt(i, c);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={tiles} args={[undefined, undefined, TILE_COUNT]}>
        <boxGeometry args={[0.96, 0.08, 0.96]} />
        <meshLambertMaterial color="#ffffff" flatShading />
      </instancedMesh>
      {showGrid && (
        <lineSegments geometry={grid}>
          <lineBasicMaterial color="#22314a" transparent opacity={0.85} />
        </lineSegments>
      )}
    </group>
  );
}
