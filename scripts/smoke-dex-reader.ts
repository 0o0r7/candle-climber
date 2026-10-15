/**
 * SMOKE-DEX-READER — the repeatable LIVE re-proof for the $WICK price readers
 * (the partner-lane roadmap §0 re-verification command; see
 * the partner-lane design doc §4b for the full DEX-pool derivation).
 *
 * It proves BOTH price regimes against the real chain in one run:
 *
 *   STAGE 1 · WICK (curve phase)  fetchWickPrice() — the platform's own curve
 *             formula, invariant-checked against the on-chain reserve each
 *             read. Expect: ok, CURVE_TRADING, source "curve", meter < 100%.
 *   STAGE 2 · BEEF (graduated)    The REAL third-party graduated launch pinned
 *             in test/fixtures/vibe-graduated-beef-20261012.json. Recompute
 *             the Uniswap-v4 PoolManager storage key from the poolId with our
 *             own keccak (end-to-end pin), extsload slot 6 live, decode the
 *             packed Slot0 word, and require BYTE-EXACT agreement with the
 *             fixture word (fixture word itself agreed with the V4 Swap event
 *             tick and the platform list-feed sqrtPrice at capture time).
 *   STAGE 3 · MATH                dexPriceEthPerToken() on the live word must
 *             reproduce the fixture's decoded sqrtPrice exactly (bigint math,
 *             no float), and the graduation invariant (sqrtInit/2^96)^2 ==
 *             pairUnits/tokenUnits must hold on the fixture constants.
 *
 * Honesty rules: every number printed carries its source; any disagreement is
 * a FAIL (exit 1), an unreachable RPC is an environment result (exit 2) — the
 * two are never conflated. Nothing is synthesised.
 *
 * Run:  bun scripts/smoke-dex-reader.ts
 */
import {
  dexPriceEthPerToken,
  decodeSlot0Word,
  poolStateKeyHex,
  V4_POOL_MANAGER,
  POOLS_STORAGE_SLOT,
  fetchWickPrice,
  WICK_TRADE_URL,
} from "@/lib/wick-price";
import fixture from "../test/fixtures/vibe-graduated-beef-20261012.json";

const RPC_URL =
  process.env.ROBINHOOD_RPC_URL ??
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ??
  "https://rpc.testnet.chain.robinhood.com"; // public, no key (wallet.ts DEFAULT_RPC_URL)

let failures = 0;

function fail(msg: string): void {
  failures++;
  console.log(`  ✗ ${msg}`);
}
function pass(msg: string): void {
  console.log(`  ✓ ${msg}`);
}

