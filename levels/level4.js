// Level 4 — "Decay". The floor under the player decays in chunks (read
// events). Standing still means falling into a fresh pit. Keep moving.
import { row, empty } from './helpers.js';

export default {
  id: 4,
  name: 'Decay',
  cursorSpeed: 5.5,
  width: 60,
  height: 16,
  grid: [
    empty(), empty(), empty(), empty(),
    row([[57, '.'], [3, 'G']]),                     // 4
    row([[57, '.'], [3, 'G']]),                     // 5
    row([[57, '.'], [3, 'G']]),                     // 6
    row([[57, '.'], [3, 'G']]),                     // 7
    row([[57, '.'], [3, 'Y']]),                     // 8
    row([[8, '.'], [3, 'Y'], [25, '.'], [3, 'Y'], [18, '.'], [3, 'Y']]),  // 9 — high stable platforms (escape route)
    row([[57, '.'], [3, 'Y']]),                     // 10
    row([[57, '.'], [3, 'Y']]),                     // 11
    row([[2, '.'], [1, 'P'], [54, '.'], [3, 'Y']]),  // 12
    row([                                           // 13 — uniform floor; events carve it
      [56, '~'], [1, 'B'], [3, 'Y'],
    ]),
    row([                                           // 14
      [56, '~'], [1, '~'], [3, 'Y'],
    ]),
    row([                                           // 15
      [60, '~'],
    ]),
  ],
  enemies: [
    { type: 'virus', cell: { row: 12, col: 12 }, patrol: { from: 9,  to: 18 } },
    { type: 'virus', cell: { row: 12, col: 32 }, patrol: { from: 28, to: 38 } },
  ],
  // Floor decays from left to right. Each event pulls a chunk of floor
  // out from under the player. Two-row reads (cols 13 and 14) so the
  // pit goes to the bottom row visually.
  events: [
    { time: 4.0,  type: 'read', cells: [
      { row: 13, col: 14 }, { row: 13, col: 15 },
      { row: 14, col: 14 }, { row: 14, col: 15 },
    ] },
    { time: 6.0,  type: 'read', cells: [
      { row: 13, col: 22 }, { row: 13, col: 23 }, { row: 13, col: 24 },
      { row: 14, col: 22 }, { row: 14, col: 23 }, { row: 14, col: 24 },
    ] },
    { time: 8.5,  type: 'read', cells: [
      { row: 13, col: 34 }, { row: 13, col: 35 },
      { row: 14, col: 34 }, { row: 14, col: 35 },
    ] },
    { time: 11.0, type: 'read', cells: [
      { row: 13, col: 44 }, { row: 13, col: 45 }, { row: 13, col: 46 },
      { row: 14, col: 44 }, { row: 14, col: 45 }, { row: 14, col: 46 },
    ] },
  ],
};
