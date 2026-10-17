// Chain City — game engine
import type { GameState, Building, BuildingType, BuildingTier, Particle3D, FloatingText, EconomyEvent, StockFeed, GridPos } from "./types";
import { BUILDINGS } from "./buildings";
import { Economy } from "./economy";
import { GRID_COLS, GRID_ROWS, gridToIso, isInBounds } from "./grid";

let buildingIdCounter = 0;

/** Raise the id counter above a restored save's highest id (persistence). */
export function setBuildingIdFloor(n: number) {
  if (Number.isFinite(n) && n > buildingIdCounter) buildingIdCounter = n;
}

export function createInitialState(): GameState {
  const feeds = Economy.syntheticFeeds();
  return {
    phase: 'menu',
    buildings: [],
    wickBalance: 5000, // starting capital
    stats: {
      population: 0,
      treasury: 5000,
      dailyIncome: 0,
      buildingsCount: 0,
      guildRank: 100,
      cityLevel: 1,
      graduationProgress: 0,
    },
    events: [],
    feeds,
    selectedType: null,
    hoveredCell: null,
    cameraX: 0,
    cameraY: 0,
    zoom: 1,
    time: 0,
    dayNight: 0,
    particles: [],
    floats: [],
    graduationPulse: 0,
  };
}

export class CityEngine {
  state: GameState;
  economy = new Economy();
  private dayNightTimer = 0;
  private feedTimer = 0;
  private eventTimer = 0;

  constructor() {
    this.state = createInitialState();
  }

  start() {
    this.state.phase = 'playing';
    // Place a starter building
    this.placeBuilding('market_plaza', { col: 5, row: 5 });
    this.placeBuilding('residential', { col: 6, row: 5 });
  }

  selectBuilding(type: BuildingType | null) {
    this.state.selectedType = type;
  }

  canPlace(type: BuildingType, pos: GridPos): boolean {
    const def = BUILDINGS[type];
    if (!def) return false;
    if (!isInBounds(pos.col, pos.row)) return false;
    // Check bounds for multi-cell buildings
    if (pos.col + def.width > GRID_COLS) return false;
    if (pos.row + def.height > GRID_ROWS) return false;
    // Check overlap
    for (const b of this.state.buildings) {
      const bDef = BUILDINGS[b.type];
      if (
        pos.col < b.pos.col + bDef.width &&
        pos.col + def.width > b.pos.col &&
        pos.row < b.pos.row + bDef.height &&
        pos.row + def.height > b.pos.row
      ) {
        return false;
      }
    }
    // Check cost
    if (this.state.wickBalance < def.cost) return false;
    return true;
  }

  placeBuilding(type: BuildingType, pos: GridPos): boolean {
    if (!this.canPlace(type, pos)) return false;
    const def = BUILDINGS[type];
    this.state.wickBalance -= def.cost;

    const building: Building = {
      id: `b${++buildingIdCounter}`,
      type,
      tier: 1,
      pos: { ...pos },
      placedAt: this.state.time,
      lastIncome: 0,
      totalEarned: 0,
      level: 1,
      animOffset: Math.random() * Math.PI * 2,
      glowPulse: 0,
    };

    this.state.buildings.push(building);

    // Spawn placement particles
    const iso = gridToIso(pos.col, pos.row);
    this.spawnParticles(12, iso.x + def.width * 32, iso.y, def.color);

    // Float text
    this.state.floats.push({
      x: iso.x + def.width * 32,
      y: iso.y - 30,
      text: `-${def.cost} $WICK`,
      color: '#ff6b6b',
      life: 1.2,
      maxLife: 1.2,
      vy: -40,
    });

    // Economy event
    this.addEvent('build', `Built ${def.name}`, -def.cost, def.color);

    return true;
  }

  upgradeBuilding(buildingId: string): boolean {
    const b = this.state.buildings.find(x => x.id === buildingId);
    if (!b) return false;
    const def = BUILDINGS[b.type];
    const cost = Math.floor(def.cost * 0.6 * b.level);
    if (this.state.wickBalance < cost) return false;

    this.state.wickBalance -= cost;
    b.level++;
    if (b.level >= 3) b.tier = 3;
    else if (b.level >= 2) b.tier = 2;

    const iso = gridToIso(b.pos.col, b.pos.row);
    this.spawnParticles(8, iso.x + def.width * 32, iso.y, def.color);
    this.addEvent('upgrade', `Upgraded ${def.name} to Lv.${b.level}`, -cost, def.color);
    return true;
  }

  setHover(cell: GridPos | null) {
    this.state.hoveredCell = cell;
  }

  // Camera controls
  panCamera(dx: number, dy: number) {
    this.state.cameraX -= dx;
    this.state.cameraY -= dy;
  }

  setZoom(zoom: number) {
    this.state.zoom = Math.max(0.5, Math.min(2.5, zoom));
  }

