// Chain City — canvas renderer (isometric neon-noir city)
import type { Building, GameState, StockFeed, Particle3D, FloatingText } from "./types";
import { BUILDINGS, SECTOR_COLORS } from "./buildings";
import { gridToIso, TILE_W, TILE_H, GRID_COLS, GRID_ROWS, gridBounds } from "./grid";

const VIEW_W = 800;
const VIEW_H = 600;

// Building height in pixels per tier
const BUILDING_HEIGHTS: Record<number, number> = { 1: 40, 2: 70, 3: 110 };

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
) {
  // Clear with deep night sky
  const nightFactor = state.dayNight;
  const skyTop = lerpColor('#0a0e1a', '#050810', nightFactor);
  const skyBot = lerpColor('#1a1a2e', '#0a0a1a', nightFactor);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Stars (only at night)
  if (nightFactor > 0.3) {
    drawStars(ctx, w, h, nightFactor, state.time);
  }

  // Distant skyline silhouette
  drawSkyline(ctx, w, h, nightFactor, state.time);

  const zoom = state.zoom;
  const camX = state.cameraX;
  const camY = state.cameraY;

  // Center grid origin
  const cx = w / 2;
  const cy = h / 2 - 80;
  ctx.save();
  ctx.translate(cx - camX, cy - camY);
  ctx.scale(zoom, zoom);

  // Draw ground tiles
  drawGround(ctx, state);

  // Draw buildings sorted by depth (back to front)
  const sorted = [...state.buildings].sort((a, b) =>
    (a.pos.col + a.pos.row) - (b.pos.col + b.pos.row)
  );

  for (const b of sorted) {
    drawBuilding(ctx, b, state);
  }

  // Draw hovered cell ghost
  if (state.hoveredCell && state.selectedType) {
    drawGhostBuilding(ctx, state);
  }

  // Particles
  drawParticles(ctx, state.particles);

  // Floating texts
  drawFloats(ctx, state.floats);

  ctx.restore();

  // UI overlays drawn in screen space
  drawHUD(ctx, state, w, h);

  // Graduation pulse
  if (state.graduationPulse > 0) {
    ctx.fillStyle = `rgba(204, 255, 0, ${state.graduationPulse * 0.3})`;
    ctx.fillRect(0, 0, w, h);
  }
}

// --- Ground ---
function drawGround(ctx: CanvasRenderingContext2D, state: GameState) {
  const nightFactor = state.dayNight;
  const groundColor = lerpColor('#1a2030', '#0d1018', nightFactor);
  const lineColor = lerpColor('#2a3050', '#1a1a30', nightFactor);

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const iso = gridToIso(col, row);
      const isEven = (col + row) % 2 === 0;
      const tileColor = isEven
        ? lerpColor('#1e2438', '#10131c', nightFactor)
        : lerpColor('#1a1f30', '#0c0f16', nightFactor);

      ctx.fillStyle = tileColor;
      drawTile(ctx, iso.x, iso.y, TILE_W, TILE_H);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      drawTilePath(ctx, iso.x, iso.y, TILE_W, TILE_H);
      ctx.stroke();

      // Hovered cell highlight
      if (state.hoveredCell && state.hoveredCell.col === col && state.hoveredCell.row === row) {
        ctx.fillStyle = 'rgba(204, 255, 0, 0.12)';
        drawTile(ctx, iso.x, iso.y, TILE_W, TILE_H);
        ctx.strokeStyle = 'rgba(204, 255, 0, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawTilePath(ctx, iso.x, iso.y, TILE_W, TILE_H);
        ctx.stroke();
      }
    }
  }
}

function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  drawTilePath(ctx, x, y, w, h);
  ctx.fill();
}

function drawTilePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.moveTo(x, y);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.closePath();
}

