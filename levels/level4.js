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
    // Falling-apart cadence: floor chunks read away every ~0.6s.
    // First few chunks fire EARLY (ahead of the player) so chasm-pits already
    // exist when they arrive.
    { time: 1.0, type: 'read', cells: [
      { row: 13, col: 8 },  { row: 13, col: 9 },
      { row: 14, col: 8 },  { row: 14, col: 9 },
    ] },
    { time: 1.6, type: 'read', cells: [
      { row: 13, col: 14 }, { row: 13, col: 15 },
      { row: 14, col: 14 }, { row: 14, col: 15 },
    ] },
    { time: 2.2, type: 'read', cells: [
      { row: 13, col: 20 }, { row: 13, col: 21 }, { row: 13, col: 22 },
      { row: 14, col: 20 }, { row: 14, col: 21 }, { row: 14, col: 22 },
    ] },
    { time: 2.8, type: 'read', cells: [
      { row: 13, col: 26 }, { row: 13, col: 27 },
      { row: 14, col: 26 }, { row: 14, col: 27 },
    ] },
    { time: 3.4, type: 'read', cells: [
      { row: 13, col: 31 }, { row: 13, col: 32 },
      { row: 14, col: 31 }, { row: 14, col: 32 },
    ] },
    { time: 4.0, type: 'read', cells: [
      { row: 13, col: 35 }, { row: 13, col: 36 }, { row: 13, col: 37 },
      { row: 14, col: 35 }, { row: 14, col: 36 }, { row: 14, col: 37 },
    ] },
    { time: 4.6, type: 'read', cells: [
      { row: 13, col: 40 }, { row: 13, col: 41 },
      { row: 14, col: 40 }, { row: 14, col: 41 },
    ] },
    { time: 5.2, type: 'read', cells: [
      { row: 13, col: 44 }, { row: 13, col: 45 }, { row: 13, col: 46 },
      { row: 14, col: 44 }, { row: 14, col: 45 }, { row: 14, col: 46 },
    ] },
    { time: 5.8, type: 'read', cells: [
      { row: 13, col: 50 }, { row: 13, col: 51 },
      { row: 14, col: 50 }, { row: 14, col: 51 },
    ] },
    { time: 6.4, type: 'read', cells: [
      { row: 13, col: 53 }, { row: 13, col: 54 },
      { row: 14, col: 53 }, { row: 14, col: 54 },
    ] },
  ],
};
