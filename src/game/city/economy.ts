// Chain City — economic simulation
import type { Building, StockFeed, CityStats, GameState } from "./types";
import { BUILDINGS, TIER_MULTIPLIER } from "./buildings";
import { guildBuff } from "@/lib/guild-registry";

const INCOME_INTERVAL = 3.0; // seconds between income ticks

export class Economy {
  private incomeTimer = 0;
  private cityLevel = 1;
  private totalEarned = 0;

  get incomeInterval() { return INCOME_INTERVAL; }
  get elapsed() { return this.incomeTimer; }

  /** Calculate current income for a single building given live feeds. */
  buildingIncome(b: Building, feeds: Map<string, StockFeed>): number {
    const def = BUILDINGS[b.type];
    if (!def) return 0;

    let income = def.baseIncome * TIER_MULTIPLIER[b.tier] * b.level;

    // Apply stock price volatility multiplier
    const feed = feeds.get(def.ticker);
    if (feed) {
      const change = feed.change24h / 100; // fractional
      const volMult = 1 + change * def.volatility;
      income *= Math.max(0.1, volMult); // never below 10% base
    }

    // Bank tower adjacency bonus handled in cityIncome
    return income;
  }

  /** Calculate total city income per tick.
   *  `guildMult` (Phase 2) is the REGISTERED-GUILD buff resolved from the static
   *  registry — the community half of the Guild Hall's own 1.15× building bonus. */
  cityIncome(buildings: Building[], feeds: Map<string, StockFeed>, guildMult = 1): number {
    let total = 0;
    let hallMult = 1;

    // Guild hall multiplier
    const hasGuild = buildings.some(b => b.type === 'guild_hall');
    if (hasGuild) hallMult = 1.15;

    // Bank tower adjacency: +10% per adjacent building
    const banks = buildings.filter(b => b.type === 'bank_tower');

    for (const b of buildings) {
      let income = this.buildingIncome(b, feeds);

      // Bank tower adjacency bonus
      for (const bank of banks) {
        const dist = Math.abs(bank.pos.col - b.pos.col) + Math.abs(bank.pos.row - b.pos.row);
        if (dist <= 2 && b.type !== 'bank_tower') {
          income *= 1.10;
        }
      }

      total += income;
    }

    return total * hallMult * guildMult;
  }

  /** Per-frame update. Returns income earned this frame, or 0. */
  update(dt: number, state: GameState): number {
    this.incomeTimer += dt;
    if (this.incomeTimer < INCOME_INTERVAL) return 0;

    this.incomeTimer = 0;
    const income = this.cityIncome(state.buildings, state.feeds, guildBuff(state.guild));
    const perBuilding = income / Math.max(1, state.buildings.length);

    for (const b of state.buildings) {
      const earned = this.buildingIncome(b, state.feeds);
      b.lastIncome = earned;
      b.totalEarned += earned;
    }

    state.wickBalance += income;
    state.stats.dailyIncome = income * (86400 / INCOME_INTERVAL) / 1000; // daily in thousands
    state.stats.treasury = state.wickBalance;
    this.totalEarned += income;

    // City level based on total buildings and earned
    state.stats.cityLevel = 1 + Math.floor(state.buildings.length / 4) + Math.floor(this.totalEarned / 5000);

    // Population from residential
    const residential = state.buildings.filter(b => b.type === 'residential');
    state.stats.population = residential.length * 120 + state.buildings.length * 15;

    // Graduation progress: based on treasury milestone
    const gradTarget = 50000; // $WICK equivalent to 5 ETH graduation
    state.stats.graduationProgress = Math.min(100, (state.wickBalance / gradTarget) * 100);

    state.stats.buildingsCount = state.buildings.length;
    state.stats.guildRank = Math.max(1, 100 - Math.floor(state.buildings.length * 3) - Math.floor(this.totalEarned / 1000));

    return income;
  }

  /** Generate synthetic stock feeds as fallback (no API needed). */
  static syntheticFeeds(): Map<string, StockFeed> {
    const feeds = new Map<string, StockFeed>();
    const now = Date.now();
    const stocks: [string, number, number][] = [
      ['NVDA', 875.30, 2.4],
      ['AAPL', 182.45, 0.8],
      ['SPCX', 412.80, -1.2],
      ['TSLA', 248.90, 3.1],
      ['ETH', 2673.82, -0.5],
      ['WICK', 0.042, 5.2],
    ];
    for (const [sym, price, change] of stocks) {
      feeds.set(sym, {
        symbol: sym,
        price,
        change24h: change,
        source: 'synthetic',
        lastUpdate: now,
      });
    }
    return feeds;
  }
}
