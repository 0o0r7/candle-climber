// Graduation-meter read (E4.1 economy dashboard v0) — the SAME verified shape
// the E0.4 snapshot ritual uses (docs/evidence/econ-snapshot-latest.json):
//   data.launch.curve.pairReserveUnits  = wei of ETH currently in the curve
//   data.launch.targetPairUnits         = 4 ETH net target (legacy factory)
//   data.launch.graduated / lifecycle   = the graduation gate inputs
// 5-minute cache; fail-open { ok:false } — the /ops page renders "n/a" honestly
// and nothing in the game depends on this read.
const PAD_LAUNCH_URL =
  process.env.PAD_API_URL ??
  "https://testnet.vibevibe.fun/api/v1/chains/46630/v6/launches/0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c";

export interface MeterRead {
  ok: boolean;
  lifecycle: string | null;
  graduated: boolean | null;
  reserveWei: string;
  targetWei: string;
  pct: number; // reserve/target × 100, 2 decimals (0 when unreadable)
  error?: string;
}

const CACHE_MS = 5 * 60_000;
let cached: { t: number; payload: MeterRead } | null = null;

export async function fetchMeter(): Promise<MeterRead> {
  if (cached && Date.now() - cached.t < CACHE_MS) return cached.payload;
  try {
    const res = await fetch(PAD_LAUNCH_URL, {
      headers: { "User-Agent": "candle-climber/ops-meter" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`pad api ${res.status}`);
    const json = (await res.json()) as {
      data?: {
        launch?: {
          lifecycle?: string;
          graduated?: boolean;
          targetPairUnits?: string;
          curve?: { pairReserveUnits?: string };
        };
      };
    };
    const l = json?.data?.launch;
    const reserve = BigInt(l?.curve?.pairReserveUnits ?? "0");
    const target = BigInt(l?.targetPairUnits ?? "0");
    const pct = target > 0n ? Number((reserve * 10_000n) / target) / 100 : 0;
    const payload: MeterRead = {
      ok: true,
      lifecycle: l?.lifecycle ?? null,
      graduated: typeof l?.graduated === "boolean" ? l.graduated : null,
      reserveWei: reserve.toString(),
      targetWei: target.toString(),
      pct,
    };
    cached = { t: Date.now(), payload };
    return payload;
  } catch (err) {
    return { ok: false, lifecycle: null, graduated: null, reserveWei: "0", targetWei: "0", pct: 0, error: (err as Error).message };
  }
}

/** wei → human ETH, 4-decimal truncated (display only). */
export function ethHuman(wei: string): string {
  try {
    const s = (BigInt(wei) / 10n ** 14n).toString();
    const whole = s.slice(0, -4) || "0";
    const frac = s.slice(-4).padStart(4, "0");
    return `${whole}.${frac}`;
  } catch {
    return "0.0000";
  }
}