  step(dt: number) {
    if (this.state.phase !== 'playing') return;

    this.state.time += dt;

    // Day/night cycle — 120 second full cycle
    this.dayNightTimer += dt;
    const cycle = (this.dayNightTimer % 120) / 120;
    this.state.dayNight = 0.5 + Math.sin(cycle * Math.PI * 2 - Math.PI / 2) * 0.5;

    // Building glow pulse
    for (const b of this.state.buildings) {
      b.glowPulse = Math.min(1, b.glowPulse + dt * 0.5);
    }

    // Economy tick
    const income = this.economy.update(dt, this.state);
    if (income > 0) {
      this.addEvent('income', `+$${income.toFixed(0)} earned`, income, '#ccff00');
      // Spawn income particles on each building
      for (const b of this.state.buildings) {
        const def = BUILDINGS[b.type];
        const iso = gridToIso(b.pos.col, b.pos.row);
        if (Math.random() < 0.3) {
          this.state.floats.push({
            x: iso.x + def.width * 32,
            y: iso.y - 20,
            text: `+${b.lastIncome.toFixed(1)}`,
            color: '#ccff00',
            life: 1.5,
            maxLife: 1.5,
            vy: -30,
          });
        }
      }
    }

    // Update stock feeds periodically (simulate small price movements)
    this.feedTimer += dt;
    if (this.feedTimer >= 5) {
      this.feedTimer = 0;
      this.updateFeeds();
    }

    // Random market events
    this.eventTimer += dt;
    if (this.eventTimer >= 30 && Math.random() < 0.3) {
      this.eventTimer = 0;
      this.triggerMarketEvent();
    }

    // Graduation check
    if (this.state.stats.graduationProgress >= 100 && this.state.phase === 'playing') {
      this.state.phase = 'graduated';
      this.state.graduationPulse = 1;
      this.addEvent('graduation', 'CITY GOES PUBLIC! Graduation achieved!', 0, '#ccff00');
      // Massive particle burst
      for (const b of this.state.buildings) {
        const iso = gridToIso(b.pos.col, b.pos.row);
        this.spawnParticles(20, iso.x + 32, iso.y, '#ccff00');
      }
    }

    if (this.state.graduationPulse > 0) {
      this.state.graduationPulse = Math.max(0, this.state.graduationPulse - dt * 0.3);
    }

    // Update particles
    this.updateParticles(dt);
    this.updateFloats(dt);

    // Trim events
    if (this.state.events.length > 20) {
      this.state.events.splice(0, this.state.events.length - 20);
    }
  }

  private updateFeeds() {
    const now = Date.now();
    for (const [sym, feed] of this.state.feeds) {
      // Small random walk on price
      const drift = (Math.random() - 0.5) * 0.02;
      const newChange = feed.change24h + drift * 10;
      const newPrice = feed.price * (1 + drift);
      this.state.feeds.set(sym, {
        ...feed,
        price: newPrice,
        change24h: Math.max(-15, Math.min(15, newChange)),
        lastUpdate: now,
      });
    }
  }

  private triggerMarketEvent() {
    const symbols = Array.from(this.state.feeds.keys());
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    const feed = this.state.feeds.get(sym)!;
    const isPump = Math.random() > 0.5;
    const magnitude = 2 + Math.random() * 5;
    const newChange = isPump
      ? feed.change24h + magnitude
      : feed.change24h - magnitude;

    this.state.feeds.set(sym, {
      ...feed,
      change24h: Math.max(-15, Math.min(15, newChange)),
    });

    const direction = isPump ? 'pumps' : 'dumps';
    const color = isPump ? '#5bd08a' : '#e07856';
    this.addEvent('market_shift', `${sym} ${direction} ${magnitude.toFixed(1)}%`, 0, color);
  }

  private addEvent(type: EconomyEvent['type'], message: string, amount: number, color: string) {
    this.state.events.push({
      id: `e${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      message,
      amount,
      timestamp: Date.now(),
      color,
    });
  }

  private spawnParticles(n: number, x: number, y: number, color: string) {
    for (let i = 0; i < n; i++) {
      this.state.particles.push({
        x, y, z: 0,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 40,
        vz: Math.random() * 100 + 50,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vz -= 200 * dt; // gravity
      if (p.z < 0) { p.z = 0; p.vz *= -0.3; }
    }
  }

  private updateFloats(dt: number) {
    for (let i = this.state.floats.length - 1; i >= 0; i--) {
      const f = this.state.floats[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.state.floats.splice(i, 1);
        continue;
      }
      f.y += f.vy * dt;
    }
  }

  /** Fetch real stock prices from the app's existing API. */
  async fetchLiveFeeds() {
    try {
      const symbols = ['TSLA', 'AAPL'];
      for (const sym of symbols) {
        const res = await fetch(`/api/onchain/quote?symbol=${sym}`);
        if (res.ok) {
          const data = await res.json();
          if (data.price) {
            const existing = this.state.feeds.get(sym);
            this.state.feeds.set(sym, {
              symbol: sym,
              price: data.price,
              change24h: data.change24h ?? existing?.change24h ?? 0,
              source: 'onchain',
              lastUpdate: Date.now(),
            });
          }
        }
      }
    } catch {
      // Keep synthetic feeds on failure
    }
  }
}
