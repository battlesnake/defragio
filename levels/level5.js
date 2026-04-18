// Level 5 — "Maelstrom". Fast cursor, decaying floor + bridges + multiple
// viruses. Combines both event types and the goal-tower pattern.
import { row, empty } from './helpers.js';

export default {
  id: 5,
  name: 'Maelstrom',
  cursorSpeed: 7.0,
  width: 60,
  height: 16,
  grid: [
    empty(), empty(), empty(), empty(),
    row([[57, '.'], [3, 'G']]),                     // 4
    row([[57, '.'], [3, 'G']]),                     // 5
    row([[57, '.'], [3, 'G']]),                     // 6
    row([[57, '.'], [3, 'G']]),                     // 7
    row([[57, '.'], [3, 'Y']]),                     // 8
    row([[12, '.'], [3, 'Y'], [25, '.'], [4, 'Y'], [13, '.'], [3, 'Y']]),  // 9
    row([[57, '.'], [3, 'Y']]),                     // 10
    row([[8, '.'], [2, 'Y'], [22, '.'], [3, 'Y'], [22, '.'], [3, 'Y']]),  // 11
    row([[2, '.'], [1, 'P'], [9, '.'], [1, 'C'], [27, '.'], [1, 'C'], [16, '.'], [3, 'Y']]),  // 12
    row([                                           // 13 — pits at 11-13, 22-25, 34-36 to match rows 14/15
      [4, '~'], [1, 'B'], [6, '~'],   // 11
      [3, '.'],                       // pit 11-13
      [3, '~'], [1, 'B'], [4, '~'],   // 8 (cols 14-21)
      [4, '.'],                       // pit 22-25
      [4, '~'], [1, 'B'], [3, '~'],   // 8 (cols 26-33)
      [3, '.'],                       // pit 34-36
      [4, '~'], [1, 'B'], [8, '~'],   // 13 (cols 37-49)
      [10, 'Y'],                      // 50-59
    ]),
    row([                                           // 14
      [11, '~'],
      [3, '.'],
      [8, '~'],
      [4, '.'],
      [8, '~'],
      [3, '.'],
      [13, '~'],
      [10, 'Y'],   // wider yellow base under goal tower for safe landing
    ]),
    row([                                           // 15
      [11, '~'],
      [3, '.'],
      [8, '~'],
      [4, '.'],
      [8, '~'],
      [3, '.'],
      [13, '~'],
      [10, 'Y'],
    ]),
  ],
  enemies: [
    { type: 'virus', cell: { row: 12, col: 6 },  patrol: { from: 4,  to: 9  } },
    { type: 'virus', cell: { row: 12, col: 18 }, patrol: { from: 15, to: 21 } },
    { type: 'virus', cell: { row: 12, col: 32 }, patrol: { from: 28, to: 36 } },
    { type: 'virus', cell: { row: 12, col: 46 }, patrol: { from: 42, to: 50 } },
  ],
  events: [
    // Bridges (writes) over the wider mid pits
    { time: 3.5, type: 'write', cells: [
      { row: 13, col: 25 }, { row: 13, col: 26 }, { row: 13, col: 27 },
    ] },
    { time: 4.5, type: 'write', cells: [
      { row: 13, col: 41 }, { row: 13, col: 42 },
    ] },
    // Decay events on the floor (reads) creating fresh pits as you go
    { time: 7.0, type: 'read', cells: [
      { row: 13, col: 14 }, { row: 13, col: 15 },
      { row: 14, col: 14 }, { row: 14, col: 15 },
    ] },
    { time: 9.0, type: 'read', cells: [
      { row: 13, col: 32 }, { row: 13, col: 33 },
      { row: 14, col: 32 }, { row: 14, col: 33 },
    ] },
  ],
};
