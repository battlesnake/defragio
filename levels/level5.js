// Level 5 — "Maelstrom". Fast cursor, decaying floor + bridges + a tall
// wall that requires a write-in step to clear. Combines all event types.
import { row, empty } from './helpers.js';

// 9-cell tall wall at col 47, rows 4-12 (row 13 stays floor so player
// can land beyond it). Without help the player can't clear it even with
// a double jump from the floor (max ~4.4 cells above floor, wall top at
// row 4 = 9 cells above floor).
function rowWithWall(otherBeats, wallCol = 47) {
  // otherBeats spans cols 0-46 then 48-59. Insert [1, 'Y'] in the middle.
  // We split by tracking running col and inserting at wallCol.
  const out = [];
  let c = 0;
  for (const [n, ch] of otherBeats) {
    if (c <= wallCol && c + n > wallCol) {
      const before = wallCol - c;
      const after  = n - before - 1;
      if (before > 0) out.push([before, ch]);
      out.push([1, 'Y']);
      if (after > 0) out.push([after, ch]);
    } else {
      out.push([n, ch]);
    }
    c += n;
  }
  return row(out);
}

export default {
  id: 5,
  name: 'Maelstrom',
  cursorSpeed: 7.0,
  tophatSpeedMul: 1.8,
  tophatReadSpeedMul: 1.5,
  tophatDelayMul: 0.1,
  tophatIntervalMul: 0.55,
  tophatReadIntervalMul: 0.30,
  width: 60,
  height: 16,
  grid: [
    empty(), empty(), empty(), empty(),
    rowWithWall([[60, '.']]),                                        // 4 — wall column starts here
    rowWithWall([[60, '.']]),                                        // 5
    rowWithWall([[60, '.']]),                                        // 6
    rowWithWall([[60, '.']]),                                        // 7
    rowWithWall([[60, '.']]),                                        // 8
    rowWithWall([[12, '.'], [3, 'Y'], [3, '.'], [1, '$'], [21, '.'], [4, 'Y'], [13, '.'], [3, '.']]), // 9
    rowWithWall([[37, '.'], [1, '$'], [19, '.'], [3, '.']]),         // 10
    rowWithWall([[8, '.'], [2, 'Y'], [22, '.'], [3, 'Y'], [22, '.'], [3, 'G']]), // 11 (Y wall replaces a dot here)
    rowWithWall([[2, '.'], [1, 'P'], [9, '.'], [1, 'C'], [27, '.'], [1, 'C'], [16, '.'], [3, 'G']]),  // 12
    row([                                           // 13 — floor stays clear under the wall so player can land beyond it
      [4, '~'], [1, 'B'], [6, '~'],   // 11
      [3, '.'],                       // pit 11-13
      [3, '~'], [1, 'B'], [4, '~'],   // 8 (cols 14-21)
      [4, '.'],                       // pit 22-25
      [4, '~'], [1, 'B'], [3, '~'],   // 8 (cols 26-33)
      [3, '.'],                       // pit 34-36
      [4, '~'], [1, 'B'], [8, '~'],   // bad sector at col 41
      [7, '~'],                       // floor 50-56
      [3, 'G'],                       // goal 57-59
    ]),
    row([                                           // 14
      [11, '~'], [3, '.'], [8, '~'], [4, '.'], [8, '~'], [3, '.'], [13, '~'], [10, '~'],
    ]),
    row([                                           // 15
      [11, '~'], [3, '.'], [8, '~'], [4, '.'], [8, '~'], [3, '.'], [13, '~'], [10, '~'],
    ]),
  ],
  enemies: [
    { type: 'virus', cell: { row: 12, col: 6 },  patrol: { from: 4,  to: 9  } },
    { type: 'virus', cell: { row: 12, col: 18 }, patrol: { from: 15, to: 21 } },
    { type: 'virus', cell: { row: 12, col: 32 }, patrol: { from: 28, to: 36 } },
  ],
  events: [
    // ── Bridges (write in as player approaches each pit) ──────────────
    // Pit 1 (cols 11-13)
    { col: 5, type: 'write', cells: [
      { row: 13, col: 11 }, { row: 13, col: 12 }, { row: 13, col: 13 },
    ] },
    // Pit 2 (cols 22-25) — middle pit
    { col: 16, type: 'write', cells: [
      { row: 13, col: 22 }, { row: 13, col: 23 },
      { row: 13, col: 24 }, { row: 13, col: 25 },
    ] },
    // Original mid bridge (kept — alt segment higher in the pit)
    { col: 18, type: 'write', cells: [
      { row: 13, col: 25 }, { row: 13, col: 26 }, { row: 13, col: 27 },
    ] },
    // Pit 3 (cols 34-36)
    { col: 28, type: 'write', cells: [
      { row: 13, col: 34 }, { row: 13, col: 35 }, { row: 13, col: 36 },
    ] },

    // ── Wall climb (cols approaching 47) ──────────────────────────────
    // Lower step first, then a higher one — staircase write-in just in time.
    { col: 36, type: 'write', cells: [{ row: 12, col: 45 }] },
    { col: 38, type: 'write', cells: [{ row: 11, col: 46 }] },
    { col: 40, type: 'write', cells: [{ row: 10, col: 45 }] },

    // ── Alternative high path at row 8 (easier traversal but writes in
    //    just in time, so committing to it costs precious seconds — if the
    //    reads catch up, the floor under the launch point is gone). ──
    { col: 11, type: 'write', cells: [
      { row: 8, col: 17 }, { row: 8, col: 18 }, { row: 8, col: 19 },
      { row: 8, col: 20 }, { row: 8, col: 21 }, { row: 8, col: 22 },
    ] },
    { col: 21, type: 'write', cells: [
      { row: 8, col: 27 }, { row: 8, col: 28 }, { row: 8, col: 29 },
      { row: 8, col: 30 }, { row: 8, col: 31 }, { row: 8, col: 32 },
    ] },
    { col: 31, type: 'write', cells: [
      { row: 8, col: 37 }, { row: 8, col: 38 }, { row: 8, col: 39 },
      { row: 8, col: 40 }, { row: 8, col: 41 }, { row: 8, col: 42 },
    ] },
    // Falling-apart decay
    { time: 1.5, type: 'read', cells: [
      { row: 13, col: 6 }, { row: 13, col: 7 },
      { row: 14, col: 6 }, { row: 14, col: 7 },
    ] },
    { time: 2.1, type: 'read', cells: [
      { row: 13, col: 14 }, { row: 13, col: 15 },
      { row: 14, col: 14 }, { row: 14, col: 15 },
    ] },
    { time: 2.7, type: 'read', cells: [
      { row: 13, col: 18 }, { row: 13, col: 19 }, { row: 13, col: 20 },
      { row: 14, col: 18 }, { row: 14, col: 19 }, { row: 14, col: 20 },
    ] },
    { time: 3.3, type: 'read', cells: [
      { row: 13, col: 28 }, { row: 13, col: 29 },
      { row: 14, col: 28 }, { row: 14, col: 29 },
    ] },
    { time: 3.9, type: 'read', cells: [
      { row: 13, col: 32 }, { row: 13, col: 33 },
      { row: 14, col: 32 }, { row: 14, col: 33 },
    ] },
    { time: 5.5, type: 'read', cells: [
      { row: 13, col: 51 }, { row: 13, col: 52 },
      { row: 14, col: 51 }, { row: 14, col: 52 },
    ] },
  ],
};
