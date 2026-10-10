import { describe, expect, it } from "bun:test";
import {
  DEFAULT_RPC_URL,
  ROBINHOOD_CHAIN_ID,
  ROBINHOOD_CHAIN_ID_HEX,
  ROBINHOOD_CHAIN_PARAMS,
  TIER_HOLD_WEI,
  TIER_WHALE_WEI,
  WICK_DECIMALS,
  WICK_TOKEN_ADDRESS,
  balanceToTier,
  decodeHexQuantity,
  encodeBalanceOf,
  ensureRobinhoodChain,
  formatWick,
  isValidAddress,
  type EthLikeProvider,
} from "@/lib/wallet";

// P4.2 (E2) — pure helpers for the cosmetic-only $WICK Balance Gate.
// LAW: nothing here touches scoring — these tests pin the GATE math only.

describe("P4.2 wallet helpers", () => {
  it("launch-record constants are pinned (drift = loud failure)", () => {
    expect(WICK_TOKEN_ADDRESS).toBe("0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c");
    expect(ROBINHOOD_CHAIN_ID).toBe(46630); // 0xb626, verified live 2026-10-06
    expect(DEFAULT_RPC_URL).toBe("https://rpc.testnet.chain.robinhood.com");
    expect(WICK_DECIMALS).toBe(18n);
  });

  it("isValidAddress: shape-only, case-tolerant, rejects non-strings", () => {
    expect(isValidAddress("0xE2cE0Be4e3D420C1e4b5C46493b3d5e03595216c")).toBe(true);
    expect(isValidAddress("0x" + "ab".repeat(20))).toBe(true); // lower hex
    expect(isValidAddress("0x" + "AB".repeat(20))).toBe(true); // upper hex
    expect(isValidAddress("0x123")).toBe(false); // too short
    expect(isValidAddress("0x" + "gg".repeat(20))).toBe(false); // non-hex
    expect(isValidAddress("E2cE0Be4e3D420C1e4b5C46493b3d5e03595216c")).toBe(false); // no 0x
    expect(isValidAddress(42)).toBe(false); // non-string
    expect(isValidAddress(null)).toBe(false);
    expect(isValidAddress(undefined)).toBe(false);
  });

  it("encodeBalanceOf: ERC-20 selector + zero-left-padded address", () => {
    const a = "0xE2cE0Be4e3D420C1e4b5C46493b3d5e03595216c";
    const data = encodeBalanceOf(a);
    expect(data.startsWith("0x70a08231")).toBe(true); // balanceOf(address)
    expect(data).toHaveLength(74); // 10 selector chars + 64 hex chars
    expect(data.endsWith(a.toLowerCase().slice(2).padStart(64, "0"))).toBe(true);
    // same address, different case → identical calldata
    expect(encodeBalanceOf(a.toLowerCase())).toBe(data);
  });

  it("encodeBalanceOf rejects malformed input before any network call", () => {
    expect(() => encodeBalanceOf("0x123")).toThrow();
    expect(() => encodeBalanceOf("not-an-address")).toThrow();
  });

  it("decodeHexQuantity: quantity hex (incl. 0-length) → bigint", () => {
    expect(decodeHexQuantity("0x0")).toBe(0n);
    expect(decodeHexQuantity("0x12")).toBe(18n);
    expect(
      decodeHexQuantity("0x00000000000000000000000000000000000000000000f449f0c9d03d255ca461"),
    ).toBe(1153621384765574689367137n);
  });

  it("balanceToTier: exact boundaries (never rounds a holder up)", () => {
    expect(balanceToTier(0n)).toBe("none");
    expect(balanceToTier(1n)).toBe("none");
    expect(balanceToTier(TIER_HOLD_WEI - 1n)).toBe("none");
    expect(balanceToTier(TIER_HOLD_WEI)).toBe("holder");
    expect(balanceToTier(TIER_WHALE_WEI - 1n)).toBe("holder");
    expect(balanceToTier(TIER_WHALE_WEI)).toBe("whale");
    expect(balanceToTier(TIER_WHALE_WEI * 999n)).toBe("whale");
  });

  it("formatWick: whole numbers, 3-decimal truncation (no rounding), grouping", () => {
    expect(formatWick(0n)).toBe("0");
    expect(formatWick(10n ** 18n)).toBe("1");
    expect(formatWick(1234n * 10n ** 18n + 5n * 10n ** 17n)).toBe("1,234.500");
    // 0.9999 → truncates to 0.999, never rounds to 1.000
    expect(formatWick(9999n * 10n ** 14n)).toBe("0.999");
    expect(formatWick(TIER_HOLD_WEI)).toBe("1,000");
  });
});

