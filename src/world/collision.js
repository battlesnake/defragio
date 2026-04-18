import { isSolid } from './tile.js';

// Player AABB: cells centered at (x, y), width × height.
// Per-axis push-out against any solid cells. Call AFTER integration.
// Mutates player.x, .y, .vx, .vy, .onGround.

export function resolveCollisions(player, level) {
  player.onGround = false;
  resolveY(player, level);
  resolveX(player, level);

  // Hard clamp to level horizontal bounds so the player can't walk off
  // the left or right edge (and then fall to their death).
  const half = player.width / 2;
  if (player.x < half) {
    player.x = half;
    if (player.vx < 0) player.vx = 0;
  } else if (player.x > level.width - half) {
    player.x = level.width - half;
    if (player.vx > 0) player.vx = 0;
  }
}

function resolveY(player, level) {
  const half = player.height / 2;
  if (player.vy > 0) {
    const bottomY = player.y + half;
    const topRow = Math.floor(bottomY);
    if (topRow >= 0 && topRow < level.height) {
      const colL = Math.floor(player.x - half + 0.001);
      const colR = Math.floor(player.x + half - 0.001);
      for (let c = colL; c <= colR; c++) {
        if (c < 0 || c >= level.width) continue;
        if (isSolid(level.tiles[topRow][c])) {
          player.y = topRow - half;
          player.vy = 0;
          player.onGround = true;
          return;
        }
      }
    }
  } else if (player.vy < 0) {
    const topY = player.y - half;
    const topRow = Math.floor(topY);
    if (topRow >= 0 && topRow < level.height) {
      const colL = Math.floor(player.x - half + 0.001);
      const colR = Math.floor(player.x + half - 0.001);
      for (let c = colL; c <= colR; c++) {
        if (c < 0 || c >= level.width) continue;
        if (isSolid(level.tiles[topRow][c])) {
          player.y = topRow + 1 + half;
          player.vy = 0;
          return;
        }
      }
    }
  } else {
    const bottomY = player.y + half;
    const justBelow = Math.floor(bottomY + 0.01);
    if (justBelow >= 0 && justBelow < level.height) {
      const colL = Math.floor(player.x - half + 0.001);
      const colR = Math.floor(player.x + half - 0.001);
      for (let c = colL; c <= colR; c++) {
        if (c < 0 || c >= level.width) continue;
        if (isSolid(level.tiles[justBelow][c])) {
          player.onGround = true;
          break;
        }
      }
    }
  }
}

function resolveX(player, level) {
  const half = player.width / 2;
  if (player.vx > 0) {
    const rightX = player.x + half;
    const targetCol = Math.floor(rightX);
    if (targetCol >= 0 && targetCol < level.width) {
      const rowT = Math.floor(player.y - half + 0.001);
      const rowB = Math.floor(player.y + half - 0.001);
      for (let r = rowT; r <= rowB; r++) {
        if (r < 0 || r >= level.height) continue;
        if (isSolid(level.tiles[r][targetCol])) {
          player.x = targetCol - half;
          player.vx = 0;
          return;
        }
      }
    }
  } else if (player.vx < 0) {
    const leftX = player.x - half;
    const targetCol = Math.floor(leftX);
    if (targetCol >= 0 && targetCol < level.width) {
      const rowT = Math.floor(player.y - half + 0.001);
      const rowB = Math.floor(player.y + half - 0.001);
      for (let r = rowT; r <= rowB; r++) {
        if (r < 0 || r >= level.height) continue;
        if (isSolid(level.tiles[r][targetCol])) {
          player.x = targetCol + 1 + half;
          player.vx = 0;
          return;
        }
      }
    }
  }
}
