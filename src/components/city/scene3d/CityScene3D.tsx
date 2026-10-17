"use client";

// Chain City 3D — the isometric city scene.
//
// This is a pure VIEW over the existing state layer: it reads `engine.state`
// (buildings, dayNight, time) and never owns game state. The render loop is R3F's
// own, decoupled from the engine's 3s economy tick which keeps running in
// CityCanvas. Interaction (pan / zoom / rotate / tap-to-place) is wired straight
// onto the WebGL canvas and uses the pure math in @/game/city/math3d.
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Building, BuildingType, GridPos } from "@/game/city/types";
import { BUILDINGS } from "@/game/city/buildings";
import { GRID_COLS, GRID_ROWS } from "@/game/city/grid";
import { gridToWorld, isoCameraPose, pickCell } from "@/game/city/math3d";
import type { CityEngine } from "@/game/city/engine";
import CityGround from "./CityGround";
import BuildingMesh from "./BuildingMesh";

const MIN_ZOOM = 14;
const MAX_ZOOM = 120;
const CAM_DIST = 60;
// Pointer travel below this (px) still counts as a tap, not a pan. Finger taps
// drift a few pixels, so a tighter threshold silently swallows real taps.
const TAP_SLOP_PX = 10;

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

interface ViewState { targetX: number; targetZ: number; zoom: number; yawSteps: number; }

interface Props {
  engine: CityEngine;
  buildings: Building[];
  selectedType: BuildingType | null;
  onPlace: (pos: GridPos) => void;
}

export default function CityScene3D({ engine, buildings, selectedType, onPlace }: Props) {
  const view = useRef<ViewState>({ targetX: 0, targetZ: 0, zoom: 44, yawSteps: 0 });
  const hover = useRef<GridPos | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const rotate = (dir: number) => { view.current.yawSteps += dir; };
  const zoomBy = (f: number) => { view.current.zoom = clampZoom(view.current.zoom * f); };

  // Signature so the instanced bases only rewrite when the city actually changes.
  const sig = buildings.map((b) => `${b.id}:${b.level}:${b.pos.col},${b.pos.row}`).join("|");

  return (
    <div className="city-scene3d">
      <Canvas
        orthographic
        dpr={[1, 2]}
        // near must stay positive: a negative near plane puts the picking ray's
        // origin *past* the ground plane, so every tap would resolve to no cell.
        camera={{ zoom: 44, position: [30, 26, 30], near: 0.1, far: 600 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Atmosphere engine={engine} />
        <Lights engine={engine} />
        <CityGround showGrid={showGrid} />
        <BuildingBases buildings={buildings} sig={sig} />
        {buildings.map((b) => (
          <BuildingMesh key={`${b.id}-${b.level}`} b={b} engine={engine} />
        ))}
        <GhostPreview engine={engine} selectedType={selectedType} hoverRef={hover} />
        <SceneControls
          engine={engine}
          viewRef={view}
          hoverRef={hover}
          selectedType={selectedType}
          onPlace={onPlace}
        />
      </Canvas>

      <div className="city-view-controls">
        <button className="city-view-btn" onClick={() => rotate(-1)} title="Rotate left" aria-label="Rotate left">⟲</button>
        <button className="city-view-btn" onClick={() => rotate(1)} title="Rotate right" aria-label="Rotate right">⟳</button>
        <button
          className={`city-view-btn ${showGrid ? "active" : ""}`}
          onClick={() => setShowGrid((v) => !v)}
          title="Toggle grid"
          aria-label="Toggle grid"
        >▦</button>
        <button className="city-view-btn" onClick={() => zoomBy(1.2)} title="Zoom in" aria-label="Zoom in">＋</button>
        <button className="city-view-btn" onClick={() => zoomBy(1 / 1.2)} title="Zoom out" aria-label="Zoom out">－</button>
      </div>
    </div>
  );
}

// ── Sky + lighting driven by the existing day/night cycle ──────────────
const SKY_DAY = new THREE.Color("#8fb6d8");
const SKY_NIGHT = new THREE.Color("#0a0e1a");
const SKY_TMP = new THREE.Color();

function Atmosphere({ engine }: { engine: CityEngine }) {
  const scene = useThree((s) => s.scene);
  useFrame(() => {
    SKY_TMP.copy(SKY_DAY).lerp(SKY_NIGHT, engine.state.dayNight);
    // three.js scene mutation is the R3F render-loop idiom, not React state.
    // eslint-disable-next-line react-hooks/immutability
    scene.background = SKY_TMP;
  });
  return null;
}

function Lights({ engine }: { engine: CityEngine }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  useFrame(() => {
    const n = engine.state.dayNight;
    const a = engine.state.time * 0.06;
    if (sun.current) {
      sun.current.position.set(Math.cos(a) * 30, 24 - n * 14, Math.sin(a) * 30);
      sun.current.intensity = 1.55 - n * 1.15;
      sun.current.color.setRGB(1, 0.95 - n * 0.2, 0.85 - n * 0.25);
    }
    if (amb.current) amb.current.intensity = 0.55 - n * 0.28;
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.55} />
      <directionalLight ref={sun} position={[18, 26, 12]} intensity={1.5} />
    </>
  );
}

// ── Shared base slabs, instanced (one draw call for every building base) ──
const BASE_MAX = GRID_COLS * GRID_ROWS;

function BuildingBases({ buildings, sig }: { buildings: Building[]; sig: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      const def = BUILDINGS[b.type];
      const { x, z } = gridToWorld(b.pos.col, b.pos.row);
      m.makeScale(def.width * 0.96, 0.12, def.height * 0.96);
      m.setPosition(x, 0.06, z);
      mesh.setMatrixAt(i, m);
    }
    mesh.count = buildings.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [sig]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BASE_MAX]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial color="#161d2b" flatShading />
    </instancedMesh>
  );
}

