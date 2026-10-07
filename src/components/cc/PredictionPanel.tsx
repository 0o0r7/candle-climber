"use client";

// PredictionPanel — Route Prediction UI (E2.3 / P4.6 / H5).
// "TOMORROW'S MARKET": lock one call per day on tomorrow's rotation symbol —
// direction, move size, dominant tail. Scored next day against the REAL closed
// daily candle; points (max 10) land in the weights ledger automatically.
// LAW 1: display-only — the game never reads this panel, scores never change.
// LAW 4: "builds airdrop weights", testnet stated plainly, nothing guaranteed.
import { useCallback, useEffect, useState } from "react";
import { pickSeed } from "@/game/cc/level-source";
import { utcDateStr } from "@/game/cc/rng";
import { nextUtcDate } from "@/lib/prediction";
import { WALLET_ADDRESS_KEY } from "@/lib/wallet";

type Dir = "up" | "down";
type Vol = "low" | "mid" | "high";
type Tail = "top" | "bottom" | "none";

interface MineRow {
  targetDate: string;
  symbol: string;
  call: { dir: Dir; vol: Vol; tail: Tail };
  status: "open" | "scored" | "void";
  result?: { dirOk: boolean; volOk: boolean; tailOk: boolean; points: number } | null;
}

interface PredResp {
  ok: boolean;
  mine?: MineRow[];
  tomorrow?: { date: string; symbol: string };
  error?: string;
}

const DIRS: Dir[] = ["up", "down"];
const VOLS: Vol[] = ["low", "mid", "high"];
const TAILS: Tail[] = ["top", "bottom", "none"];

export default function PredictionPanel({ name }: { name: string }) {
  const [tomorrow, setTomorrow] = useState<{ date: string; symbol: string } | null>(null);
  const [dir, setDir] = useState<Dir | null>(null);
  const [vol, setVol] = useState<Vol | null>(null);
  const [tail, setTail] = useState<Tail | null>(null);
  const [mine, setMine] = useState<MineRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const identity = name.trim();

  useEffect(() => {
    // the rotation is deterministic — the panel can show tomorrow's symbol
    // before the server ever pins it (the server re-pins at submit time anyway)
    const t = utcDateStr();
    setTomorrow({ date: nextUtcDate(t), symbol: pickSeed(nextUtcDate(t)).symbol });
  }, []);

  const refresh = useCallback((who: string) => {
    if (!who) return;
    fetch(`/api/prediction?name=${encodeURIComponent(who)}`)
      .then((r) => r.json())
      .then((r: PredResp) => {
        setMine(r.mine ?? []);
        if (r.tomorrow) setTomorrow(r.tomorrow);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh(identity);
  }, [identity, refresh]);

  const last = mine[0];
  const lockedForTomorrow = last?.status === "open" && tomorrow && last.targetDate === tomorrow.date;

  const submit = useCallback(async () => {
    if (!identity || !dir || !vol || !tail || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/prediction", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: identity,
          call: { dir, vol, tail },
          address: localStorage.getItem(WALLET_ADDRESS_KEY) ?? undefined,
        }),
      });
      const r = (await res.json()) as PredResp;
      if (res.status === 409) setMsg("TOMORROW'S CALL ALREADY LOCKED");
      else if (!res.ok || !r.ok) setMsg((r.error ?? "LOCK FAILED").toUpperCase());
      else {
        setMsg("CALL LOCKED — SCORES TOMORROW VS THE REAL CANDLE");
        setDir(null);
        setVol(null);
        setTail(null);
      }
      refresh(identity);
    } catch {
      setMsg("LOCK FAILED — TRY AGAIN");
    } finally {
      setBusy(false);
    }
  }, [identity, dir, vol, tail, busy, refresh]);

  if (!tomorrow) return null;

  const row = (label: string, opts: readonly string[], cur: string | null, set: (v: never) => void) => (
    <div className="cc-pred-row">
      <span className="cc-pred-label">{label}</span>
      <span className="cc-pred-chips" role="radiogroup" aria-label={label}>
        {opts.map((o) => (
          <button
            key={o}
            role="radio"
            aria-checked={cur === o}
            className={`cc-pred-chip${cur === o ? " cc-pred-on" : ""}`}
            onClick={() => set(o as never)}
          >
            {o.toUpperCase()}
          </button>
        ))}
      </span>
    </div>
  );

  return (
    <div className="cc-pred">
      <button className="cc-report-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="cc-report-arrow" aria-hidden>{open ? "▾" : "▸"}</span>
        TOMORROW&apos;S MARKET · {tomorrow.symbol} · {tomorrow.date}
      </button>
      {open && (
        <div className="cc-pred-body">
          {!identity ? (
            <p className="cc-pred-note">SET YOUR CLIMBER NAME ABOVE, THEN LOCK A CALL</p>
          ) : lockedForTomorrow ? (
            <p className="cc-pred-note">
              LOCKED: {last.call.dir.toUpperCase()} · {last.call.vol.toUpperCase()} ·{" "}
              {last.call.tail.toUpperCase()} — SCORES TOMORROW
            </p>
          ) : (
            <>
              {row("DIR", DIRS, dir, setDir)}
              {row("MOVE", VOLS, vol, setVol)}
              {row("TAIL", TAILS, tail, setTail)}
              <button
                className="cc-pred-lock"
                onClick={submit}
                disabled={busy || !dir || !vol || !tail}
              >
                {busy ? "…" : "LOCK TOMORROW'S CALL"}
              </button>
            </>
          )}
          {msg && <p className="cc-pred-note" role="status">{msg}</p>}
          {last?.status === "scored" && last.result && (
            <p className="cc-pred-note">
              LAST CALL ({last.targetDate}): {last.result.points}/10 WEIGHTS
            </p>
          )}
          <p className="cc-pred-note">
            scored vs the real daily candle · up to 10 weights · builds airdrop
            weights, nothing guaranteed · testnet
          </p>
        </div>
      )}
    </div>
  );
}
