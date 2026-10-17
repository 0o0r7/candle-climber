// Chain City — core types
export interface GridPos { col: number; row: number; }

export type BuildingType =
  | 'tech_foundry'   // NVDA — chip production, high volatility
  | 'device_store'   // AAPL — stable consumer income
  | 'space_port'     // SPCX — speculative aerospace
  | 'vehicle_depot'  // TSLA — volatile automotive
  | 'market_plaza'   // ETH — baseline economy
  | 'bank_tower'     // treasury — reflections generator
  | 'guild_hall'     // guild activity multiplier
  | 'residential'    // population growth
  ;

export type BuildingTier = 1 | 2 | 3;

export interface BuildingDef {
  type: BuildingType;
  name: string;
  ticker: string;
  sector: string;
  cost: number;       // $WICK to place
  baseIncome: number; // per tick
  volatility: number; // income multiplier range from price change
  color: string;
  glow: string;
  width: number;  // grid cells
  height: number; // grid cells
  description: string;
}

export interface Building {
  id: string;
  type: BuildingType;
  tier: BuildingTier;
  pos: GridPos;
  placedAt: number;
  lastIncome: number;
  totalEarned: number;
  level: number;      // upgrade level
  // visual state
  animOffset: number;
  glowPulse: number;
}

export interface StockFeed {
  symbol: string;
  price: number;
  change24h: number;  // percent
  source: 'onchain' | 'binance' | 'synthetic';
  lastUpdate: number;
}

export interface CityStats {
  population: number;
  treasury: number;       // accumulated $WICK
  dailyIncome: number;
  buildingsCount: number;
  guildRank: number;
  cityLevel: number;
  graduationProgress: number; // 0-100%
}

export interface EconomyEvent {
  id: string;
  type: 'income' | 'upgrade' | 'build' | 'graduation' | 'market_shift';
  message: string;
  amount?: number;
  timestamp: number;
  color: string;
}

export interface Particle3D {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
  color: string;
  size: number;
}

export interface FloatingText {
  x: number; y: number;
  text: string;
  color: string;
  life: number; maxLife: number;
  vy: number;
}

export type GamePhase = 'loading' | 'menu' | 'playing' | 'paused' | 'graduated';

export interface GameState {
  phase: GamePhase;
  buildings: Building[];
  wickBalance: number;
  stats: CityStats;
  events: EconomyEvent[];
  feeds: Map<string, StockFeed>;
  selectedType: BuildingType | null;
  hoveredCell: GridPos | null;
  cameraX: number;
  cameraY: number;
  zoom: number;
  time: number;
  dayNight: number; // 0-1 (0=day, 1=night)
  guild?: string | null; // sanitized guild tag — decoration + buff lookup (Phase 2)
  particles: Particle3D[];
  floats: FloatingText[];
  graduationPulse: number;
}
