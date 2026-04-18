import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rowOffset, makeRowPhases } from '../../src/util/noise.js';

test('rowOffset is deterministic for given (row, t, phases)', () => {
  const phases = makeRowPhases(42, 16, 3);
  const a = rowOffset(5, 1.234, phases);
  const b = rowOffset(5, 1.234, phases);
  assert.equal(a, b);
});

test('rowOffset varies between rows', () => {
  const phases = makeRowPhases(42, 16, 3);
  const r0 = rowOffset(0, 1.0, phases);
  const r5 = rowOffset(5, 1.0, phases);
  assert.notEqual(r0, r5);
});

test('rowOffset stays within sum of amplitudes', () => {
  const phases = makeRowPhases(42, 16, 3);
  const max = 1.5 + 0.8 + 0.4;
  for (let row = 0; row < 16; row++) {
    for (let t = 0; t < 30; t += 0.1) {
      const v = rowOffset(row, t, phases);
      assert.ok(Math.abs(v) <= max + 1e-9, `row=${row} t=${t} v=${v}`);
    }
  }
});

test('makeRowPhases with same seed produces same phases', () => {
  const a = makeRowPhases(7, 4, 3);
  const b = makeRowPhases(7, 4, 3);
  assert.deepEqual(a, b);
});
