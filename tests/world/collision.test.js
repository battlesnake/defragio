import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCollisions } from '../../src/world/collision.js';
import { TILE } from '../../src/world/tile.js';

function makeLevel() {
  const tiles = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      row.push(r === 4 ? TILE.CYAN_SOLID : TILE.FREE);
    }
    tiles.push(row);
  }
  tiles[2][3] = TILE.SYS;
  tiles[3][3] = TILE.SYS;
  return { tiles, width: 5, height: 5 };
}

test('player falling onto floor lands and onGround=true', () => {
  const level = makeLevel();
  const player = { x: 1.5, y: 3.6, vx: 0, vy: 5, onGround: false, width: 1, height: 1 };
  resolveCollisions(player, level);
  assert.equal(player.onGround, true);
  assert.equal(player.vy, 0);
  assert.equal(player.y, 3.5);
});

test('player walking into a wall stops horizontally', () => {
  const level = makeLevel();
  const player = { x: 2.6, y: 2.5, vx: 5, vy: 0, onGround: false, width: 1, height: 1 };
  resolveCollisions(player, level);
  assert.equal(player.vx, 0);
  assert.ok(player.x <= 2.5);
});

test('player jumping into a ceiling stops upward', () => {
  const tiles = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      row.push((r === 1 || r === 4) ? TILE.CYAN_SOLID : TILE.FREE);
    }
    tiles.push(row);
  }
  const level = { tiles, width: 5, height: 5 };
  const player = { x: 2.5, y: 2.4, vx: 0, vy: -5, onGround: false, width: 1, height: 1 };
  resolveCollisions(player, level);
  assert.equal(player.vy, 0);
  assert.ok(player.y >= 2.5);
});

test('falling through free space does not change y', () => {
  const tiles = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) row.push(TILE.FREE);
    tiles.push(row);
  }
  const level = { tiles, width: 5, height: 5 };
  const player = { x: 2.5, y: 2.5, vx: 0, vy: 5, onGround: false, width: 1, height: 1 };
  resolveCollisions(player, level);
  assert.equal(player.y, 2.5);
  assert.equal(player.onGround, false);
});
