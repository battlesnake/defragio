export const clamp = (x, lo, hi) => x < lo ? lo : x > hi ? hi : x;
export const lerp  = (a, b, t)   => a + (b - a) * t;
export const sign  = (x)         => x < 0 ? -1 : x > 0 ? 1 : 0;