// ── Ghost preview: green when the placement is legal, red when it is not ──
function GhostPreview({
  engine,
  selectedType,
  hoverRef,
}: {
  engine: CityEngine;
  selectedType: BuildingType | null;
  hoverRef: React.RefObject<GridPos | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const outline = useRef<THREE.LineBasicMaterial>(null);
  const outlineGeom = useRef<THREE.BufferGeometry>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const cell = hoverRef.current;
    if (!cell || !selectedType) {
      g.visible = false;
      return;
    }
    const def = BUILDINGS[selectedType];
    const { x, z } = gridToWorld(cell.col, cell.row);
    const ok = engine.canPlace(selectedType, cell);
    g.visible = true;
    g.position.set(x, 0.14, z);
    g.scale.set(def.width * 0.9, 1, def.height * 0.9);
    const c = ok ? "#5bd08a" : "#e07856";
    mat.current?.color.set(c);
    outline.current?.color.set(c);
    const g2 = outlineGeom.current;
    if (g2) {
      const p = g2.attributes.position as THREE.BufferAttribute;
      p.setXYZ(0, -0.5, 0, -0.5);
      p.setXYZ(1, 0.5, 0, -0.5);
      p.setXYZ(2, 0.5, 0, 0.5);
      p.setXYZ(3, -0.5, 0, 0.5);
      p.needsUpdate = true;
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh>
        <boxGeometry args={[1, 0.18, 1]} />
        <meshBasicMaterial ref={mat} transparent opacity={0.42} />
      </mesh>
      <lineLoop position={[0, 0.11, 0]}>
        <bufferGeometry ref={outlineGeom}>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(12), 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={outline} transparent opacity={0.95} />
      </lineLoop>
    </group>
  );
}

// ── Camera + pointer interaction ───────────────────────────────────────
function SceneControls({
  engine,
  viewRef,
  hoverRef,
  selectedType,
  onPlace,
}: {
  engine: CityEngine;
  viewRef: React.RefObject<ViewState>;
  hoverRef: React.RefObject<GridPos | null>;
  selectedType: BuildingType | null;
  onPlace: (pos: GridPos) => void;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  // Latest props without re-subscribing the listeners on every render.
  const selRef = useRef(selectedType);
  const placeRef = useRef(onPlace);
  selRef.current = selectedType;
  placeRef.current = onPlace;

  useFrame(() => {
    const cam = camera as THREE.OrthographicCamera;
    const v = viewRef.current;
    const pose = isoCameraPose(v.targetX, v.targetZ, CAM_DIST, v.yawSteps);
    cam.position.set(pose.x, pose.y, pose.z);
    cam.lookAt(v.targetX, 0, v.targetZ);
    // Imperative camera mutation is the R3F render-loop idiom.
    // eslint-disable-next-line react-hooks/immutability
    cam.zoom += (v.zoom - cam.zoom) * 0.25;
    cam.updateProjectionMatrix();
  });

  useEffect(() => {
    const el = gl.domElement;
    // The canvas must not scroll/zoom the page while panning or pinching.
    // eslint-disable-next-line react-hooks/immutability
    el.style.touchAction = "none";

    const pointers = new Map<number, { x: number; y: number }>();
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    let dragging = false;
    let moved = 0;
    let last = { x: 0, y: 0 };
    let pinch = 0;

    const pinchDist = () => {
      const pts = [...pointers.values()];
      if (pts.length < 2) return 0;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    };

    const hitCell = (cx: number, cy: number): GridPos | null => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const o = raycaster.ray.origin;
      const dir = raycaster.ray.direction;
      return pickCell({ x: o.x, y: o.y, z: o.z }, { x: dir.x, y: dir.y, z: dir.z });
    };

    const onDown = (e: PointerEvent) => {
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        dragging = true;
        moved = 0;
        last = { x: e.clientX, y: e.clientY };
      } else if (pointers.size === 2) {
        pinch = pinchDist();
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) {
        hoverRef.current = hitCell(e.clientX, e.clientY);
        return;
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2) {
        const d = pinchDist();
        if (pinch > 0 && d > 0) viewRef.current.zoom = clampZoom(viewRef.current.zoom * (d / pinch));
        pinch = d;
        return;
      }

      if (!dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      const cam = camera as THREE.OrthographicCamera;
      const wpp = 1 / cam.zoom;
      right.setFromMatrixColumn(cam.matrixWorld, 0);
      right.y = 0;
      right.normalize();
      up.setFromMatrixColumn(cam.matrixWorld, 1);
      up.y = 0;
      up.normalize();
      viewRef.current.targetX += (-dx * right.x + dy * up.x) * wpp;
      viewRef.current.targetZ += (-dx * right.z + dy * up.z) * wpp;
      last = { x: e.clientX, y: e.clientY };
      hoverRef.current = null;
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = 0;
      const wasTap = dragging && moved < TAP_SLOP_PX;
      if (wasTap) {
        const cell = hitCell(e.clientX, e.clientY);
        if (cell && selRef.current) placeRef.current(cell);
      }
      if (pointers.size === 0) dragging = false;
      hoverRef.current = hitCell(e.clientX, e.clientY);
    };

    const onLeave = () => { hoverRef.current = null; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      viewRef.current.zoom = clampZoom(viewRef.current.zoom * (e.deltaY > 0 ? 1 / 1.12 : 1.12));
    };

    const onContext = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("contextmenu", onContext);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("contextmenu", onContext);
    };
  }, [camera, gl, hoverRef, viewRef]);

  // `engine` is read by the scene, not by these listeners — keep the reference
  // meaningful for future controls without re-subscribing.
  void engine;

  return null;
}