// Network auto-setup (owner-reported bug 2026-10-11: connecting never asked the
// wallet to switch/add Robinhood testnet — it only showed "WRONG NETWORK").

type RpcCall = { method: string; params?: unknown[] };

/** Fake injected provider: records calls, scripted per-method behavior. */
function fakeProvider(opts: {
  chain?: string; // starting eth_chainId (default 0x1 = wrong)
  switchError?: Error; // thrown ONCE by wallet_switchEthereumChain
  addError?: Error; // thrown ONCE by wallet_addEthereumChain
  autoSwitchOnAdd?: boolean; // wallet auto-switches after add (MetaMask does)
  switchLies?: boolean; // switch "succeeds" but chain never changes
}) {
  const calls: RpcCall[] = [];
  let chain = opts.chain ?? "0x1";
  const prov: EthLikeProvider & { calls: RpcCall[] } = {
    calls,
    request: (a: { method: string; params?: unknown[] }) => {
      calls.push({ method: a.method, params: a.params });
      if (a.method === "eth_chainId") return Promise.resolve(chain);
      if (a.method === "wallet_switchEthereumChain") {
        if (opts.switchError) {
          const e = opts.switchError;
          opts.switchError = undefined;
          return Promise.reject(e);
        }
        if (!opts.switchLies) {
          chain = (a.params?.[0] as { chainId: string }).chainId;
        }
        return Promise.resolve(null);
      }
      if (a.method === "wallet_addEthereumChain") {
        if (opts.addError) {
          const e = opts.addError;
          opts.addError = undefined;
          return Promise.reject(e);
        }
        if (opts.autoSwitchOnAdd) {
          chain = (a.params?.[0] as { chainId: string }).chainId;
        }
        return Promise.resolve(null);
      }
      return Promise.reject(new Error(`unexpected method ${a.method}`));
    },
  };
  return prov;
}

