# Death Card NFT on Robinhood Chain testnet — feasibility note v0

> Registered 2026-10-10 per owner question ("can we mint the Death Card as an NFT
> on testnet for users?"). **Feasibility only — no contract, no route, no promise.**
> If green-lit it becomes the LAST coding item before the visual phase (owner's call).

---

## 1. What already exists (all shipped, tested, on main)

| Piece | Where | State |
|---|---|---|
| Death card renderer with honest run facts | `src/game/cc/deathcard.ts` + GameCanvas integration | live |
| Wallet connect + cryptographic ownership proof | WalletChip + `wallet-proof.ts` (LAW 1.2 hardened, `personal_sign`) | live |
| Public testnet RPC read path | `rpc.testnet.chain.robinhood.com`, chainId **46630** (`0xb626`) | verified in `docs/ROBINHOOD-CHAIN-INTEGRATION.md` |
| Testnet gas faucet | `faucet.testnet.chain.robinhood.com` | official |
| Testnet/canonical asset separation discipline | `TESTNET_FAUCET_TOKENS` vs `VERIFIED_STOCK_FEEDS` registries | pinned by tests |

## 2. What is missing (the actual build)

1. **ERC-721 contract** — tiny, non-upgradeable, deployed once on testnet by us;
   address + ABI committed to the repo with deploy notes.
2. **Mint path** — two architectures:
   - **A) user-signed tx:** user pays testnet gas (faucet exists) + app gains a
     full wallet-tx flow. Most "real", most friction; also our **first
     tx-sending feature** (today the app only `eth_call`s — it never writes).
   - **B) backend minter / claim (recommended v0):** death card gains a "Mint"
   button; a key-protected server route submits the tx and pays testnet gas;
   user verifies on the explorer. Cleaner UX, still on-chain and user-owned,
   keeps the first tx surface server-side where retries are controlled.
3. **Metadata = the card's existing facts only:** ticker + terrain source,
   peak height, UTC date, interval, rank. Nothing invented, no scarcity claims,
   no utility promises.
4. **Gating:** mint is **optional and wallet-only**; guest mode byte-unchanged;
   archive/practice runs are NOT mintable (they are submission-suppressed — that
   honesty carries over); idempotent mint-once per run id.

## 3. Red lines / honesty notes

- A **testnet** NFT has zero monetary value by definition — the copy frames it as
  "prove the loop / collector demo" (language law: never imply worth).
- A mainnet version later = real gas + a who-pays decision + the LAW 5.1 PR
  checklist + a post-graduation lane — it is NOT part of this note's scope.
- First tx-sending feature ⇒ new failure surface (stuck/failed tx) needs honest
  failure copy and retry-safe design (one mint per run id, server-side
  idempotency).
- The mint must never sit between a player and the next run: play flow untouched,
  mint is a post-death detour.
