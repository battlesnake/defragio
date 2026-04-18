// Level 2 — "Fragmenting". Faster cursor, more bad sectors, no mid-level
// checkpoint (only the start). One small write event creates a stepping
// stone in the second pit.
import { row, empty } from './helpers.js';

export default {
  id: 2,
  name: 'Fragmenting',
  cursorSpeed: 4.5,
  width: 60,
  height: 16,
  grid: [
    empty(), empty(), empty(), empty(),
    empty(), empty(), empty(), empty(),              // 4-7
    empty(),                                         // 8
    row([[14, '.'], [2, ':'], [22, '.'], [4, 'Y'], [15, '.'], [3, '.']]), // 9
    row([[20, '.'], [1, '$'], [36, '.'], [3, '.']]), // 10 - coin
    row([[33, '.'], [1, 'Y'], [23, '.'], [3, 'G']]), // 11 - goal stripe top
    row([[2, '.'], [1, 'P'], [10, '.'], [1, '$'], [38, '.'], [2, 'Y'], [3, '.'], [3, 'G']]),   // 12 - goal stripe mid + coin
    row([                                           // 13
      [6, '~'], [1, 'B'], [3, '~'], [1, ':'], [2, '~'], // 13
      [4, '.'],                                         // pit 13-16
      [3, '~'], [1, 'B'], [2, '~'], [1, ':'], [2, '~'], // 9
      [5, '.'],                                         // pit 26-30
      [3, '~'], [1, 'B'], [1, ':'], [8, '~'],           // 13
      [4, '.'],                                         // pit 44-47
      [3, '~'], [1, 'B'], [5, '~'],                     // 9
      [3, 'G'],                                         // goal 57-59
    ]),
    row([                                           // 14
      [13, '~'],
      [4, '.'],
      [9, '~'],
      [5, '.'],
      [13, '~'],
      [4, '.'],
      [9, '~'],
      [3, 'Y'],
    ]),
    row([                                           // 15
      [13, '~'],
      [4, '.'],
      [9, '~'],
      [5, '.'],
      [13, '~'],
      [4, '.'],
      [9, '~'],
      [3, 'Y'],
    ]),
  ],
  enemies: [
    { type: 'virus', cell: { row: 12, col: 8 },  patrol: { from: 6,  to: 12 } },
    { type: 'virus', cell: { row: 12, col: 22 }, patrol: { from: 19, to: 25 } },
    { type: 'virus', cell: { row: 12, col: 40 }, patrol: { from: 36, to: 42 } },
  ],
  // Write a small bridge in the second pit just before player typically arrives.
  events: [
    { time: 6.0, type: 'write', cells: [{ row: 13, col: 28 }, { row: 13, col: 29 }] },
  ],
};
