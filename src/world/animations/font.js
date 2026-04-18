// 5x7 bitmap font for the death-screen text.
export const GLYPH_W = 5;
export const GLYPH_H = 7;
export const GLYPH_GAP = 1;

export const FONT = {
  ' ': [
    '.....', '.....', '.....', '.....', '.....', '.....', '.....',
  ],
  'Y': [
    'X...X', 'X...X', '.X.X.', '..X..', '..X..', '..X..', '..X..',
  ],
  'O': [
    '.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.',
  ],
  'U': [
    'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.',
  ],
  'L': [
    'X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX',
  ],
  'S': [
    '.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.',
  ],
  'E': [
    'XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX',
  ],
  'M': [
    'X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X',
  ],
  'A': [
    '.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X',
  ],
  // Cyrillic Л — narrower top + slanted legs to distinguish from П.
  'Л': [
    '.XXX.', '.X.X.', '.X.X.', '.X.X.', '.X.X.', 'X...X', 'X...X',
  ],
  'W': [
    'X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'XX.XX', 'X...X',
  ],
  'I': [
    'XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', 'XXXXX',
  ],
  'N': [
    'X...X', 'XX..X', 'X.X.X', 'X.X.X', 'X.X.X', 'X..XX', 'X...X',
  ],
  'B': [
    'XXXX.', 'X...X', 'X...X', 'XXXX.', 'X...X', 'X...X', 'XXXX.',
  ],
  'V': [
    'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.X.X.', '..X..',
  ],
  'D': [
    'XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.',
  ],
};
// Cyrillic О / А / М render with the same glyph as their Latin lookalikes.
FONT['О'] = FONT['O'];
FONT['А'] = FONT['A'];
FONT['М'] = FONT['M'];
