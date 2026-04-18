import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCursor, advanceCursor, cursorAtRow, cursorMean } from '../../src/world/cursor.js';

test('createCursor seeds per-row phases deterministically', () => {
  const a = createCursor({ levelId: 1, height: 16, speed: 3.0 });
  const b = createCursor({ levelId: 1, height: 16, speed: 3.0 });
  for (let r = 0; r < 16; r++) {
    assert.equal(cursorAtRow(a, r), cursorAtRow(b, r));
  }
});

test('cursor base advances at speed', () => {
  const c = createCursor({ levelId: 1, height: 16, speed: 3.0 });
  advanceCursor(c, 1.0);
  assert.ok(c.baseX >= 3.0 - 1e-9 && c.baseX <= 3.0 + 1e-9);
});

test('cursorAtRow varies between rows', () => {
  const c = createCursor({ levelId: 1, height: 16, speed: 3.0 });
  advanceCursor(c, 1.0);
  const r0 = cursorAtRow(c, 0);
  const r5 = cursorAtRow(c, 5);
  assert.notEqual(r0, r5);
});

test('cursorMean stays within reasonable bounds of baseX', () => {
  const c = createCursor({ levelId: 1, height: 16, speed: 3.0 });
  for (let i = 0; i < 300; i++) {
    advanceCursor(c, 0.1);
    assert.ok(Math.abs(cursorMean(c) - c.baseX) < 3.0);
  }
});
