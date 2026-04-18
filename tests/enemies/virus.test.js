import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVirus, tickVirus } from '../../src/enemies/virus.js';

test('createVirus places enemy at declared cell, vx>0 by default', () => {
  const v = createVirus({ cell: { row: 12, col: 6 }, patrol: { from: 4, to: 11 } });
  assert.equal(v.x, 6.5);
  assert.equal(v.y, 12.5);
  assert.ok(v.vx > 0);
  assert.equal(v.alive, true);
});

test('virus reverses at right patrol bound', () => {
  const v = createVirus({ cell: { row: 0, col: 4 }, patrol: { from: 4, to: 5 } });
  v.x = 5.6;
  tickVirus(v, 0);
  assert.ok(v.vx < 0);
});

test('virus reverses at left patrol bound', () => {
  const v = createVirus({ cell: { row: 0, col: 4 }, patrol: { from: 4, to: 5 } });
  v.vx = -1;
  v.x = 3.4;
  tickVirus(v, 0);
  assert.ok(v.vx > 0);
});

test('tickVirus integrates position', () => {
  const v = createVirus({ cell: { row: 0, col: 4 }, patrol: { from: 4, to: 8 } });
  v.vx = 2;
  const x0 = v.x;
  tickVirus(v, 0.1);
  assert.equal(v.x, x0 + 0.2);
});

test('dead virus does not move', () => {
  const v = createVirus({ cell: { row: 0, col: 4 }, patrol: { from: 4, to: 8 } });
  v.alive = false;
  v.vx = 2;
  const x0 = v.x;
  tickVirus(v, 0.5);
  assert.equal(v.x, x0);
});
