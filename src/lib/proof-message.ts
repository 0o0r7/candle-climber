// Official-board ownership proof — CANONICAL MESSAGE TEMPLATE (LAW 1.2 hardening).
// This module is deliberately ISOMORPHIC and dependency-free: the browser builds
// the exact same bytes the server verifies, so it must not import anything that
// drags node-only or heavy crypto code into the client bundle (the verifier in
// wallet-proof.ts imports this; GameCanvas imports only this).
//
// The message binds the wallet to ONE submission's clamped fields (score,
// candles, streak) + the run token's date/interval + a client timestamp — so a
// signature is single-use by construction: any changed field invalidates it,
// and a replay of the identical submission is a no-op (best-run-per-wallet
// dedupe keeps the official lane idempotent).

export interface ProofFields {
  score: number; // clamped exactly like board-validation (Math.floor)
  candlesPassed: number; // clamped exactly like board-validation (Math.floor)
  bestStreak: number; // clamped exactly like board-validation (0..999)
  date: string; // UTC date pinned from the VERIFIED run token payload
  interval: string; // timeframe pinned from the VERIFIED run token payload
  wallet: string; // claimed address — compared/templated lowercase
}

/**
 * The exact string the wallet signs via personal_sign (EIP-191). Both sides
 * must produce byte-identical output — the client mirrors board-validation's
 * clamps (Math.floor / 0..999 streak) before templating.
 */
export function buildProofMessage(f: ProofFields, clientTs: number): string {
  const wallet = String(f.wallet).toLowerCase();
  const score = Math.floor(Number(f.score));
  const candles = Math.floor(Number(f.candlesPassed));
  const streak = Math.max(0, Math.min(999, Math.floor(Number(f.bestStreak))));
  return [
    "Candle Climber — official board proof",
    "Sign once to bind this run to your wallet.",
    "",
    `Score: ${score}`,
    `Candles passed: ${candles}`,
    `Best streak: ${streak}`,
    `Date: ${f.date}`,
    `Interval: ${f.interval}`,
    `Run time: ${clientTs}`,
    `Wallet: ${wallet}`,
  ].join("\n");
}
