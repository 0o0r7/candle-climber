# Robinhood Chain integration — what is REALLY connected (W6)

> Written for the "real connection" workstream. Every claim below is either
> (a) traced to a primary/official source with a link, (b) proven by a live read
> captured in this repo, or (c) explicitly marked NOT connected. No middle
> ground: nothing here is inferred from marketing copy.

## 1. The distinction this workstream exists to make

Two different asset sets live on Robinhood Chain testnet, and conflating them is
the mistake this document prevents:

| | Testnet **faucet Stock Tokens** | **Canonical Robinhood Stock Tokens** |
|---|---|---|
| Chain | 46630 (testnet) | 4663 (mainnet) |
| How you get them | free daily claim at `faucet.testnet.chain.robinhood.com` | secondary market / RFQ (permissioned primary) |
| Price feed | **mock** (production feeds are mainnet-only) | **real Chainlink** feed per ticker |
| Addresses published in official docs | **no** | **yes** — `docs.robinhood.com/chain/contracts` |
| Example TSLA | `0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E` | `0x322F0929c4625eD5bAd873c95208D54E1c003b2d` |

A ticker match (`TSLA` = `TSLA`) therefore says **nothing** about contract
identity, and the testnet token's feed is not a price source. Candle Climber
prices stocks from the **mainnet** feed and uses the testnet token for **identity
only**.