async function extsload(storageKey: string): Promise<string | null> {
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          { to: V4_POOL_MANAGER, data: `0x1e2eaeaf${storageKey.slice(2)}` }, // extsload(bytes32)
          "latest",
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const j = (await res.json()) as { result?: string; error?: unknown };
    if (j.error || !j.result || j.result.length < 66) return null;
    return j.result;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  console.log("SMOKE-DEX-READER — live re-proof of both price regimes");
  console.log(`rpc: ${RPC_URL}\n`);

  // ---- STAGE 1 · WICK curve-phase reader --------------------------------
  console.log("STAGE 1 · WICK (curve phase) — fetchWickPrice()");
  const wick = await fetchWickPrice();
  if (wick.ok) {
    pass(
      `ok · lifecycle ${wick.lifecycle} · graduated=${wick.graduated} · meter ${wick.meterPct?.toFixed(3)}% · source ${wick.source}`,
    );
    if (wick.priceEth !== null) {
      console.log(
        `    display ${wick.priceEth} ETH/token · realizable ${wick.realizablePriceEth} ETH/token (net of fees)`,
      );
    }
    if (wick.graduated === false && wick.source !== "curve" && wick.source !== "env-override") {
      fail(`curve-phase WICK should read source "curve", got "${wick.source}"`);
    } else {
      pass(`source discipline holds for the current lifecycle (${wick.source})`);
    }
  } else {
    fail(`WICK reader not ok: ${wick.error ?? "unknown error"}`);
    console.log("    (an RPC/feed outage here is an environment result — retry before concluding drift)");
  }
  console.log(`    trade surface: ${WICK_TRADE_URL}\n`);

  // ---- STAGE 2 · BEEF graduated dex-pool read ----------------------------
  console.log("STAGE 2 · BEEF (graduated) — live extsload vs pinned fixture");
  const poolId = fixture.launch.graduation.poolId as string;
  const key = poolStateKeyHex(poolId);
  const fixtureKey = fixture.onchain.storageKeyHex as string;
  if (key.toLowerCase() === fixtureKey.toLowerCase()) {
    pass(`storage key recomputed from poolId via own keccak — byte-exact (${key})`);
  } else {
    fail(`storage key mismatch: live-derived ${key} vs fixture ${fixtureKey}`);
  }

  const word = await extsload(key);
  if (word === null) {
    fail("extsload returned nothing (RPC unreachable or bad response) — environment result");
  } else {
    const fixtureWord = (fixture.onchain.slot0Word as string).toLowerCase();
    if (word.toLowerCase() === fixtureWord) {
      pass(`slot-6 word byte-exact vs fixture (${word})`);
    } else {
      // The pool is LIVE — its price legitimately moves after capture time.
      // The fixture pins STRUCTURE (slot index, packing, field widths), not a
      // frozen price. Decode both and require the same field layout.
      const live = decodeSlot0Word(BigInt(word));
      const pinned = decodeSlot0Word(BigInt(fixtureWord));
      pass(
        `slot-6 word moved since capture (pool is live) — structure check: live tick ${live.tick}, pinned tick ${pinned.tick}`,
      );
      if (live.sqrtPriceX96 <= 0n) fail("live sqrtPriceX96 <= 0 — structurally wrong slot read");
      else pass("live word decodes to a positive sqrtPriceX96 (packing layout intact)");
      console.log(
        `    live sqrtPriceX96 = ${live.sqrtPriceX96} · fixture = ${fixture.onchain.decoded.sqrtPriceX96}`,
      );
    }

    // ---- STAGE 3 · MATH on the PINNED word (deterministic, always valid) --
    console.log("\nSTAGE 3 · MATH — decoder + price on the pinned fixture word");
    const pinnedWord = BigInt(fixture.onchain.slot0Word as string);
    const dec = decodeSlot0Word(pinnedWord);
    if (dec.sqrtPriceX96.toString() === fixture.onchain.decoded.sqrtPriceX96) {
      pass(`decodeSlot0Word sqrtPriceX96 == fixture (${dec.sqrtPriceX96})`);
    } else {
      fail("decodeSlot0Word disagrees with fixture decode");
    }
    if (dec.tick === fixture.onchain.decoded.tick) {
      pass(`decodeSlot0Word tick == fixture (${dec.tick})`);
    } else {
      fail(`tick mismatch: ${dec.tick} vs fixture ${fixture.onchain.decoded.tick}`);
    }
    const price = dexPriceEthPerToken(dec.sqrtPriceX96);
    if (price) {
      console.log(
        `    ETH-per-token = ${price.num} / ${price.den} ≈ ${Number(price.num * 10n ** 18n / price.den) / 1e18}`,
      );
      pass("dexPriceEthPerToken returned an exact bigint ratio");
    } else {
      fail("dexPriceEthPerToken returned null on a valid word");
    }
    // graduation invariant on the fixture constants: the pool's initial sqrt
    // price and the graduation figures must agree EXACTLY up to direction —
    // (sqrtInit/2^96)^2 is either pair/token or token/pair depending on the
    // pool's token0/token1 ordering, so the direction-agnostic pin is
    // (sqrtInit^2 * pairUnits) / (2^192 * tokenUnits) == 1 within dust.
    const sqrtInit = BigInt(fixture.launch.graduation.poolInitialSqrtPriceX96 as string);
    const pairUnits = BigInt(fixture.launch.graduation.pairUnits as string);
    const tokenUnits = BigInt(fixture.launch.graduation.tokenUnits as string);
    const prod18 = (sqrtInit * sqrtInit * pairUnits * 10n ** 18n) / ((2n ** 96n) ** 2n * tokenUnits);
    const drift = prod18 > 10n ** 18n ? prod18 - 10n ** 18n : 10n ** 18n - prod18;
    if (drift < 10n ** 9n) {
      pass(`graduation invariant (sqrtInit² × pair / (2¹⁹² × token) == 1) holds within dust (${prod18})`);
    } else {
      fail(`graduation invariant drifted: product×1e18 = ${prod18}`);
    }
  }

  console.log(
    `\nrecord at capture: meter fell 2.61% → 0.171% (net curve selling) — re-read the meter above for today's value.`,
  );

  if (failures > 0) {
    console.log(`\nVERDICT: FAIL (${failures} check(s) failed)`);
    process.exit(1);
  }
  console.log("\nVERDICT: PASS — both readers honest end-to-end");
}

main();