describe("ensureRobinhoodChain (network switch/add)", () => {
  it("EIP-3085 params are pinned (drift = wallets add the wrong network)", () => {
    expect(ROBINHOOD_CHAIN_ID_HEX).toBe("0xb626");
    expect(ROBINHOOD_CHAIN_PARAMS.chainId).toBe("0xb626");
    expect(ROBINHOOD_CHAIN_PARAMS.chainName).toBe("Robinhood Chain Testnet");
    expect(ROBINHOOD_CHAIN_PARAMS.nativeCurrency).toEqual({ name: "Ether", symbol: "ETH", decimals: 18 });
    expect(ROBINHOOD_CHAIN_PARAMS.rpcUrls).toEqual([DEFAULT_RPC_URL]);
    expect(ROBINHOOD_CHAIN_PARAMS.blockExplorerUrls).toEqual(["https://explorer.testnet.chain.robinhood.com"]);
  });

  it("already on 0xb626 → ok with ZERO switch/add prompts", async () => {
    const eth = fakeProvider({ chain: "0xb626" });
    const r = await ensureRobinhoodChain(eth);
    expect(r).toEqual({ ok: true, chainId: "0xb626", added: false, switched: false });
    expect(eth.calls.map((c) => c.method)).toEqual(["eth_chainId"]);
  });

  it("wrong chain, wallet knows it → single switch, ok", async () => {
    const eth = fakeProvider({ chain: "0x1" });
    const r = await ensureRobinhoodChain(eth);
    expect(r).toEqual({ ok: true, chainId: "0xb626", added: false, switched: true });
    expect(eth.calls.map((c) => c.method)).toEqual(["eth_chainId", "wallet_switchEthereumChain", "eth_chainId"]);
    expect(eth.calls[1].params).toEqual([{ chainId: "0xb626" }]);
  });

  it("4902 unrecognized chain → add with full EIP-3085 params → auto-switch wallet → ok", async () => {
    const eth = fakeProvider({ chain: "0x1", autoSwitchOnAdd: true, switchError: Object.assign(new Error("Unrecognized chain"), { code: 4902 }) });
    const r = await ensureRobinhoodChain(eth);
    expect(r).toEqual({ ok: true, chainId: "0xb626", added: true, switched: false });
    expect(eth.calls.map((c) => c.method)).toEqual([
      "eth_chainId",
      "wallet_switchEthereumChain",
      "wallet_addEthereumChain",
      "eth_chainId",
    ]);
    const addParams = eth.calls[2].params as unknown[];
    expect(addParams).toHaveLength(1);
    expect(addParams[0]).toEqual(ROBINHOOD_CHAIN_PARAMS);
  });

  it("wallet adds WITHOUT auto-switching → helper issues one follow-up switch → ok", async () => {
    const eth = fakeProvider({
      chain: "0x1",
      autoSwitchOnAdd: false,
      switchError: Object.assign(new Error("Unrecognized chain"), { code: 4902 }),
    });
    const r = await ensureRobinhoodChain(eth);
    expect(r).toEqual({ ok: true, chainId: "0xb626", added: true, switched: true });
    expect(eth.calls.map((c) => c.method)).toEqual([
      "eth_chainId",
      "wallet_switchEthereumChain",
      "wallet_addEthereumChain",
      "eth_chainId",
      "wallet_switchEthereumChain",
      "eth_chainId",
    ]);
  });

  it("user rejects the switch (4001) → rejected, and the add-network popup is NEVER fired", async () => {
    const eth = fakeProvider({ chain: "0x1", switchError: Object.assign(new Error("user rejected"), { code: 4001 }) });
    const r = await ensureRobinhoodChain(eth);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("rejected");
      expect(r.code).toBe(4001);
      expect(r.message).toContain("rejected");
    }
    expect(eth.calls.map((c) => c.method)).toEqual(["eth_chainId", "wallet_switchEthereumChain"]);
  });

  it("user rejects the ADD (4001) → rejected with honest message", async () => {
    const eth = fakeProvider({
      chain: "0x1",
      switchError: Object.assign(new Error("Unrecognized chain"), { code: 4902 }),
      addError: Object.assign(new Error("user rejected"), { code: 4001 }),
    });
    const r = await ensureRobinhoodChain(eth);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("rejected");
  });

  it("-32002 (request popup already open) → pending hard-stop on both switch and add", async () => {
    const sw = fakeProvider({ chain: "0x1", switchError: Object.assign(new Error("already pending"), { code: -32002 }) });
    const r1 = await ensureRobinhoodChain(sw);
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.reason).toBe("pending");
    expect(sw.calls.map((c) => c.method)).toEqual(["eth_chainId", "wallet_switchEthereumChain"]);

    const ad = fakeProvider({
      chain: "0x1",
      switchError: Object.assign(new Error("Unrecognized chain"), { code: 4902 }),
      addError: Object.assign(new Error("already pending"), { code: -32002 }),
    });
    const r2 = await ensureRobinhoodChain(ad);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.reason).toBe("pending");
  });

  it("switch silently fails (wallet lies) → honest unknown with the FINAL chain id in the message", async () => {
    const eth = fakeProvider({ chain: "0x1", switchLies: true });
    const r = await ensureRobinhoodChain(eth);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("unknown");
      expect(r.message).toContain("0x1");
      expect(r.message).toContain("0xb626");
    }
  });

  it("never throws — a provider that rejects eth_chainId still returns a failure object", async () => {
    const eth: EthLikeProvider = {
      request: () => Promise.reject(new Error("provider locked")),
    };
    const r = await ensureRobinhoodChain(eth);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("unknown");
      expect(r.message).toContain("provider locked");
    }
  });
});
