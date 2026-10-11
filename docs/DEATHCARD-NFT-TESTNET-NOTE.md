# Death Card NFT on Robinhood Chain testnet — feasibility note v0

> Registered 2026-10-10 per owner question ("can we mint the Death Card as an NFT
> on testnet for users?"). **DEPLOYED 2026-10-10 evening** (see §0.1) — the
> contract is live, owned by the $WICK launch wallet, with the burner as the
> owner-revocable server minter. Next build item: the claim route.

## 0. Implementation status (2026-10-10, same day) — build STARTED

Architecture B (server minter) confirmed as the build path. Done today:

| Piece | State |
|---|---|
| `contracts/CCDeathCard.sol` — minimal non-upgradeable ERC-721 + Metadata, `mint(to, runKey, metadata)` gated to owner-or-minter, **on-chain mint-once per run key** (`mintedByRun`), inline-JSON `tokenURI`, **transferable ownership** (`setOwner` + `setMinter` + events — the owner can rotate/revoke the minter at any time) | compiled with solc (optimizer 200, paris EVM) → ~4.6 KB creation code; canonical selectors verified (`tokenURI` 0xc87b56dd, `owner` 0x8da5cb5b, `mint` 0x517e7514) |
| `src/lib/deathcard/{abi,bytecode}.json` — committed build artifacts | rebuilt via `bun scripts/deathcard/build-deathcard.ts`; app never imports solc |
| `src/lib/eth-tx.ts` — raw EIP-155 legacy tx signer (hand RLP + audited @noble primitives, zero heavy deps) + mint calldata encoder + ABI string decoder | **pinned to the canonical EIP-155 spec example** in `test/eth-tx.test.ts` (signing hash daf5a7…, v=37, raw bytes, sender 0x9d8a62f6…); suite 370/370 |
| Minter wallet (dedicated, mint() is its ONLY power) | **v2 regenerated 2026-10-10 evening** after v1 was lost to a sandbox reset (v1 `0xecee1206b478ee2a0dec7f6e19f69e64f10b05f6`, funded ≈0.0095 tETH by the owner's faucet claim, was a raw-key wallet with NO seed phrase — the key existed only at `~/.cc-minter-key` inside the reset sandbox; those testnet funds are stranded). v2 address **0xac83679428276ba81ac4ca9d1f5769af179a89bd**; custody now 3-layer: owner chat backup + local 0600 `~/.cc-minter-key` + GitHub repo secret `MINTER_KEY` (sealed into BOTH Actions and Codespaces secret stores, verified 2026-10-10T19:52Z) — a sandbox reset can no longer orphan the wallet. Raw-key design kept deliberately: no mnemonic exists by design, the private key IS the wallet. **Ownership model (owner's plan, implemented 2026-10-10 night):** the burner DEPLOYS, then the deploy script's `DEATHCARD_OWNER` step transfers contract ownership to the $WICK launch wallet (0x3cF5…f683) in the same run; the burner key is intentionally NOT destroyed — it remains the owner-REVOCABLE server minter (revocation via setMinter from the launch wallet is reversible, auditable and keeps the auto-mint claim UX alive; deleting the key instead would force every user mint through a manual owner-signed tx). |
| `scripts/deathcard/deploy.ts` — preflight (chainId/balance) → estimate → sign → send → poll receipt → verify name/symbol/owner → **auto hand-over: `DEATHCARD_OWNER` env → setOwner() to the project's real wallet + on-chain verify** → writes `src/lib/deathcard/address.json` (records deployer/owner/minter/block) | **RAN LIVE 2026-10-10** — deploy tx mined; the setOwner step crashed on the hex-calldata signer bug (§0.1) and was completed via `handover.ts` |
| `scripts/deathcard/handover.ts` — completes/repairs a partially-done deploy: recovers deploy provenance from `--txhash` receipt (explorer txlist is the source for the hash — historical `eth_getCode` is state-pruned on this RPC), verifies owner()==burner, runs setOwner(), on-chain-verifies, writes `address.json` | used for the real hand-over 2026-10-10 |
| `scripts/deathcard/recover-address.ts` — deterministic CREATE-address derivation (keccak(rlp([sender, nonce]))[12:]) + on-chain code/name/symbol/owner/minter check | recovered the live contract address from (burner, nonce 0) — matched the explorer exactly |
| **Funding blocker (RESOLVED 2026-10-10 evening)** | ~~faucet requires Cloudflare+Google (human-only)~~ — resolved via the FASTER ALTERNATIVE: the owner sent exactly **0.007 tETH from the $WICK launch wallet (0x3cF5…f683) to the minter** (explorer-verified: tx 0x5fa4d7d3…fd68, 21000 gas, block 132510295). Deploy consumed 1,055,510 gas × 0.01 gwei ≈ 0.0000106 tETH — **~1/663 of the deposit**; the remainder (≈0.006989 tETH) covers ≈5,400 mints of gas headroom (mint ≈ 130k gas at current prices). |

### 0.1 Deployment record (2026-10-10, live on Robinhood Chain testnet)

| Fact | Value |
|---|---|
| Contract | **CCDeathCard — "Candle Climber Death Card" (CCDC)** |
| Address | `0x3e2735c670ac6d6412a79153602d7e9c58640c64` |
| Chain | Robinhood Chain testnet, chainId 46630 (`0xb626`) |
| Deploy tx | `0x0514b6ca663255003aad23b405a089c18d50f88d136bf4b7cca1684803f6c046` |
| Block / time | 132511064 · 2026-10-10T20:27:21Z · gas used 1,055,510 |
| Deployer (burner) | `0xac83679428276ba81ac4ca9d1f5769af179a89bd` |
| **Owner (ultimate control)** | **`0x3cf571c7554725a9b929e4dcfa75f433436cf683` — the $WICK launch wallet** (setOwner tx `0xbefb0de336afd6cf7edc72fa17742e99c410703538996b73ca14bb2bea3a404e`, verified on-chain; launch wallet can rotate/revoke the minter via `setMinter` anytime) |
| Minter (server automation) | `0xac83679428276ba81ac4ca9d1f5769af179a89bd` (the burner — owner-revocable) |
| Recorded | `src/lib/deathcard/address.json` (committed) |

**The live incident (honest record):** the deploy run signed the setOwner calldata as a hex STRING; `rlpEncode` only accepts bytes/lists and died with `item.map is not a function` — AFTER the creation tx was already mined. Consequences and handling:
- Contract was live but owner==burner and `address.json` was never written.
- Root cause fixed in `src/lib/eth-tx.ts`: `signLegacyTx` now normalizes hex-string calldata (`dataBytes()`), and `rlpEncode` fails LOUD on wrong types with a self-explanatory message. 3 regression tests added (`test/eth-tx.test.ts`) — suite 373/373.
- The deploy tx hash was lost to output truncation; recovered from the official explorer API (`explorer.testnet.chain.robinhood.com/api?module=account&action=txlist&address=<burner>` — the deterministic CREATE derivation (`recover-address.ts`) independently confirmed the same address). Note: historical-state `eth_getCode` is pruned on this RPC, so block-scanning is impossible — explorer or receipt lookups only.
- `handover.ts` completed the interrupted sequence: provenance cross-check → setOwner → on-chain verify → record. Final state verified twice (script + raw curl).

Next steps: claim route
(`/api/deathcard/claim`: run-token + wallet-proof verification, archive/practice
exclusion, Mongo idempotency, honest failure copy) → Death Card "MINT (TESTNET)"
button → e2e real-browser mint proof.

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
