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

// ---- Wallet-link proof (practice / prediction / vault) ---------------------
// LU-2: purpose-separated from the board proof — a different canonical message
// means a board signature can never be replayed as a wallet-link proof and vice
// versa. Binds the wallet to a purpose + date + timestamp so the same proof
// cannot be replayed across routes or days.

export interface WalletLinkFields {
  wallet: string;
  purpose: "practice" | "prediction" | "vault";
  date: string; // UTC date the proof is for
}

/**
 * The exact string the wallet signs via personal_sign to prove ownership when
 * linking a wallet to a weights/vault action (NOT a board submission). Both
 * sides must produce byte-identical output.
 */
export function buildWalletLinkProofMessage(f: WalletLinkFields, clientTs: number): string {
  const wallet = String(f.wallet).toLowerCase();
  return [
    "Candle Climber — wallet link proof",
    "Sign once to verify wallet ownership for this action.",
    "",
    `Purpose: ${f.purpose}`,
    `Date: ${f.date}`,
    `Run time: ${clientTs}`,
    `Wallet: ${wallet}`,
  ].join("\n");
}

// ---- Death Card mint proof (TESTNET) ---------------------------------------
// Purpose-separated from the board proof: a different canonical message means a
// board signature can never be replayed as a mint request and vice versa. The
// fields bind the SAME clamped run values + the verified token's date/interval,
// so the mint signature is also single-use by construction.

/**
 * The exact string the wallet signs via personal_sign to authorize the server
 * minter to mint their Death Card. Both sides must produce byte-identical
 * output — the client mirrors board-validation's clamps before templating.
 */
export function buildMintProofMessage(f: ProofFields, clientTs: number): string {
  const wallet = String(f.wallet).toLowerCase();
  const score = Math.floor(Number(f.score));
  const candles = Math.floor(Number(f.candlesPassed));
  const streak = Math.max(0, Math.min(999, Math.floor(Number(f.bestStreak))));
  return [
    "Candle Climber — Death Card mint (TESTNET)",
    "Sign once to mint this run's Death Card to your wallet.",
    "Minting is free — the server pays testnet gas. No value is implied.",
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

// ---- Signal Forge official-board proof (Phase 1) ---------------------------
// Purpose-separated from the classic board/mint proofs: a different canonical
// template means a Candle Climber signature can never be replayed into the
// Forge board and vice versa. Binds the wallet to ONE run's clamped fields +
// the verified token's date, so the signature is single-use by construction.

export interface ForgeProofFields {
  score: number; // clamped exactly like forge-board-validation (Math.floor)
  survivalTime: number; // clamped exactly like forge-board-validation (Math.floor)
  signalsCollected: number; // clamped exactly like forge-board-validation (Math.floor)
  date: string; // UTC date pinned from the VERIFIED forge token payload
  wallet: string; // claimed address — compared/templated lowercase
}

/**
 * The exact string the wallet signs via personal_sign for a Forge official
 * submission. Both sides must produce byte-identical output — the client
 * mirrors forge-board-validation's clamps before templating.
 */
export function buildForgeProofMessage(f: ForgeProofFields, clientTs: number): string {
  const wallet = String(f.wallet).toLowerCase();
  const score = Math.floor(Number(f.score));
  const survived = Math.floor(Number(f.survivalTime));
  const signals = Math.floor(Number(f.signalsCollected));
  return [
    "Signal Forge — official board proof",
    "Sign once to verify wallet ownership for this run.",
    "No value is implied.",
    "",
    `Score: ${score}`,
    `Survived: ${survived}s`,
    `Signals: ${signals}`,
    `Date: ${f.date}`,
    `Run time: ${clientTs}`,
    `Wallet: ${wallet}`,
  ].join("\n");
}

// ---- Chain City server save proof (Phase 2) --------------------------------
// Purpose-separated from every other proof (its own canonical template), so no
// existing signature can be replayed into the city-save route. Binds the wallet
// to the save's board-relevant summary + the client timestamp — the proof's job
// is IDENTITY (nobody overwrites another wallet's city), not score integrity.

export interface CitySaveProofFields {
  wallet: string;
  cityLevel: number;
  buildingsCount: number;
  savedAt: number; // the save's client timestamp (ms) — same value the body carries
}

/**
 * The exact string the wallet signs via personal_sign to save a Chain City to
 * the server under their wallet. Both sides must produce byte-identical output.
 */
export function buildCitySaveProofMessage(f: CitySaveProofFields, clientTs: number): string {
  const wallet = String(f.wallet).toLowerCase();
  const level = Math.floor(Number(f.cityLevel));
  const buildings = Math.floor(Number(f.buildingsCount));
  const savedAt = Math.floor(Number(f.savedAt));
  return [
    "Chain City — server save proof",
    "Sign once to save this city under your wallet.",
    "No value is implied.",
    "",
    `City level: ${level}`,
    `Buildings: ${buildings}`,
    `Saved at: ${savedAt}`,
    `Run time: ${clientTs}`,
    `Wallet: ${wallet}`,
  ].join("\n");
}
