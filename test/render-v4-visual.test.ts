// ART V4 render probes — the Wick Vault sprite + graduation celebration,
// verified against a recording stub 2D context (headless, zero new deps).
//
// Why a stub context: the renderer is deliberately headless-safe (guards on
// document/window), so bun can drive renderV2 directly. The stub records ops
// + args, which gives two strong properties for free:
//   1. POSITIONAL checks — the chest's ink seam / beam / confetti rects appear
//      at the exact expected world→screen coordinates;
//   2. TRACE DETERMINISM — same seed + same engine state ⇒ a bit-identical
//      op trace (the W5 spirit extended to the token-era visuals; Math.random
//      is only reachable when e.shake > 0 or a platform is crumbling — both
//      held at zero here).
import { describe, test, expect } from "bun:test";
import { buildPlatforms } from "@/game/cc/level";
import { syntheticCandles } from "@/game/cc/level-source";
import { Engine, VIEW_W, VIEW_H } from "@/game/cc/engine";
import { renderV2 } from "@/game/cc/render-v2";

type Op = { op: string; args: unknown[] };

function makeCtx(): { ctx: CanvasRenderingContext2D; ops: Op[] } {
  const ops: Op[] = [];
  const gradient = { addColorStop: () => {} };
  const ctx = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "canvas") return { width: VIEW_W, height: VIEW_H };
        return (...args: unknown[]) => {
          ops.push({ op: String(prop), args });
          if (prop === "createLinearGradient" || prop === "createRadialGradient") return gradient;
          if (prop === "measureText") return { width: 10 };
          return undefined;
        };
      },
      set(_t, prop, value) {
        ops.push({ op: `set:${String(prop)}`, args: [value] });
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, ops };
}

function buildEngine(): { e: Engine; peak: number } {
  const candles = syntheticCandles("2026-10-12", 40, "1w");
  const plats = buildPlatforms(candles, "2026-10-12SYNTH");
  let peak = 0;
  for (let i = 1; i < candles.length; i++) if (candles[i].h > candles[peak].h) peak = i;
  return { e: new Engine(plats, { onDeath: () => {}, onScore: () => {} }, undefined, "2026-10-12SYNTH"), peak };
}

/** the chest's ink seam — a 26×2 fillRect at (cx-13, by+14) */
function findSeam(ops: Op[], cx: number, by: number): Op | undefined {
  return ops.find(
    (o) =>
      o.op === "fillRect" &&
      Math.abs((o.args[0] as number) - (cx - 13)) < 1.5 &&
      Math.abs((o.args[1] as number) - (by + 14)) < 1.5 &&
      Math.abs((o.args[2] as number) - 26) < 0.5 &&
      Math.abs((o.args[3] as number) - 2) < 0.5,
  );
}

function renderWith(e: Engine, peakIdx: number, celebrateT: number) {
  const { ctx, ops } = makeCtx();
  renderV2(ctx, e, "2026-10-12SYNTH", undefined, [], undefined, "default", null, null, undefined, peakIdx, celebrateT);
  return ops;
}

describe("ART V4 vault sprite (render probe)", () => {
  test("chest draws ON the peak platform at the exact world→screen position", () => {
    const { e, peak } = buildEngine();
    const p = e.plats[peak];
    // camera parks the peak at the player anchor (like mid-run passing it)
    e.camX = p.x + p.w / 2 - VIEW_W * 0.3;
    e.camY = p.y - VIEW_H * 0.52;
    e.camY = Math.min(e.camY, 0);
    const ops = renderWith(e, peak, 0);
    const cx = p.x + p.w / 2 - e.camX;
    const by = p.y - e.camY - 22;
    expect(findSeam(ops, cx, by)).toBeDefined();
    // keyhole + flame arcs + bent wick curves all present
    expect(ops.some((o) => o.op === "arc")).toBe(true);
    expect(ops.some((o) => o.op === "quadraticCurveTo")).toBe(true);
    // closed chest: no 150px light column
    expect(ops.some((o) => o.op === "fillRect" && Math.abs((o.args[3] as number) - 150) < 1)).toBe(false);
  });

  test("chest culls off-frame (start pose — peak is far ahead, no chest ops)", () => {
    const { e, peak } = buildEngine();
    expect(peak > 8).toBe(true); // the peak sits beyond the start window
    const ops = renderWith(e, peak, 0);
    expect(findSeam(ops, -9999, -9999)).toBeUndefined();
    // no chest seam anywhere near the start frame: no 26×2 rect at all
    expect(ops.some((o) => o.op === "fillRect" && Math.abs((o.args[2] as number) - 26) < 0.5 && Math.abs((o.args[3] as number) - 2) < 0.5)).toBe(false);
  });

  test("passed peak ⇒ chest opens (light column leaks out)", () => {
    const { e, peak } = buildEngine();
    const p = e.plats[peak];
    e.camX = p.x + p.w / 2 - VIEW_W * 0.3;
    e.camY = Math.min(p.y - VIEW_H * 0.52, 0);
    e.candlesPassed = peak + 1; // the run passed the peak candle
    const ops = renderWith(e, peak, 0);
    const beam = ops.find(
      (o) => o.op === "fillRect" && Math.abs((o.args[3] as number) - 150) < 1 && (o.args[2] as number) > 18 && (o.args[2] as number) < 34,
    );
    expect(beam).toBeDefined();
  });

  test("invalid peakIdx ⇒ no chest, no crash", () => {
    const { e } = buildEngine();
    expect(() => renderWith(e, 9999, 0)).not.toThrow();
    expect(() => renderWith(e, -1, 0)).not.toThrow();
  });
});

