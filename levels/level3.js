// Level 3 — "Bridges". Wide pit needs a write-bridge mid-level. The
// goal sits high in the top-right corner — unreachable by double-jump
// from the floor. A staircase of writes appears as the player arrives
// at the final column; the player must back off to avoid being crushed
// by the writes, then climb the freshly-laid stairs.
import { row, empty } from './helpers.js';

export default {
  id: 3,
  name: 'Bridges',
  cursorSpeed: 5.0,
  width: 60,
  height: 16,
  grid: [
    empty(),                                          // 0
    row([[57, '.'], [3, 'G']]),                       // 1 — goal high in top-right
    row([[57, '.'], [3, 'G']]),                       // 2
    row([[57, '.'], [3, 'G']]),                       // 3
    empty(),                                          // 4
    empty(),                                          // 5
    empty(),                                          // 6
    empty(),                                          // 7
    empty(),                                          // 8
    row([[24, '.'], [1, '$'], [4, '.'], [1, '$'], [30, '.']]),       // 9 - coins above bridge
    empty(),                                          // 10
    row([[10, '.'], [3, 'Y'], [47, '.']]),            // 11 - early stable platform
    row([[2, '.'], [1, 'P'], [16, '.'], [1, 'C'], [40, '.']]),       // 12 - player start, checkpoint
    row([                                             // 13 - floor
      [16, '~'], [1, 'B'], [3, '~'],                  // 0-19, bad at 16
      [10, '.'],                                      // wide pit cols 20-29
      [4, '~'], [1, 'B'], [4, '~'],                   // 30-38
      [3, '.'],                                       // pit cols 39-41
      [18, '~'],                                      // 42-59 — solid floor under the goal area
    ]),
    row([                                             // 14
      [20, '~'], [10, '.'], [9, '~'], [3, '.'], [18, '~'],
    ]),
    row([                                             // 15
      [20, '~'], [10, '.'], [9, '~'], [3, '.'], [18, '~'],
    ]),
  ],
  enemies: [
    { type: 'virus', cell: { row: 12, col: 8 },  patrol: { from: 5,  to: 14 } },
    { type: 'virus', cell: { row: 12, col: 45 }, patrol: { from: 42, to: 50 } },
  ],
  events: [
    // Bridges over the wide mid pit
    { time: 2.0, type: 'write', cells: [
      { row: 13, col: 22 }, { row: 13, col: 23 },
      { row: 13, col: 24 }, { row: 13, col: 25 },
    ] },
    { time: 2.7, type: 'write', cells: [
      { row: 13, col: 26 }, { row: 13, col: 27 },
      { row: 13, col: 28 }, { row: 13, col: 29 },
    ] },
    // Staircase up to the high goal — fires as the player is reaching the
    // final column. Crushes the player if they're standing in any of these
    // cells when the write completes (~1s after start), so the player must
    // back off to col 52 or earlier and let the stairs solidify before
    // climbing.
    { time: 7.5, type: 'write', cells: [
      { row: 12, col: 53 },
      { row: 11, col: 54 },
      { row: 10, col: 55 },
      { row: 9,  col: 56 },
      { row: 8,  col: 57 },
    ] },
  ],
};
