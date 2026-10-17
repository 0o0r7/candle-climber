// Signal Forge — canvas renderer (voxel holographic style)
// Top-down arena with glowing grid cells, neon effects, and particles.

import { ForgeEngine, VIEW_W, VIEW_H, PLAYER_RADIUS } from "./engine";
import { GRID_COLS, GRID_ROWS, CELL_SIZE } from "./arena";
import type { ArenaCell, SignalFragment, VolatilityWave, Particle } from "./types";

export const COLORS = {
  bgVoid: "#0a0a0c",
  bgDeep: "#0d0d12",
  voxelDark: "#1a1a1c",
  voxelMid: "#262628",
  neonMint: "#00FF9D",
  neonCoral: "#FF4D6D",
  iridCyan: "#70F3FF",
  iridMagenta: "#FF00FF",
  iridPurple: "#B28DFF",
  textLight: "#E8E8F0",
  textDim: "#6B6B80",
  gold: "#E0B04E",
};

export function render(
  ctx: CanvasRenderingContext2D,
  eng: ForgeEngine,
  time: number,
) {
  const { grid, signals, waves, particles, px, py, margin, shake } = eng;

  // Screen shake
  ctx.save();
  if (shake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake,
    );
  }

  // Background
  ctx.fillStyle = COLORS.bgVoid;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Subtle grid background
  ctx.strokeStyle = "rgba(38,38,40,0.3)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, VIEW_H);
    ctx.stroke();
  }
  for (let i = 0; i <= GRID_ROWS; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(VIEW_W, i * CELL_SIZE);
    ctx.stroke();
  }

  // Draw cells
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      drawCell(ctx, grid[r][c], time);
    }
  }

  // Draw wave telegraphs
  for (const wave of waves) {
    drawWave(ctx, wave, time);
  }

  // Draw signals
  for (const sig of signals) {
    if (!sig.collected) drawSignal(ctx, sig, time);
  }

  // Draw player
  drawPlayer(ctx, eng, time);

  // Draw particles
  for (const p of particles) {
    drawParticle(ctx, p);
  }

  // Margin vignette
  if (margin < 50) {
    const intensity = (50 - margin) / 50;
    const alpha = intensity * 0.4 * (0.7 + 0.3 * Math.sin(time * 8));
    const grad = ctx.createRadialGradient(
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.3,
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.7,
    );
    grad.addColorStop(0, "rgba(255,77,109,0)");
    grad.addColorStop(1, `rgba(255,77,109,${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // Critical flash
  if (margin < 20 && margin > 0) {
    const flash = Math.sin(time * 12) > 0.7 ? 0.15 : 0;
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,77,109,${flash})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  ctx.restore();
}

function drawCell(ctx: CanvasRenderingContext2D, cell: ArenaCell, time: number) {
  const x = cell.col * CELL_SIZE;
  const y = cell.row * CELL_SIZE;
  const s = CELL_SIZE;
  const pulse = 0.5 + 0.5 * Math.sin(cell.pulse + time * 2);

  if (cell.type === "neutral") {
    // Dark voxel cell
    ctx.fillStyle = COLORS.voxelDark;
    ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
    ctx.strokeStyle = "rgba(38,38,40,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
  } else if (cell.type === "green") {
    // Glowing green cell
    const glow = 0.15 + 0.1 * pulse * cell.intensity;
    ctx.fillStyle = `rgba(0,255,157,${glow})`;
    ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
    ctx.strokeStyle = `rgba(0,255,157,${0.4 + 0.3 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
    // Inner glow dot
    ctx.fillStyle = `rgba(0,255,157,${0.3 + 0.2 * pulse})`;
    ctx.fillRect(x + s/2 - 3, y + s/2 - 3, 6, 6);
  } else if (cell.type === "red") {
    // Pulsing red cell
    const glow = 0.12 + 0.08 * pulse * cell.intensity;
    ctx.fillStyle = `rgba(255,77,109,${glow})`;
    ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
    ctx.strokeStyle = `rgba(255,77,109,${0.35 + 0.25 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
    // Static noise dots
    ctx.fillStyle = `rgba(255,77,109,${0.2 * pulse})`;
    for (let i = 0; i < 3; i++) {
      const dx = (Math.sin(time * 5 + i * 7 + cell.row * 3) * 0.5 + 0.5) * (s - 8);
      const dy = (Math.cos(time * 4 + i * 5 + cell.col * 2) * 0.5 + 0.5) * (s - 8);
      ctx.fillRect(x + 4 + dx, y + 4 + dy, 2, 2);
    }
  } else if (cell.type === "pool") {
    // Iridescent pool cell
    const hue = (time * 60 + cell.row * 20 + cell.col * 15) % 360;
    ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.15 + 0.1 * pulse})`;
    ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
    ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${0.5 + 0.3 * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
    // Shimmer
    ctx.fillStyle = `hsla(${hue}, 80%, 80%, ${0.3 * pulse})`;
    ctx.fillRect(x + s/2 - 4, y + s/2 - 4, 8, 8);
  }
}

function drawWave(ctx: CanvasRenderingContext2D, wave: VolatilityWave, time: number) {
  if (wave.telegraph > 0) {
    // Telegraph warning — shimmering line
    const alpha = 0.2 + 0.15 * Math.sin(time * 10);
    ctx.strokeStyle = `rgba(255,0,255,${alpha})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    if (wave.axis === "row") {
      ctx.beginPath();
      ctx.moveTo(0, wave.index * CELL_SIZE + CELL_SIZE / 2);
      ctx.lineTo(VIEW_W, wave.index * CELL_SIZE + CELL_SIZE / 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(wave.index * CELL_SIZE + CELL_SIZE / 2, 0);
      ctx.lineTo(wave.index * CELL_SIZE + CELL_SIZE / 2, VIEW_H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  } else {
    // Active wave — magenta front
    const pos = wave.progress * (wave.axis === "row" ? CELL_SIZE : CELL_SIZE);
    if (wave.axis === "row") {
      const x = wave.progress * VIEW_W;
      const grad = ctx.createLinearGradient(x - 30, 0, x + 10, 0);
      grad.addColorStop(0, "rgba(255,0,255,0)");
      grad.addColorStop(0.7, "rgba(255,0,255,0.3)");
      grad.addColorStop(1, "rgba(255,0,255,0.6)");
      ctx.fillStyle = grad;
      ctx.fillRect(x - 30, wave.index * CELL_SIZE, 40, CELL_SIZE);
      // Bright front line
      ctx.strokeStyle = "rgba(255,0,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, wave.index * CELL_SIZE);
      ctx.lineTo(x, wave.index * CELL_SIZE + CELL_SIZE);
      ctx.stroke();
    } else {
      const y = wave.progress * VIEW_H;
      const grad = ctx.createLinearGradient(0, y - 30, 0, y + 10);
      grad.addColorStop(0, "rgba(255,0,255,0)");
      grad.addColorStop(0.7, "rgba(255,0,255,0.3)");
      grad.addColorStop(1, "rgba(255,0,255,0.6)");
      ctx.fillStyle = grad;
      ctx.fillRect(wave.index * CELL_SIZE, y - 30, CELL_SIZE, 40);
      ctx.strokeStyle = "rgba(255,0,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wave.index * CELL_SIZE, y);
      ctx.lineTo(wave.index * CELL_SIZE + CELL_SIZE, y);
      ctx.stroke();
    }
  }
}

function drawSignal(ctx: CanvasRenderingContext2D, sig: SignalFragment, time: number) {
  const x = sig.col * CELL_SIZE + CELL_SIZE / 2;
  const y = sig.row * CELL_SIZE + CELL_SIZE / 2;
  const pulse = 0.5 + 0.5 * Math.sin(time * 6);
  const fade = sig.life < 1 ? sig.life : 1;
  const size = 6 + 2 * pulse;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 1.5);
  ctx.globalAlpha = fade;

  // Outer glow
  ctx.fillStyle = `rgba(178,141,255,${0.2 * pulse})`;
  ctx.beginPath();
  ctx.arc(0, 0, size + 6, 0, Math.PI * 2);
  ctx.fill();

  // Diamond
  ctx.fillStyle = COLORS.iridPurple;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size, 0);
  ctx.closePath();
  ctx.fill();

  // Inner shine
  ctx.fillStyle = `rgba(255,255,255,${0.4 * pulse})`;
  ctx.beginPath();
  ctx.moveTo(0, -size + 2);
  ctx.lineTo(size - 2, 0);
  ctx.lineTo(0, size - 2);
  ctx.lineTo(-size + 2, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, eng: ForgeEngine, time: number) {
  const { px, py, margin, dashTimer, invulnerable } = eng;
  const pulse = 0.5 + 0.5 * Math.sin(time * 4);

  // Margin ring
  const ringRadius = PLAYER_RADIUS + 8;
  ctx.strokeStyle = "rgba(38,38,40,0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Margin fill
  const marginColor = margin > 50 ? COLORS.neonMint : margin > 20 ? COLORS.gold : COLORS.neonCoral;
  ctx.strokeStyle = marginColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(px, py, ringRadius, -Math.PI / 2, -Math.PI / 2 + (margin / 100) * Math.PI * 2);
  ctx.stroke();

  // Player body — blocky voxel robot (top-down)
  const s = PLAYER_RADIUS;
  ctx.save();
  ctx.translate(px, py);

  // Invulnerability flicker
  if (invulnerable > 0 && Math.sin(time * 20) > 0) {
    ctx.globalAlpha = 0.5;
  }

  // Body
  ctx.fillStyle = COLORS.voxelMid;
  ctx.fillRect(-s, -s, s * 2, s * 2);

  // Glow outline
  ctx.strokeStyle = dashTimer > 0 ? COLORS.iridCyan : COLORS.neonMint;
  ctx.lineWidth = 2;
  ctx.strokeRect(-s, -s, s * 2, s * 2);

  // Eyes (glowing)
  ctx.fillStyle = `rgba(0,255,157,${0.6 + 0.4 * pulse})`;
  ctx.fillRect(-s + 3, -s + 4, 4, 4);
  ctx.fillRect(s - 7, -s + 4, 4, 4);

  // Antenna
  ctx.strokeStyle = COLORS.neonMint;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(0, -s - 5);
  ctx.stroke();
  ctx.fillStyle = `rgba(0,255,157,${0.5 + 0.5 * pulse})`;
  ctx.fillRect(-1.5, -s - 7, 3, 3);

  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const alpha = p.life / p.maxLife;
  ctx.fillStyle = p.color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.globalAlpha = 1;
}