Sources: [Connecting to Robinhood Chain](https://docs.robinhood.com/chain/connecting)
(chain ids, RPC) · [Token Contracts](https://docs.robinhood.com/chain/contracts)
(canonical addresses) · [Oracles & Price Feeds](https://docs.robinhood.com/chain/oracles-and-price-feeds) ·
[Building with Stock Tokens](https://docs.robinhood.com/chain/building-with-stock-tokens) ·
[Chainlink Robinhood tokenized equities](https://docs.chain.link/data-feeds/tokenized-equity-feeds/robinhood) ·
[Arbitrum: build your first Robinhood Chain app](https://blog.arbitrum.foundation/build-your-first-dapp-on-robinhood-chain/)
(testnet tokens are real, testnet feeds are mock).

## 2. Live evidence (captured 2026-10-07 from this sandbox)

Read over the public RPC with plain `eth_call` — no key, no vendor:

```
POST https://rpc.mainnet.chain.robinhood.com
  eth_chainId        -> 0x1237  = 4663   (mainnet)
POST https://rpc.testnet.chain.robinhood.com
  eth_chainId        -> 0xb626  = 46630  (testnet)

latestRoundData() on the mainnet Chainlink feeds, decimals() = 8 in each case:
  TSLA 0x7A6b81ba7FbCB90104d8C496158Cf383cD7233b1 -> 37633000000 -> $376.33  (round 1472, updatedAt 1791381868)
  AMZN 0x93503dFc97157cdB8aADcCaf70452621d598FDeb -> 25928000000 -> $259.28  (round  893, updatedAt 1791390012)
  NVDA 0xC9d16E4f2569b9E3ea0468fD85844953713DC2a2 -> 23719372047 -> $237.19
  AAPL 0xBb11A21267cFDb63d4935d99a499133DD1744ACb -> 33640932687 -> $336.41

symbol() on the TESTNET faucet token 0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E -> "TSLA", decimals() = 18
```

Feed addresses were resolved from Chainlink's own directory
(`reference-data-directory.vercel.app/feeds-robinhood-mainnet.json`); the values
above were read back from the resolved proxies, so address and answer agree.

End-to-end from the running app (real numbers, not illustrations):

```
GET /api/candles?symbol=TSLA
  seed.source = "yahoo"                      # real weekly OHLC, 522 candles
  seed.onchain = { price: 376.33, feed: 0x7A6b…, chainId: 4663,
                   anchorPrice: 370.59, deltaPct: -1.53, verified: true }
```

The served terrain's last close ($370.59) sits 1.53% from the official on-chain
price ($376.33) — inside the 10% honesty bound, so `verified: true`. The delta is
**reported**, never hidden by rescaling the chart.

## 3. Truth table

| Claim | Official source | What the code actually does | Status |
|---|---|---|---|
| "Candle Climber reads the official Robinhood Chain stock price" | Chainlink Robinhood tokenized-equity feeds; docs.robinhood.com | `src/lib/robinhood-chain.ts` reads `latestRoundData()` + `decimals()` over mainnet JSON-RPC, validates the chain/answer/round/staleness | **REAL — verified** |
| "Feed addresses are official, not invented" | Chainlink reference-data directory | `resolveOfficialFeed` fetches the directory (6h cache) with a verified snapshot fallback; unresolved tickers return `null` | **REAL — verified** |
| "Stock levels are checked against the official on-chain price" | — | `seed.onchain` attaches the quote + `deltaPct` + `verified`; the HUD shows an `ON-CHAIN <SYM> $…` chip | **REAL — verified** |
| "Testnet tokens and official tokens are kept apart" | docs.robinhood.com/chain/contracts; Arbitrum blog | Separate registries (`TESTNET_FAUCET_TOKENS` vs `VERIFIED_STOCK_FEEDS`); testnet used for identity, mainnet for price | **REAL — verified** |
| "Stock terrain is a live on-chain OHLC series" | — | No such series exists on-chain; the feed is a **spot** price. Terrain comes from Yahoo/stooq OHLC, or (no OHLC) the derived shape anchored to the official price | **NOT connected — impossible as stated** |
| "Stock terrain is synthetic even when the feed is up" (the old complaint) | — | When OHLC fails, terrain is now anchored to the official on-chain price and labeled `OFFICIAL PRICE`, not `SYNTHETIC` | **FIXED** |
| "Every stock ticker has an official feed" | Chainlink directory | Only published tickers resolve. **NFLX has no official feed** → `onchain` absent, honest degrade | **HONEST GAP** |
| "Archive levels are verified against the official price" | — | Deliberately skipped: an archive date is a past chart, so today's price is not comparable | **BY DESIGN** |

## 4. What is NOT connected, and why

- **On-chain candle history.** Robinhood Chain publishes a *spot* price per
  ticker, not OHLC. The terrain shape therefore cannot come from the chain alone;
  it comes from a real OHLC feed when one is reachable, otherwise from the
  deterministic shape anchored to the official price. This is why
  `seed.source = "robinhood"` is labeled **derived** and never "live data".
- **Testnet price data.** Testnet Stock Token feeds are mock by design, so no
  testnet price is ever read. All prices come from mainnet chain 4663.
- **NFLX.** No official feed is published for it, so it degrades honestly
  (real OHLC if reachable, otherwise synthetic). Claiming otherwise would be a
  fabricated connection.

## 5. Prerequisites for a *full* terrain connection

To make stock terrain genuinely on-chain rather than anchored:

1. An official OHLC (or historical-price) source on Robinhood Chain — today the
   docs publish only per-ticker spot feeds.
2. Or a licensed historical equity series reachable from the server (the current
   Yahoo/stooq path is free-but-best-effort; Yahoo rate-limits at 429 and stooq
   challenges datacenter IPs, which is what pushes stocks to the anchored path).
3. A published feed address for each ticker we want to serve (NFLX currently has
   none).

Until (1) or (2) exists, the honest maximum is what ships here: a **verified
official price** on every stock level, with the terrain's agreement with it
reported in the open.

## 6. How to re-verify

```bash
# THE repeatable live connection test (stages: reachability → feeds → identity → error behaviour)
bun scripts/verify-feeds.ts          # exit 0 = all feeds verified · 1 = feed failure · 2 = network unreachable
bun scripts/verify-feeds.ts --json   # same, machine-readable (CI/cron)

# official price, live (no game involved)
curl -s "http://localhost:3000/api/onchain/quote?symbol=TSLA"
# the level carries the verification
curl -s "http://localhost:3000/api/candles?symbol=TSLA" | python3 -m json.tool | head -40
# unit contract (zero network, fixtures captured from the live reads above)
docker compose -f docker-compose.base44.yml exec -T web bun test test/robinhood-chain.test.ts
```

`scripts/verify-feeds.ts` is deliberately built so the two failure kinds can never
be confused: a transport failure is reported as **NETWORK** (exit 2) and is never
described as a bad feed; a feed that returns nothing while the chain *is*
reachable is a **DATA** failure (exit 1). Its stage 4 is two negative controls — a
ticker with no published feed (`NFLX`) must resolve to `null`, and a dead RPC must
return `null` classified as network.

Update `VERIFIED_STOCK_FEEDS` only together with a fresh captured read, and note
the date — the directory remains the primary source of truth at runtime.

## 7. Re-verified 2026-10-10 (latest captured run)

`bun scripts/verify-feeds.ts` → exit **0**, all four stages OK:

```
1 reachability  OK      mainnet 4663 · testnet 46630 · directory 58 entries
2 official feeds OK      TSLA $382.95 (round 1491) · AMZN $261.87 (909) · NVDA $230.36 (1203)
                        AAPL $336.63 (732) · MSFT $534.98 (893) · SPY $780.06 (162)
                        — all resolved via the Chainlink DIRECTORY (not the snapshot), none stale
3 testnet identity OK    TSLA/AMZN/NFLX faucet ERC-20s read symbol()+decimals() — NO price read
4 error behaviour OK     NFLX (no published feed) → null · dead RPC → null (network)
```

End-to-end from the running app the same day:

```
GET /api/candles?symbol=TSLA
  seed.source = "yahoo"                       # real weekly OHLC
  seed.onchain = { price: 382.95, feed: 0x7A6b…, chainId: 4663, roundId: 1491,
                   anchorPrice: 370.59, deltaPct: -3.23, verified: true }
```

Note the feed values *moved* between the 2026-10-07 capture ($376.33) and this one
($382.95) — the read is live, not a stored fixture; the fixtures in
`test/robinhood-chain.test.ts` remain the frozen 2026-10-07 payloads by design.

Update `VERIFIED_STOCK_FEEDS` only together with a fresh captured read, and note
the date — the directory remains the primary source of truth at runtime.
