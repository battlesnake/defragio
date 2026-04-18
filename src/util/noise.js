// Deterministic pseudo-random in [0, 1) given a string-or-number seed.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const COMPONENTS = [
  { period: 2.7, amp: 1.5 },
  { period: 3.4, amp: 0.8 },
  { period: 4.1, amp: 0.4 },
];

export function makeRowPhases(seed, numRows, numComponents = COMPONENTS.length) {
  const rng = mulberry32(seed);
  const out = [];
  for (let r = 0; r < numRows; r++) {
    const row = [];
    for (let c = 0; c < numComponents; c++) row.push(rng());
    out.push(row);
  }
  return out;
}

// Returns the per-row offset (in cells) at time t, for the given row.
// Sum of sine components with row-specific phases.
export function rowOffset(row, t, phases) {
  let sum = 0;
  for (let i = 0; i < COMPONENTS.length; i++) {
    const { period, amp } = COMPONENTS[i];
    const phase = phases[row][i];
    sum += amp * Math.sin(2 * Math.PI * (t / period + phase));
  }
  return sum;
}
