import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefrag, advanceDefrag, defragOpAt } from '../../src/world/defrag.js';
import { TILE } from '../../src/world/tile.js';

function makeLevel() {
  // 20-wide, 4-tall; row 2 is solid cyan, others are free
  const tiles = [];
  for (let r = 0; r < 4; r++) {
    const row = [];
    for (let c = 0; c < 20; c++) row.push(r === 2 ? TILE.CYAN_SOLID : TILE.FREE);
    tiles.push(row);
  }
  return { tiles, width: 20, height: 4 };
}

test('createDefrag respects initialOffset (front starts negative)', () => {
  const d = createDefrag({ levelId: 1, level: makeLevel(), speed: 2.0, initialOffset: 5 });
  assert.equal(d.front, -5);
});

test('advanceDefrag advances front at speed', () => {
  const d = createDefrag({ levelId: 1, level: makeLevel(), speed: 2.0, initialOffset: 0 });
  advanceDefrag(d, 1.0);
  assert.ok(Math.abs(d.front - 2.0) < 1e-9);
});

test('after enough time the level is mutated by completed ops', () => {
  const level = makeLevel();
  const before = level.tiles.map(r => r.slice());
  const d = createDefrag({ levelId: 1, level, speed: 2.0, initialOffset: 0 });
  for (let i = 0; i < 200; i++) advanceDefrag(d, 0.05); // 10s simulated
  // Some cell — anywhere — should differ from the initial state.
  let changed = false;
  for (let r = 0; r < level.tiles.length && !changed; r++) {
    for (let c = 0; c < level.tiles[r].length; c++) {
      if (level.tiles[r][c] !== before[r][c]) { changed = true; break; }
    }
  }
  assert.ok(changed, 'expected at least one cell to be mutated by completed ops');
});

test('same level + seed → same op stream (deterministic)', () => {
  const a = createDefrag({ levelId: 7, level: makeLevel(), speed: 2.0, initialOffset: 0 });
  const b = createDefrag({ levelId: 7, level: makeLevel(), speed: 2.0, initialOffset: 0 });
  for (let i = 0; i < 50; i++) {
    advanceDefrag(a, 0.05);
    advanceDefrag(b, 0.05);
  }
  // ops timestamps and counts should match exactly
  assert.equal(a.ops.length, b.ops.length);
  for (let i = 0; i < a.ops.length; i++) {
    assert.equal(a.ops[i].type, b.ops[i].type);
    assert.deepEqual(a.ops[i].cells, b.ops[i].cells);
  }
});

test('defragOpAt returns op type for cells in active ops', () => {
  const level = makeLevel();
  const d = createDefrag({ levelId: 1, level, speed: 0, initialOffset: 0 });
  // Force a known op
  d.ops.push({
    type: 'read',
    cells: [{ row: 2, col: 5 }, { row: 2, col: 6 }],
    scheduledAt: 0, completeAt: 1, applied: false,
  });
  assert.equal(defragOpAt(d, 2, 5), 'read');
  assert.equal(defragOpAt(d, 2, 6), 'read');
  assert.equal(defragOpAt(d, 2, 7), null);
  assert.equal(defragOpAt(d, 0, 5), null);
});
