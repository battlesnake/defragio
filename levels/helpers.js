// Build a 60-char row from [count, char] beats. Throws if total !== width.
export function row(beats, width = 60) {
  let out = '';
  let total = 0;
  for (const [n, ch] of beats) {
    if (ch.length !== 1) throw new Error(`bad char in beat: ${ch}`);
    out += ch.repeat(n);
    total += n;
  }
  if (total !== width) {
    throw new Error(`row width ${total} != ${width}: ${out}`);
  }
  return out;
}

export const empty = (w = 60) => '.'.repeat(w);
