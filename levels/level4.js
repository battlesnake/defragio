// Level 4 — "Decay". The floor under the player decays in chunks (read
// events targeting only the surface row). Underneath, scattered bad
// sectors lie in wait — when the surface reads away, falling into the
// freshly-exposed pit can land you on a B and kill you.
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
    row([[12, '.'], [1, '$'], [27, '.'], [1, '$'], [16, '.'], [3, '.']]), // 10 — coins above the high platforms
    row([[57, '.'], [3, 'G']]),                     // 11 — goal stripe top
    row([[2, '.'], [1, 'P'], [54, '.'], [3, 'G']]),  // 12 — goal stripe mid
    row([                                           // 13 — uniform surface; events carve it (only row 13)
      [56, '~'], [1, 'B'], [3, 'G'],
    ]),
    row([                                           // 14 — sub-surface with scattered B sectors
      [9, '~'], [1, 'B'],   // B at col 9   (under read at 8-9)
      [11, '~'], [1, 'B'],  // B at col 21  (under read at 20-22)
      [14, '~'], [1, 'B'],  // B at col 36  (under read at 35-37)
      [9, '~'], [1, 'B'],   // B at col 46  (under read at 44-46)
      [13, '~'],            // remainder solid
    ]),
    row([                                           // 15 floor base
      [60, '~'],
    ]),
  ],
  enemies: [
    { type: 'virus', cell: { row: 12, col: 12 }, patrol: { from: 9,  to: 18 } },
    { type: 'virus', cell: { row: 12, col: 32 }, patrol: { from: 28, to: 38 } },
  ],
  events: [
    // Falling-apart cadence: surface chunks (row 13) read away every ~0.6s.
    // Some reveal scattered bad sectors at row 14 (death pits); others
    // expose safe sub-surface ~ (just inconvenient pits).
    { time: 1.0, type: 'read', cells: [{ row: 13, col: 8 }, { row: 13, col: 9 }] },
    { time: 1.6, type: 'read', cells: [{ row: 13, col: 14 }, { row: 13, col: 15 }] },
    { time: 2.2, type: 'read', cells: [{ row: 13, col: 20 }, { row: 13, col: 21 }, { row: 13, col: 22 }] },
    { time: 2.8, type: 'read', cells: [{ row: 13, col: 26 }, { row: 13, col: 27 }] },
    { time: 3.4, type: 'read', cells: [{ row: 13, col: 31 }, { row: 13, col: 32 }] },
    { time: 4.0, type: 'read', cells: [{ row: 13, col: 35 }, { row: 13, col: 36 }, { row: 13, col: 37 }] },
    { time: 4.6, type: 'read', cells: [{ row: 13, col: 40 }, { row: 13, col: 41 }] },
    { time: 5.2, type: 'read', cells: [{ row: 13, col: 44 }, { row: 13, col: 45 }, { row: 13, col: 46 }] },
    { time: 5.8, type: 'read', cells: [{ row: 13, col: 50 }, { row: 13, col: 51 }] },
    { time: 6.4, type: 'read', cells: [{ row: 13, col: 53 }, { row: 13, col: 54 }] },
  ],
};
