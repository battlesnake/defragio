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
    empty(), empty(), empty(), empty(),              // 4-7
    empty(),                                         // 8
    row([[8, '.'], [3, 'Y'], [25, '.'], [3, 'Y'], [18, '.'], [3, '.']]),  // 9 — high stable platforms (escape route)
    row([[12, '.'], [1, '$'], [27, '.'], [1, '$'], [16, '.'], [3, '.']]), // 10 - coins above the high platforms
    row([[57, '.'], [3, 'G']]),                     // 11 - goal stripe top
    row([[2, '.'], [1, 'P'], [54, '.'], [3, 'G']]),  // 12 - goal stripe mid
    row([                                           // 13 — uniform floor; events carve it
      [56, '~'], [1, 'B'], [3, 'G'],
    ]),
    row([                                           // 14 floor base
      [60, '~'],
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
    // World-falling-apart cadence: a chunk of floor reads away every ~1.2s.
    { time: 3.0, type: 'read', cells: [
      { row: 13, col: 10 }, { row: 13, col: 11 },
      { row: 14, col: 10 }, { row: 14, col: 11 },
    ] },
    { time: 4.2, type: 'read', cells: [
      { row: 13, col: 16 }, { row: 13, col: 17 },
      { row: 14, col: 16 }, { row: 14, col: 17 },
    ] },
    { time: 5.3, type: 'read', cells: [
      { row: 13, col: 22 }, { row: 13, col: 23 }, { row: 13, col: 24 },
      { row: 14, col: 22 }, { row: 14, col: 23 }, { row: 14, col: 24 },
    ] },
    { time: 6.5, type: 'read', cells: [
      { row: 13, col: 28 }, { row: 13, col: 29 },
      { row: 14, col: 28 }, { row: 14, col: 29 },
    ] },
    { time: 7.6, type: 'read', cells: [
      { row: 13, col: 33 }, { row: 13, col: 34 }, { row: 13, col: 35 },
      { row: 14, col: 33 }, { row: 14, col: 34 }, { row: 14, col: 35 },
    ] },
    { time: 8.8, type: 'read', cells: [
      { row: 13, col: 39 }, { row: 13, col: 40 },
      { row: 14, col: 39 }, { row: 14, col: 40 },
    ] },
    { time: 10.0, type: 'read', cells: [
      { row: 13, col: 44 }, { row: 13, col: 45 }, { row: 13, col: 46 },
      { row: 14, col: 44 }, { row: 14, col: 45 }, { row: 14, col: 46 },
    ] },
    { time: 11.2, type: 'read', cells: [
      { row: 13, col: 50 }, { row: 13, col: 51 },
      { row: 14, col: 50 }, { row: 14, col: 51 },
    ] },
  ],
};