// --- Buildings ---
function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, state: GameState) {
  const def = BUILDINGS[b.type];
  if (!def) return;

  const iso = gridToIso(b.pos.col, b.pos.row);
  const bw = def.width * TILE_W;
  const bh = BUILDING_HEIGHTS[b.tier] * b.level * 0.6;
  const tw = def.width * TILE_W;
  const th = def.height * TILE_H;

  // Base center
  const bx = iso.x;
  const by = iso.y;

  // Glow pulse
  const pulse = 0.6 + Math.sin(state.time * 2 + b.animOffset) * 0.4;
  const glowAlpha = b.glowPulse * pulse;

  // Building body — drawn as isometric box
  const color = def.color;
  const darkColor = darkenColor(color, 0.4);
  const sideColor = darkenColor(color, 0.6);

  // Left face (darker)
  ctx.fillStyle = sideColor;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx, by - bh);
  ctx.lineTo(bx + tw / 2, by - bh + th / 2);
  ctx.lineTo(bx + tw / 2, by + th / 2);
  ctx.closePath();
  ctx.fill();

  // Right face (medium)
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.moveTo(bx + tw, by);
  ctx.lineTo(bx + tw, by - bh);
  ctx.lineTo(bx + tw / 2, by - bh + th / 2);
  ctx.lineTo(bx + tw / 2, by + th / 2);
  ctx.closePath();
  ctx.fill();

  // Top face (brightest)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(bx, by - bh);
  ctx.lineTo(bx + tw / 2, by - bh - th / 2);
  ctx.lineTo(bx + tw, by - bh);
  ctx.lineTo(bx + tw / 2, by - bh + th / 2);
  ctx.closePath();
  ctx.fill();

  // Windows — small glowing rectangles on the faces
  if (b.tier >= 1) {
    drawWindows(ctx, bx, by, tw, th, bh, color, glowAlpha, state.dayNight);
  }

  // Glow overlay
  if (glowAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = glowAlpha * 0.3;
    ctx.shadowColor = def.glow;
    ctx.shadowBlur = 20;
    ctx.fillStyle = def.glow;
    ctx.beginPath();
    ctx.moveTo(bx, by - bh);
    ctx.lineTo(bx + tw / 2, by - bh - th / 2);
    ctx.lineTo(bx + tw, by - bh);
    ctx.lineTo(bx + tw / 2, by - bh + th / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Building outline
  ctx.strokeStyle = darkenColor(color, 0.3);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx, by - bh);
  ctx.lineTo(bx + tw / 2, by - bh - th / 2);
  ctx.lineTo(bx + tw, by - bh);
  ctx.lineTo(bx + tw, by);
  ctx.lineTo(bx + tw / 2, by + th / 2);
  ctx.lineTo(bx, by);
  ctx.stroke();

  // Income indicator — small floating $ above building if recently earned
  if (b.lastIncome > 0 && state.time - b.placedAt > 0.5) {
    const yOffset = -bh - 20 - Math.sin(state.time * 3 + b.animOffset) * 3;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(204, 255, 0, ${0.5 + pulse * 0.3})`;
    ctx.fillText(`+${b.lastIncome.toFixed(1)}`, bx + tw / 2, by + yOffset);
  }
}

function drawWindows(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number,
  tw: number, th: number, bh: number,
  color: string, glow: number, night: number,
) {
  const winColor = night > 0.4 ? `rgba(255, 220, 100, ${0.4 + glow * 0.4})` : `rgba(255, 255, 255, 0.15)`;
  const rows = Math.max(1, Math.floor(bh / 16));
  const cols = Math.max(1, Math.floor(tw / 24));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Random-ish lit windows based on position
      const lit = ((r * 7 + c * 13 + Math.floor(bx * 0.1)) % 5) < 3;
      if (!lit) continue;

      const wx = bx + 4 + c * 18;
      const wy = by - bh + 8 + r * 14;
      ctx.fillStyle = winColor;
      ctx.fillRect(wx, wy, 5, 7);
    }
  }
}

// --- Ghost building (placement preview) ---
function drawGhostBuilding(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!state.hoveredCell || !state.selectedType) return;
  const def = BUILDINGS[state.selectedType];
  if (!def) return;

  const iso = gridToIso(state.hoveredCell.col, state.hoveredCell.row);
  const bh = BUILDING_HEIGHTS[1] * 0.6;
  const tw = def.width * TILE_W;
  const th = def.height * TILE_H;

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = def.color;
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 1;

  // Top
  ctx.beginPath();
  ctx.moveTo(iso.x, iso.y - bh);
  ctx.lineTo(iso.x + tw / 2, iso.y - bh - th / 2);
  ctx.lineTo(iso.x + tw, iso.y - bh);
  ctx.lineTo(iso.x + tw / 2, iso.y - bh + th / 2);
  ctx.closePath();
  ctx.fill();

  // Left
  ctx.fillStyle = darkenColor(def.color, 0.5);
  ctx.beginPath();
  ctx.moveTo(iso.x, iso.y);
  ctx.lineTo(iso.x, iso.y - bh);
  ctx.lineTo(iso.x + tw / 2, iso.y - bh + th / 2);
  ctx.lineTo(iso.x + tw / 2, iso.y + th / 2);
  ctx.closePath();
  ctx.fill();

  // Right
  ctx.fillStyle = darkenColor(def.color, 0.65);
  ctx.beginPath();
  ctx.moveTo(iso.x + tw, iso.y);
  ctx.lineTo(iso.x + tw, iso.y - bh);
  ctx.lineTo(iso.x + tw / 2, iso.y - bh + th / 2);
  ctx.lineTo(iso.x + tw / 2, iso.y + th / 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// --- Particles ---
function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle3D[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y - p.z, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Floating texts ---
function drawFloats(ctx: CanvasRenderingContext2D, floats: FloatingText[]) {
  for (const f of floats) {
    const alpha = f.life / f.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = f.color;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 8;
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }
}

// --- HUD ---
function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number) {
  // Top bar — treasury balance
  const barH = 44;
  ctx.fillStyle = 'rgba(5, 8, 16, 0.85)';
  ctx.fillRect(0, 0, w, barH);
  ctx.strokeStyle = 'rgba(204, 255, 0, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, barH);
  ctx.lineTo(w, barH);
  ctx.stroke();

  // $WICK balance
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ccff00';
  ctx.shadowColor = 'rgba(204, 255, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.fillText(`$WICK ${Math.floor(state.wickBalance).toLocaleString()}`, 16, 28);
  ctx.shadowBlur = 0;

  // City level
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#a855f7';
  ctx.textAlign = 'center';
  ctx.fillText(`CITY LV.${state.stats.cityLevel}`, w / 2, 18);
  ctx.fillStyle = '#5e636b';
  ctx.font = '10px monospace';
  ctx.fillText(`POP ${state.stats.population.toLocaleString()}`, w / 2, 34);

  // Graduation progress
  const gradX = w - 200;
  ctx.textAlign = 'right';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#e0b04e';
  ctx.fillText('GRADUATION', w - 16, 16);
  // Bar
  const barW = 180;
  const barX = w - barW - 16;
  const barY = 22;
  const barH2 = 8;
  ctx.fillStyle = 'rgba(224, 176, 78, 0.15)';
  ctx.fillRect(barX, barY, barW, barH2);
  ctx.fillStyle = '#e0b04e';
  ctx.fillRect(barX, barY, barW * (state.stats.graduationProgress / 100), barH2);

  // Day/night indicator
  ctx.textAlign = 'left';
  ctx.font = '10px monospace';
  ctx.fillStyle = '#5e636b';
  const phase = state.dayNight > 0.5 ? 'NIGHT' : 'DAY';
  ctx.fillText(phase, 16, barH + 16);
}

// --- Background elements ---
function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number, time: number) {
  ctx.save();
  for (let i = 0; i < 60; i++) {
    const x = (i * 137.5) % w;
    const y = (i * 89.3) % (h * 0.6);
    const twinkle = 0.3 + Math.sin(time * 1.5 + i) * 0.3;
    ctx.globalAlpha = intensity * twinkle * 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.restore();
}

function drawSkyline(ctx: CanvasRenderingContext2D, w: number, h: number, night: number, time: number) {
  ctx.save();
  const baseY = h * 0.65;
  const buildings = [
    { x: 0, w: 60, h: 80 },
    { x: 55, w: 40, h: 120 },
    { x: 90, w: 70, h: 60 },
    { x: 155, w: 50, h: 100 },
    { x: 200, w: 35, h: 70 },
    { x: 230, w: 80, h: 140 },
    { x: 305, w: 45, h: 90 },
    { x: 345, w: 60, h: 55 },
    { x: 400, w: 50, h: 110 },
    { x: 445, w: 70, h: 75 },
    { x: 510, w: 40, h: 130 },
    { x: 545, w: 55, h: 65 },
    { x: 595, w: 65, h: 95 },
    { x: 655, w: 45, h: 50 },
    { x: 695, w: 55, h: 85 },
    { x: 745, w: 60, h: 70 },
  ];

  // Scale to fit width
  const scale = w / 810;

  for (const b of buildings) {
    const bx = b.x * scale;
    const bw = b.w * scale;
    const bh = b.h * scale;
    const by = baseY - bh;

    ctx.fillStyle = lerpColor('#0d1018', '#06080f', night);
    ctx.fillRect(bx, by, bw, bh);

    // Windows
    if (night > 0.3) {
      for (let wy = by + 8; wy < baseY - 4; wy += 12) {
        for (let wx = bx + 4; wx < bx + bw - 4; wx += 10) {
          const lit = ((Math.floor(wx) * 3 + Math.floor(wy) * 7) % 4) < 2;
          if (lit) {
            ctx.fillStyle = `rgba(255, 200, 80, ${night * 0.4})`;
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }
    }
  }

  // Ground line
  ctx.fillStyle = lerpColor('#0a0c12', '#050608', night);
  ctx.fillRect(0, baseY, w, h - baseY);
  ctx.restore();
}

// --- Color utilities ---
function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
}

export { VIEW_W, VIEW_H };
