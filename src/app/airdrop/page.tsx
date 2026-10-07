"use client";

// /airdrop — Merkle airdrop board + proof rehearsal (E2.5 / P6.1).
// Public page: shows the current rehearsal root and lets anyone look up a
// wallet's capped weight + inclusion proof, VERIFIED IN-BROWSER with the same
// pure merkle module the server used (no trust in our own API needed).
// Honest language everywhere: rehearsal, testnet, nothing claimable yet.
import { useCallback, useEffect, useState } from "react";
import { verifyProof, type MerkleProofStep } from "@/lib/merkle";

interface Board {
  ok: boolean;
  root: string;
  leafCount: number;
  totalPoints: number;
  flaggedCount: number;
  top: { wallet: string; points: number }[];
  meta?: { status?: string; cap?: number; language?: string; salt?: string };
}

interface ProofResp {
  ok: boolean;
  wallet?: string;
  points?: number;
  leaf?: string;
  index?: number;
  proof?: MerkleProofStep[];
  root?: string;
  verified?: boolean;
  error?: string;
}

export default function AirdropPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [wallet, setWallet] = useState("");
  const [proof, setProof] = useState<ProofResp | null>(null);
  const [localOk, setLocalOk] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/airdrop")
      .then((r) => r.json())
      .then((b: Board) => setBoard(b))
      .catch(() => {});
  }, []);

  const lookup = useCallback(async () => {
    const w = wallet.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(w)) return;
    setBusy(true);
    setProof(null);
    setLocalOk(null);
    try {
      const r = (await fetch(`/api/airdrop?proof=${encodeURIComponent(w)}`).then((x) =>
        x.json(),
      )) as ProofResp;
      setProof(r);
      if (r.ok && r.leaf && r.proof && r.root) {
        // re-verify IN THE BROWSER — the API's own "verified" is not trusted
        setLocalOk(await verifyProof(r.leaf, r.proof, r.root));
      }
    } catch {
      setProof({ ok: false, error: "lookup failed" });
    } finally {
      setBusy(false);
    }
  }, [wallet]);

  return (
    <main className="cc-airdrop">
      <h1 className="cc-airdrop-title">WICK AIRDROP BOARD</h1>
      <p className="cc-airdrop-sub">Merkle rehearsal · testnet · nothing claimable yet</p>

      <section className="cc-airdrop-card">
        <div className="cc-airdrop-row">
          <span className="cc-airdrop-k">STATUS</span>
          <span>{board?.meta?.status ?? "…"}</span>
        </div>
        <div className="cc-airdrop-row">
          <span className="cc-airdrop-k">ROOT</span>
          <span className="cc-airdrop-mono">{board?.root ? `${board.root.slice(0, 24)}…` : "—"}</span>
        </div>
        <div className="cc-airdrop-row">
          <span className="cc-airdrop-k">WALLETS</span>
          <span>{board ? board.leafCount : "—"}</span>
        </div>
        <div className="cc-airdrop-row">
          <span className="cc-airdrop-k">WEIGHTS (SUM)</span>
          <span>{board ? board.totalPoints.toLocaleString() : "—"}</span>
        </div>
        <div className="cc-airdrop-row">
          <span className="cc-airdrop-k">PER-WALLET CAP</span>
          <span>{board?.meta?.cap ?? "—"}</span>
        </div>
        {board && board.flaggedCount > 0 && (
          <div className="cc-airdrop-row">
            <span className="cc-airdrop-k">FLAGGED (REVIEW)</span>
            <span>{board.flaggedCount}</span>
          </div>
        )}
      </section>

      <section className="cc-airdrop-card">
        <div className="cc-airdrop-row">
          <span className="cc-airdrop-k">PROOF LOOKUP</span>
          <span className="cc-airdrop-lookup">
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              className="cc-airdrop-input"
            />
            <button className="cc-airdrop-btn" onClick={lookup} disabled={busy}>
              {busy ? "…" : "CHECK"}
            </button>
          </span>
        </div>
        {proof && !proof.ok && <p className="cc-airdrop-note">{proof.error}</p>}
        {proof?.ok && (
          <div className="cc-airdrop-proof">
            <p>WEIGHT: <b>{(proof.points ?? 0).toLocaleString()}</b> · LEAF #{proof.index}</p>
            <p className="cc-airdrop-mono">leaf {proof.leaf?.slice(0, 20)}…</p>
            <p>
              SERVER: {proof.verified ? "verified" : "FAILED"} · BROWSER:{" "}
              {localOk === null ? "…" : localOk ? "verified" : "FAILED"}
            </p>
            <p className="cc-airdrop-note">
              the proof recomputes to the root in your browser — no trust in this page required
            </p>
          </div>
        )}
      </section>

      {board && board.top.length > 0 && (
        <section className="cc-airdrop-card">
          <div className="cc-airdrop-k">TOP WEIGHTS (CURRENT SNAPSHOT)</div>
          {board.top.map((t, i) => (
            <div key={t.wallet} className="cc-airdrop-row">
              <span className="cc-airdrop-mono">#{i + 1} {t.wallet.slice(0, 10)}…{t.wallet.slice(-6)}</span>
              <span>{t.points.toLocaleString()}</span>
            </div>
          ))}
        </section>
      )}

      <p className="cc-airdrop-note">
        {board?.meta?.language ??
          "weights are entitlements built by playing — distributions, if any, happen after graduation; nothing guaranteed"}
      </p>
    </main>
  );
}
