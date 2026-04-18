// Level 3 — "Bridges". A wide pit mid-level (impassable on its own)
// becomes crossable when a write event lays down a bridge after ~5s.
// Player must wait for the write tell, then sprint across.
import { row, empty } from './helpers.js';

export default {
  id: 3,
  name: 'Bridges',
  cursorSpeed: 5.0,
  width: 60,
  height: 16,
  grid: [
    empty(), empty(), empty(), empty(),
    row([[57, '.'], [3, 'G']]),                     // 4
    row([[57, '.'], [3, 'G']]),                     // 5
    row([[57, '.'], [3, 'G']]),                     // 6
    row([[57, '.'], [3, 'G']]),                     // 7
    row([[57, '.'], [3, 'Y']]),                     // 8
    row([[57, '.'], [3, 'Y']]),                     // 9
    row([[57, '.'], [3, 'Y']]),                     // 10
    row([[10, '.'], [3, 'Y'], [44, '.'], [3, 'Y']]),  // 11 - safe yellow before pit
    row([[2, '.'], [1, 'P'], [16, '.'], [1, 'C'], [37, '.'], [3, 'Y']]),  // 12
    row([                                           // 13
      [16, '~'], [1, 'B'], [3, '~'],                // 0-19, bad at 16
      [10, '.'],                                    // wide pit cols 20-29
      [4, '~'], [1, 'B'], [4, '~'],                 // 30-38
      [3, '.'],                                     // pit cols 39-41
      [15, '~'],                                    // 42-56
      [3, 'Y'],                                     // 57-59
    ]),
    row([                                           // 14
      [20, '~'],
      [10, '.'],
      [9, '~'],
      [3, '.'],
      [15, '~'],
      [3, 'Y'],
    ]),
    row([                                           // 15
      [20, '~'],
      [10, '.'],
      [9, '~'],
      [3, '.'],
      [15, '~'],
      [3, 'Y'],
    ]),
  ],
  enemies: [
    { type: 'virus', cell: { row: 12, col: 8 },  patrol: { from: 5,  to: 14 } },
    { type: 'virus', cell: { row: 12, col: 45 }, patrol: { from: 42, to: 50 } },
  ],
  // The wide pit is impassable. Bridge write events appear at t=4.5s and
  // t=5.5s, laying down 4 cells across cols 22-25 (then 26-29 a beat later).
  events: [
    { time: 4.5, type: 'write', cells: [
      { row: 13, col: 22 }, { row: 13, col: 23 },
      { row: 13, col: 24 }, { row: 13, col: 25 },
    ] },
    { time: 5.5, type: 'write', cells: [
      { row: 13, col: 26 }, { row: 13, col: 27 },
      { row: 13, col: 28 }, { row: 13, col: 29 },
    ] },
    // Stepping stones at row 12 just before the goal tower, so the player
    // has a launch pad from which to jump-and-right onto the goal cells.
    { time: 8.5, type: 'write', cells: [
      { row: 12, col: 52 }, { row: 12, col: 53 }, { row: 12, col: 54 },
    ] },
  ],
};
