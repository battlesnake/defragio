import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLevel } from '../../src/world/level-loader.js';
import { TILE } from '../../src/world/tile.js';
import level1 from '../../levels/level1.js';

const sampleLevel = {
  id: 99,
  name: 'Sample',
  cursorSpeed: 2.0,
  width: 5,
  height: 3,
  grid: [
    '.....',
    '..P..',
    '~~B~G',
  ],
  enemies: [],
  events: [],
};

test('loadLevel returns a 2D tile array', () => {
  const lvl = loadLevel(sampleLevel);
  assert.equal(lvl.tiles.length, 3);
  assert.equal(lvl.tiles[0].length, 5);
});

test('loadLevel parses tile types correctly', () => {
  const lvl = loadLevel(sampleLevel);
  assert.equal(lvl.tiles[0][0], TILE.FREE);
  assert.equal(lvl.tiles[2][0], TILE.CYAN_SOLID);
  assert.equal(lvl.tiles[2][2], TILE.BAD);
  assert.equal(lvl.tiles[2][4], TILE.GOAL);
});

test('loadLevel extracts player start from P and replaces with FREE', () => {
  const lvl = loadLevel(sampleLevel);
  assert.deepEqual(lvl.playerStart, { row: 1, col: 2 });
  assert.equal(lvl.tiles[1][2], TILE.FREE);
});

test('loadLevel preserves cursorSpeed, width, height, name, id', () => {
  const lvl = loadLevel(sampleLevel);
  assert.equal(lvl.id, 99);
  assert.equal(lvl.name, 'Sample');
  assert.equal(lvl.cursorSpeed, 2.0);
  assert.equal(lvl.width, 5);
  assert.equal(lvl.height, 3);
});

test('loadLevel passes through enemies and events arrays', () => {
  const lvl = loadLevel({ ...sampleLevel, enemies: [{ type: 'virus' }], events: [{ time: 1 }] });
  assert.equal(lvl.enemies.length, 1);
  assert.equal(lvl.enemies[0].type, 'virus');
  assert.equal(lvl.events.length, 1);
});

test('loadLevel throws if no P found', () => {
  const bad = { ...sampleLevel, grid: ['.....', '.....', '~~~~~'] };
  assert.throws(() => loadLevel(bad), /no player start/i);
});

test('Level 1 loads without error and has a player start', () => {
  const lvl = loadLevel(level1);
  assert.equal(lvl.id, 1);
  assert.equal(lvl.width, 60);
  assert.equal(lvl.height, 16);
  assert.ok(lvl.playerStart);
  assert.equal(lvl.tiles.length, 16);
  assert.equal(lvl.tiles[0].length, 60);
});

import { levels } from '../../levels/index.js';

for (let i = 0; i < 5; i++) {
  test(`Level ${i + 1} loads without error and is 60x16`, () => {
    const lvl = loadLevel(levels[i]);
    assert.equal(lvl.width, 60);
    assert.equal(lvl.height, 16);
    assert.equal(lvl.tiles.length, 16);
    for (const row of lvl.tiles) assert.equal(row.length, 60);
    assert.ok(lvl.playerStart);
  });
}
