// Signal Forge — daily mutation system
// One mutation per UTC date, derived from the same seed as the arena.

import type { MutationId, MutationMods } from "./types";
import { hashString, mulberry32 } from "@/game/cc/rng";

const MUTATIONS: Record<MutationId, MutationMods> = {
  calm: {
    id: "calm",
    name: "CALM MARKET",
    waveInterval: [10, 14],
    greenRatio: 0.5,
    redRatio: 0.35,
    scoreMultiplier: 1,
    signalValue: 50,
    greenShrinkRate: 0,
    flashCrash: false,
    flashCrashInterval: 0,
  },
  volatile: {
    id: "volatile",
    name: "HIGH VOLATILITY",
    waveInterval: [5, 8],
    greenRatio: 0.45,
    redRatio: 0.4,
    scoreMultiplier: 1.2,
    signalValue: 50,
    greenShrinkRate: 0,
    flashCrash: false,
    flashCrashInterval: 0,
  },
  bearraid: {
    id: "bearraid",
    name: "BEAR RAID",
    waveInterval: [8, 12],
    greenRatio: 0.3,
    redRatio: 0.55,
    scoreMultiplier: 2,
    signalValue: 75,
    greenShrinkRate: 0,
    flashCrash: false,
    flashCrashInterval: 0,
  },
  bullrun: {
    id: "bullrun",
    name: "BULL RUN",
    waveInterval: [10, 14],
    greenRatio: 0.65,
    redRatio: 0.2,
    scoreMultiplier: 0.8,
    signalValue: 25,
    greenShrinkRate: 0,
    flashCrash: false,
    flashCrashInterval: 0,
  },
  flashcrash: {
    id: "flashcrash",
    name: "FLASH CRASH",
    waveInterval: [8, 12],
    greenRatio: 0.45,
    redRatio: 0.4,
    scoreMultiplier: 1.5,
    signalValue: 50,
    greenShrinkRate: 0,
    flashCrash: true,
    flashCrashInterval: 20,
  },
  drain: {
    id: "drain",
    name: "LIQUIDITY DRAIN",
    waveInterval: [8, 12],
    greenRatio: 0.5,
    redRatio: 0.35,
    scoreMultiplier: 1.3,
    signalValue: 60,
    greenShrinkRate: 0.005, // green cells shrink per second
    flashCrash: false,
    flashCrashInterval: 0,
  },
};

const MUTATION_IDS = Object.keys(MUTATIONS) as MutationId[];

export function dailyMutation(date: string, symbol: string): MutationMods {
  const h = hashString("vg-mutation:" + date + ":" + symbol);
  const rnd = mulberry32(h);
  const id = MUTATION_IDS[Math.floor(rnd() * MUTATION_IDS.length)];
  return { ...MUTATIONS[id] };
}

export const MUTATION_LIST = MUTATION_IDS.map(id => ({ id, name: MUTATIONS[id].name }));