describe("ART V4 graduation celebration (render probe)", () => {
  test("t=1.0s draws the summit beam + a full confetti volley", () => {
    const { e } = buildEngine();
    const summit = e.plats[e.plats.length - 1];
    e.camX = summit.x + summit.w / 2 - VIEW_W * 0.3;
    e.camY = Math.min(summit.y - VIEW_H * 0.52, 0);
    const base = renderWith(e, -1, 0);
    const cel = renderWith(e, -1, 1.0);
    // beam gradient exists
    expect(cel.some((o) => o.op === "createLinearGradient")).toBe(true);
    // confetti: shards are fillRects of w∈[3,8], h∈[6,15] — dozens of them
    const shards = cel.filter(
      (o) => o.op === "fillRect" && (o.args[2] as number) >= 2.5 && (o.args[2] as number) <= 8.5 && (o.args[3] as number) >= 5.5 && (o.args[3] as number) <= 15.5,
    );
    expect(shards.length).toBeGreaterThanOrEqual(30);
    // baseline (no celebration) has essentially none of that shape signature
    const baseShards = base.filter(
      (o) => o.op === "fillRect" && (o.args[2] as number) >= 2.5 && (o.args[2] as number) <= 8.5 && (o.args[3] as number) >= 5.5 && (o.args[3] as number) <= 15.5,
    );
    expect(shards.length).toBeGreaterThan(baseShards.length + 20);
    // embers: arcs above the summit cap
    expect(cel.some((o) => o.op === "arc")).toBe(true);
  });

  test("celebration trace is deterministic (same seed + same state ⇒ identical ops)", () => {
    const a = buildEngine();
    const b = buildEngine();
    const summitA = a.e.plats[a.e.plats.length - 1];
    const summitB = b.e.plats[b.e.plats.length - 1];
    a.e.camX = summitA.x + summitA.w / 2 - VIEW_W * 0.3;
    a.e.camY = Math.min(summitA.y - VIEW_H * 0.52, 0);
    b.e.camX = summitB.x + summitB.w / 2 - VIEW_W * 0.3;
    b.e.camY = Math.min(summitB.y - VIEW_H * 0.52, 0);
    const traceA = JSON.stringify(renderWith(a.e, -1, 1.0));
    const traceB = JSON.stringify(renderWith(b.e, -1, 1.0));
    expect(traceA).toBe(traceB);
  });

  test("confetti fades completely by 3.2s (no shard rects at t=3.3)", () => {
    const { e } = buildEngine();
    const summit = e.plats[e.plats.length - 1];
    e.camX = summit.x + summit.w / 2 - VIEW_W * 0.3;
    e.camY = Math.min(summit.y - VIEW_H * 0.52, 0);
    const ops = renderWith(e, -1, 3.3);
    const shards = ops.filter(
      (o) => o.op === "fillRect" && (o.args[2] as number) >= 2.5 && (o.args[2] as number) <= 8.5 && (o.args[3] as number) >= 5.5 && (o.args[3] as number) <= 15.5,
    );
    expect(shards.length).toBe(0); // envelope done — only the beacon remains
  });

  test("canvas state stays balanced (save/restore) across all probe runs", () => {
    const { e, peak } = buildEngine();
    const p = e.plats[peak];
    e.camX = p.x + p.w / 2 - VIEW_W * 0.3;
    e.camY = Math.min(p.y - VIEW_H * 0.52, 0);
    for (const cel of [0, 0.5, 1.0, 2.5, 5]) {
      const ops = renderWith(e, peak, cel);
      const saves = ops.filter((o) => o.op === "save").length;
      const restores = ops.filter((o) => o.op === "restore").length;
      expect(restores).toBe(saves);
    }
  });
});
