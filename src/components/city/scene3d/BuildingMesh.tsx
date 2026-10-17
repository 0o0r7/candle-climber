"use client";

// Chain City 3D — procedural low-poly building meshes.
// Every type is composed from primitives only (box/cylinder/cone) — no models,
// no textures, no downloads. Silhouette-first: each type is readable at
// isometric distance. Tier/level growth is height + rooftop additions, and the
// day/night cycle drives the emissive window band.
import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Building, BuildingType } from "@/game/city/types";
import { BUILDINGS } from "@/game/city/buildings";
import { gridToWorld } from "@/game/city/math3d";
import type { CityEngine } from "@/game/city/engine";

/** Base body height per type, in grid cells. */
const BODY_H: Record<BuildingType, number> = {
  residential: 0.75,
  device_store: 1.0,
  market_plaza: 0.35,
  bank_tower: 2.3,
  tech_foundry: 0.9,
  vehicle_depot: 0.85,
  space_port: 0.5,
  guild_hall: 1.1,
};

function Details({ type, w, d, h, color }: { type: BuildingType; w: number; d: number; h: number; color: string }) {
  switch (type) {
    case "residential":
      return (
        <mesh position={[0, h + 0.24, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[Math.max(w, d) * 0.78, 0.5, 4]} />
          <meshLambertMaterial color="#7a3b2e" flatShading />
        </mesh>
      );

    case "bank_tower":
      return (
        <group>
          {[-0.18, 0.18].map((cx) =>
            [-d / 2 + 0.1, d / 2 - 0.1].map((cz) => (
              <mesh key={`${cx}:${cz}`} position={[cx, h * 0.36, cz]}>
                <cylinderGeometry args={[0.06, 0.06, h * 0.72, 8]} />
                <meshLambertMaterial color="#e8ecf2" flatShading />
              </mesh>
            )),
          )}
          <mesh position={[0, h + 0.09, 0]}>
            <boxGeometry args={[w * 1.3, 0.18, d * 1.15]} />
            <meshLambertMaterial color={color} flatShading />
          </mesh>
          <mesh position={[0, h + 0.34, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
            <meshLambertMaterial color="#cfd6e0" flatShading />
          </mesh>
        </group>
      );

    case "tech_foundry":
      return (
        <group>
          <mesh position={[0, h + 0.18, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[Math.max(w, d) * 0.62, 0.36, 4]} />
            <meshLambertMaterial color="#4c5a2a" flatShading />
          </mesh>
          {[-w * 0.28, w * 0.28].map((cx) => (
            <mesh key={cx} position={[cx, h + 0.62, -d * 0.22]}>
              <cylinderGeometry args={[0.11, 0.13, 1.05, 8]} />
              <meshLambertMaterial color="#8f9aa6" flatShading />
            </mesh>
          ))}
        </group>
      );

    case "device_store":
      return (
        <group>
          <mesh position={[0, h * 0.55, d / 2 + 0.015]}>
            <boxGeometry args={[w * 0.82, h * 0.5, 0.04]} />
            <meshBasicMaterial color="#9fd8e8" />
          </mesh>
          <mesh position={[0, h + 0.07, 0]}>
            <boxGeometry args={[w * 1.06, 0.14, d * 1.06]} />
            <meshLambertMaterial color="#d7dde4" flatShading />
          </mesh>
        </group>
      );

    case "vehicle_depot":
      return (
        <group>
          <mesh position={[0, 0.34, d / 2 + 0.16]} rotation={[-0.42, 0, 0]}>
            <boxGeometry args={[w * 0.6, 0.06, 0.5]} />
            <meshLambertMaterial color="#6b727c" flatShading />
          </mesh>
          <mesh position={[0, h + 0.06, 0]}>
            <boxGeometry args={[w * 0.92, 0.12, d * 0.92]} />
            <meshLambertMaterial color="#3d444d" flatShading />
          </mesh>
        </group>
      );

    case "space_port":
      return (
        <group>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[Math.max(w, d) * 0.46, Math.max(w, d) * 0.5, 0.16, 12]} />
            <meshLambertMaterial color="#4a5160" flatShading />
          </mesh>
          <mesh position={[0, h + 0.55, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 1.1, 10]} />
            <meshLambertMaterial color="#e8ecf2" flatShading />
          </mesh>
          <mesh position={[0, h + 1.28, 0]}>
            <coneGeometry args={[0.18, 0.44, 10]} />
            <meshLambertMaterial color="#ff6b35" flatShading />
          </mesh>
        </group>
      );

    case "market_plaza":
      return (
        <group>
          {[[-0.24, -0.18], [0.22, -0.2], [0, 0.24]].map(([sx, sz]) => (
            <group key={`${sx}:${sz}`} position={[sx, 0, sz]}>
              <mesh position={[0, h + 0.12, 0]}>
                <boxGeometry args={[0.26, 0.22, 0.26]} />
                <meshLambertMaterial color="#8a6b3d" flatShading />
              </mesh>
              <mesh position={[0, h + 0.33, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[0.26, 0.2, 4]} />
                <meshLambertMaterial color="#e0b04e" flatShading />
              </mesh>
            </group>
          ))}
        </group>
      );

    case "guild_hall":
      return (
        <group>
          <mesh position={[0, h + 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[Math.max(w, d) * 0.72, 0.6, 4]} />
            <meshLambertMaterial color={color} flatShading />
          </mesh>
          <mesh position={[w / 2 + 0.06, h * 0.75, 0]}>
            <cylinderGeometry args={[0.03, 0.03, h * 1.5, 6]} />
            <meshLambertMaterial color="#cfd6e0" flatShading />
          </mesh>
          <mesh position={[w / 2 + 0.22, h * 1.3, 0]}>
            <planeGeometry args={[0.34, 0.24]} />
            <meshBasicMaterial color={color} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );

    default:
      return null;
  }
}

function BuildingMesh({ b, engine }: { b: Building; engine: CityEngine }) {
  const group = useRef<THREE.Group>(null);
  const win = useRef<THREE.MeshBasicMaterial>(null);
  const age = useRef(0);

  const def = BUILDINGS[b.type];
  const w = def.width * 0.92;
  const d = def.height * 0.92;
  // Tier/level growth must be visible: every level adds height.
  const h = BODY_H[b.type] * (1 + (b.level - 1) * 0.18);
  const { x, z } = gridToWorld(b.pos.col, b.pos.row);

  useFrame((_, dt) => {
    // Placement scale-in.
    age.current += dt;
    const t = Math.min(1, age.current / 0.35);
    if (group.current) group.current.scale.setScalar(0.05 + 0.95 * (1 - Math.pow(1 - t, 3)));
    // Windows: dark glass by day, lit warm at night.
    if (win.current) {
      const n = engine.state.dayNight;
      win.current.color.setRGB(0.1 + n * 0.9, 0.13 + n * 0.72, 0.2 + n * 0.34);
    }
  });

  return (
    <group ref={group} position={[x, 0, z]} scale={0.05}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color={def.color} flatShading />
      </mesh>
      <mesh position={[0, h * 0.62, 0]}>
        <boxGeometry args={[w * 1.02, Math.min(0.3, h * 0.22), d * 1.02]} />
        <meshBasicMaterial ref={win} color="#1b2233" />
      </mesh>
      <Details type={b.type} w={w} d={d} h={h} color={def.color} />
    </group>
  );
}

// Props are stable (the engine and the building object are mutated in place), so
// memo stops the ~10 Hz UI sync from re-rendering every building. A level change
// is picked up by the key in CityScene3D, which remounts the mesh.
export default memo(BuildingMesh);
