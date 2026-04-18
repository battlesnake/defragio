# Defrag Game — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable Win98-defrag-themed side-scrolling platformer MVP that runs in the browser. Player traverses Level 1, dodges a jagged-front defrag cursor, fights one virus enemy, dies on bad sectors or cursor overrun, restarts at checkpoints, and wins by touching the magenta goal cluster.

**Architecture:** Vanilla HTML / CSS / ES modules. No framework, no bundler. DOM-grid renderer with a recycled cell pool. Pure-logic modules (physics, collision, cursor, level loader, input buffers, enemies) are tested with `node:test` (zero dependencies). Render and DOM-touching modules are visually verified. Each concern lives in its own small file (≤150–200 lines).

**Tech Stack:**
- HTML5 + CSS3 + JavaScript ES modules (browser native)
- `node:test` + `node:assert` for unit tests (built into Node ≥ 18)
- `python3 -m http.server` for the dev server (so ESM imports work over `http://`)

**Reference spec:** `docs/superpowers/specs/2026-04-18-defrag-game-design.md`

---

## File structure

After this plan, the repo will look like this:

```
defrag/
  index.html                      # Boots the game module
  package.json                    # type:module, npm test runs node --test
  README.md                       # How to run dev / tests (created in Task 1)
  src/
    boot.js                       # Wires everything, starts the game
    game.js                       # State machine + RAF loop
    config.js                     # Tunable constants in one place
    util/
      math.js                     # clamp, lerp, sign
      noise.js                    # Deterministic sum-of-sines (cursor wobble)
    input/
      keymap.js                   # Key code → action mapping (arrows + WASD + space)
      keystate.js                 # Currently pressed actions; preventDefault wiring
      buffer.js                   # Jump buffer + coyote-time logic (pure)
    player/
      state.js                    # Player state object (position, vel, on_ground, ...)
      physics.js                  # Gravity + velocity integration (pure)
      jump.js                     # Jump start / variable-height release (pure)
    world/
      tile.js                     # Tile constants + isSolid / isLethal queries
      level-loader.js             # Parse ASCII grid into tiles + spawns + events
      collision.js                # AABB vs tile grid, separate-axis (pure)
      cursor.js                   # Per-row jagged defrag cursor (pure)
      checkpoint.js               # Last-touched checkpoint tracking
    render/
      camera.js                   # Camera position (pure-ish)
      grid.js                     # DOM cell pool, repaint
      cursor-sprite.js            # Renders cursor cells over the grid
      player-sprite.js            # Renders player as overlaid div
      enemy-sprite.js             # Renders enemies as overlaid divs
      chrome.js                   # Updates status bar text + % complete
    enemies/
      registry.js                 # type → factory dispatch
      virus.js                    # Virus enemy (patrol + stomp)
    audio/
      sounds.js                   # Preload + play helpers
  levels/
    index.js                      # Exports [level1, ...]
    level1.js                     # Authored ASCII grid + metadata for Level 1
  styles/
    layout.css                    # Body + stage background
    chrome.css                    # Win98 window chrome
    grid.css                      # Cell type classes + animations
    sprites.css                   # Player + enemy sprite backgrounds
  assets/
    audio/
      death.wav                   # Win98 system error sound (placeholder OK)
      level-complete.wav          # Win98 chime (placeholder OK)
  tests/
    util/
      noise.test.js
      math.test.js
    input/
      buffer.test.js
    player/
      physics.test.js
      jump.test.js
    world/
      tile.test.js
      level-loader.test.js
      collision.test.js
      cursor.test.js
      checkpoint.test.js
    enemies/
      virus.test.js
```

**File-size discipline:** every file should stay under ~200 lines. If a file grows past that during implementation, split it before continuing.

---

## Task 1: Project scaffolding

**Goal:** Repo has dirs, package.json, gitignore, dev server documentation, and a blank index.html that loads a stub boot module. `npm test` runs and finds zero tests successfully.

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/boot.js`
- Create: `README.md`
- Create: empty dirs via placeholder gitkeep files (or just create files in subsequent tasks)
- Modify: `.gitignore` (already exists — append node_modules and tmp)

**Steps:**

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "defrag",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test 'tests/**/*.test.js'",
    "dev": "python3 -m http.server 8080"
  }
}
```

- [ ] **Step 2: Append to `.gitignore`**

```
node_modules/
.DS_Store
*.log
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Defragmenting Drive C</title>
  <link rel="stylesheet" href="styles/layout.css">
  <link rel="stylesheet" href="styles/chrome.css">
  <link rel="stylesheet" href="styles/grid.css">
  <link rel="stylesheet" href="styles/sprites.css">
</head>
<body>
  <div id="stage"></div>
  <script type="module" src="src/boot.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create stub `src/boot.js`**

```js
// Bootstraps the game. Filled in by Task 13.
console.log('defrag: boot stub loaded');
```

- [ ] **Step 5: Create `README.md`**

```markdown
# defrag

Browser platformer themed as the Win98 Disk Defragmenter.

## Develop

Serve over HTTP so ES module imports work:

    npm run dev

Then open http://localhost:8080.

## Test

    npm test
```

- [ ] **Step 6: Verify the empty test command passes**

Run: `npm test`
Expected: exits 0, reports 0 tests run (no tests directory yet — that's fine; node --test finds nothing matching the glob).

If it errors on the missing glob, create `tests/.gitkeep` first:

```
mkdir -p tests && touch tests/.gitkeep
```

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore index.html src/boot.js README.md tests/
git commit -m "Scaffold project: package.json, index.html, boot stub"
```

---

## Task 2: Window chrome shell

**Goal:** Open `index.html` and see a pixel-accurate Win98 defrag window — title bar, menu bar, display frame (empty), status row with progress bar and four buttons. No game logic.

**Files:**
- Create: `styles/layout.css`
- Create: `styles/chrome.css`
- Modify: `index.html` (add the chrome markup inside `#stage`)

**Steps:**

- [ ] **Step 1: Create `styles/layout.css`**

```css
html, body {
  margin: 0;
  padding: 0;
  background: #008080;
  font-family: 'MS Sans Serif', 'Tahoma', 'Geneva', sans-serif;
  font-size: 11px;
  color: #000;
  height: 100%;
}
#stage {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
```

- [ ] **Step 2: Create `styles/chrome.css`**

```css
.win {
  background: #c0c0c0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080;
  width: 720px;
  user-select: none;
}
.win__titlebar {
  background: linear-gradient(90deg, #000080 0%, #1084d0 100%);
  color: #fff;
  padding: 2px 3px 3px 3px;
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 11px;
}
.win__icon {
  width: 16px; height: 16px;
  background: linear-gradient(#fff 0 25%, #c0c0c0 25% 75%, #808080 75%);
  border: 1px solid #000;
  margin-right: 4px;
}
.win__title { flex: 1; padding-left: 2px; }
.win__btn {
  width: 16px; height: 14px;
  background: #c0c0c0;
  border: 1px solid;
  border-color: #fff #000 #000 #fff;
  box-shadow: inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080;
  margin-left: 2px;
  font-size: 9px;
  line-height: 11px;
  text-align: center;
  color: #000;
  font-weight: bold;
}
.win__menubar {
  padding: 2px 4px;
  border-bottom: 1px solid #808080;
  box-shadow: 0 1px 0 #fff;
}
.win__menubar span { padding: 1px 6px; }
.win__menubar u { text-decoration: underline; }
.win__body { padding: 6px; }
.display-frame {
  background: #fff;
  border: 2px solid;
  border-color: #808080 #fff #fff #808080;
  padding: 4px;
  overflow: hidden;
}
.statusrow {
  display: grid;
  grid-template-columns: 1fr auto auto;
  grid-template-rows: auto auto auto;
  gap: 4px 8px;
  margin-top: 8px;
  align-items: center;
}
.statusrow__text { grid-column: 1; grid-row: 1; font-size: 11px; }
.statusrow__progress {
  grid-column: 1; grid-row: 2;
  height: 14px;
  background: #fff;
  border: 2px solid;
  border-color: #808080 #fff #fff #808080;
  padding: 1px;
  overflow: hidden;
}
.statusrow__progress > div {
  height: 100%; width: 0%;
  background: repeating-linear-gradient(90deg, #000080 0 8px, #fff 8px 9px);
  transition: width 0.1s linear;
}
.statusrow__pct { grid-column: 1; grid-row: 3; font-size: 11px; }
.statusrow__btns {
  grid-column: 2 / 4; grid-row: 1 / 4;
  display: grid;
  grid-template-columns: auto auto;
  gap: 4px;
  align-self: start;
}
.btn {
  background: #c0c0c0;
  border: 2px solid;
  border-color: #fff #000 #000 #fff;
  box-shadow: inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080;
  padding: 3px 14px;
  font-family: inherit;
  font-size: 11px;
  min-width: 64px;
}
.btn u { text-decoration: underline; }
```

- [ ] **Step 3: Modify `index.html` body**

Replace the `<body>` content with:

```html
<body>
  <div id="stage">
    <div class="win">
      <div class="win__titlebar">
        <div class="win__icon"></div>
        <div class="win__title" id="title">Defragmenting Drive C</div>
        <div class="win__btn">_</div>
        <div class="win__btn">▢</div>
        <div class="win__btn">×</div>
      </div>
      <div class="win__menubar">
        <span><u>F</u>ile</span>
        <span><u>V</u>iew</span>
        <span><u>H</u>elp</span>
      </div>
      <div class="win__body">
        <div class="display-frame" id="display"></div>
        <div class="statusrow">
          <div class="statusrow__text" id="status-text">Ready</div>
          <div class="statusrow__progress"><div id="progress-bar"></div></div>
          <div class="statusrow__pct" id="status-pct">0% Complete</div>
          <div class="statusrow__btns">
            <button class="btn"><u>S</u>top</button>
            <button class="btn"><u>P</u>ause</button>
            <button class="btn"><u>L</u>egend</button>
            <button class="btn">Hide <u>D</u>etails</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script type="module" src="src/boot.js"></script>
</body>
```

- [ ] **Step 4: Manual verify**

Run: `npm run dev` and open http://localhost:8080.
Expected: a Win98-styled defrag window appears centered on a teal background. Empty white display frame. Progress at 0%. Buttons render.

- [ ] **Step 5: Commit**

```bash
git add styles/layout.css styles/chrome.css index.html
git commit -m "Window chrome: title bar, menu, display frame, status row"
```

---

## Task 3: Cell type stylesheet

**Goal:** Define CSS classes for every cluster type. Free-space cells render as `<div>` with no background or border (so the white grid background shows through). Insert a quick demo grid in the display frame to visually verify all cell types.

**Files:**
- Create: `styles/grid.css`
- Modify: `index.html` temporarily for visual check (revert at end of task)

**Steps:**

- [ ] **Step 1: Create `styles/grid.css`**

```css
.grid {
  display: grid;
  grid-auto-rows: 14px;
  gap: 1px;
  background: #fff;
  width: max-content;
}
.cell {
  width: 10px;
  height: 14px;
  box-sizing: border-box;
  border: 1px solid;
  image-rendering: pixelated;
}

/* FREE: no border, no background — pure white grid bg shows through. */
.cell--free {
  border: none;
  background: transparent;
}

/* Unoptimized data — three pattern variants */
.cell--cyan-solid {
  background: #00b0b0;
  border-color: #006666;
}
.cell--cyan-diag {
  background: repeating-linear-gradient(-45deg, #00d8d8 0 2px, #006666 2px 3px);
  border-color: #004444;
}
.cell--cyan-dots {
  background:
    radial-gradient(#004444 0.6px, transparent 0.7px) 0 0 / 3px 3px,
    #00b0b0;
  border-color: #004444;
}

/* Optimized data: solid blue */
.cell--opt {
  background: #0000a8;
  border-color: #000044;
}

/* Won't move (system): dark cross-hatch */
.cell--sys {
  background: repeating-linear-gradient(-45deg, #404040 0 2px, #606060 2px 3px);
  border-color: #000;
}

/* Bad sector */
.cell--bad {
  background: #d80000;
  border-color: #800000;
}

/* Reading tell — green flashing */
.cell--read {
  background: #00c000;
  border-color: #006600;
  animation: blinkR 0.55s steps(2) infinite;
}
@keyframes blinkR { 50% { background: #88ff88; } }

/* Writing tell — red flashing */
.cell--write {
  background: #ff4040;
  border-color: #800000;
  animation: blinkW 0.55s steps(2) infinite;
}
@keyframes blinkW { 50% { background: #ffaaaa; } }

/* Defrag cursor (per-row jagged) */
.cell--cursor {
  background: #00ff00;
  border-color: #008800;
  box-shadow: 0 0 4px 1px #00ff00, inset 0 0 0 1px #ccffcc;
  animation: cursorPulse 0.4s steps(2) infinite;
}
@keyframes cursorPulse {
  50% { background: #88ff88; box-shadow: 0 0 6px 2px #88ff88; }
}

/* Goal */
.cell--goal {
  background: repeating-linear-gradient(45deg, #ff00ff 0 2px, #800080 2px 3px);
  border-color: #400040;
  animation: pulseGoal 1.2s ease-in-out infinite;
}
@keyframes pulseGoal { 50% { box-shadow: 0 0 4px 1px #ff00ff; } }

/* Checkpoint */
.cell--checkpoint {
  background:
    radial-gradient(#fff 0.8px, transparent 1px) 0 0 / 3px 3px,
    #008000;
  border-color: #004000;
}

/* Fragile */
.cell--fragile {
  background: repeating-linear-gradient(90deg, #c0a000 0 2px, #604000 2px 3px);
  border-color: #402000;
}
```

- [ ] **Step 2: Temporarily add a demo grid for visual check**

In `index.html`, replace `<div class="display-frame" id="display"></div>` with:

```html
<div class="display-frame" id="display">
  <div class="grid" style="grid-template-columns: repeat(20, 10px)">
    <div class="cell cell--cyan-solid"></div>
    <div class="cell cell--cyan-diag"></div>
    <div class="cell cell--cyan-dots"></div>
    <div class="cell cell--opt"></div>
    <div class="cell cell--free"></div>
    <div class="cell cell--sys"></div>
    <div class="cell cell--bad"></div>
    <div class="cell cell--read"></div>
    <div class="cell cell--write"></div>
    <div class="cell cell--cursor"></div>
    <div class="cell cell--goal"></div>
    <div class="cell cell--checkpoint"></div>
    <div class="cell cell--fragile"></div>
  </div>
</div>
```

- [ ] **Step 3: Manual verify**

Open http://localhost:8080. All cell types render. Free cell is invisible (just a gap). Read/write/cursor/goal cells animate.

- [ ] **Step 4: Revert the demo grid**

Restore `<div class="display-frame" id="display"></div>` in `index.html`.

- [ ] **Step 5: Commit**

```bash
git add styles/grid.css index.html
git commit -m "Cell type stylesheet: all cluster types, free is borderless"
```

---

## Task 4: Util — math + deterministic noise

**Goal:** Pure-function helpers needed by physics, collision, and cursor. Tested with `node:test`.

**Files:**
- Create: `src/util/math.js`
- Create: `src/util/noise.js`
- Test: `tests/util/math.test.js`
- Test: `tests/util/noise.test.js`

**Steps:**

- [ ] **Step 1: Write the failing test for `math.js`**

Create `tests/util/math.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, lerp, sign } from '../../src/util/math.js';

test('clamp clips below min', () => {
  assert.equal(clamp(-1, 0, 10), 0);
});

test('clamp clips above max', () => {
  assert.equal(clamp(11, 0, 10), 10);
});

test('clamp passes through in-range', () => {
  assert.equal(clamp(5, 0, 10), 5);
});

test('lerp interpolates', () => {
  assert.equal(lerp(0, 10, 0.25), 2.5);
});

test('sign returns -1, 0, or 1', () => {
  assert.equal(sign(-3), -1);
  assert.equal(sign(0),  0);
  assert.equal(sign(7),  1);
});
```

- [ ] **Step 2: Run, expect failure**

Run: `npm test`
Expected: failures saying `Cannot find module ... math.js`.

- [ ] **Step 3: Implement `src/util/math.js`**

```js
export const clamp = (x, lo, hi) => x < lo ? lo : x > hi ? hi : x;
export const lerp  = (a, b, t)   => a + (b - a) * t;
export const sign  = (x)         => x < 0 ? -1 : x > 0 ? 1 : 0;
```

- [ ] **Step 4: Run, expect pass**

Run: `npm test`
Expected: 5/5 pass.

- [ ] **Step 5: Write failing tests for `noise.js`**

Create `tests/util/noise.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rowOffset, makeRowPhases } from '../../src/util/noise.js';

test('rowOffset is deterministic for given (row, t, phases)', () => {
  const phases = makeRowPhases(/* seed */ 42, /* numRows */ 16, /* numComponents */ 3);
  const a = rowOffset(5, 1.234, phases);
  const b = rowOffset(5, 1.234, phases);
  assert.equal(a, b);
});

test('rowOffset varies between rows', () => {
  const phases = makeRowPhases(42, 16, 3);
  const r0 = rowOffset(0, 1.0, phases);
  const r5 = rowOffset(5, 1.0, phases);
  // Astronomically unlikely they exactly match; if they do, the seed is broken.
  assert.notEqual(r0, r5);
});

test('rowOffset stays within sum of amplitudes', () => {
  const phases = makeRowPhases(42, 16, 3);
  // Default amplitudes inside noise.js: [1.5, 0.8, 0.4] — sum = 2.7
  const max = 1.5 + 0.8 + 0.4;
  for (let row = 0; row < 16; row++) {
    for (let t = 0; t < 30; t += 0.1) {
      const v = rowOffset(row, t, phases);
      assert.ok(Math.abs(v) <= max + 1e-9, `row=${row} t=${t} v=${v}`);
    }
  }
});

test('makeRowPhases with same seed produces same phases', () => {
  const a = makeRowPhases(7, 4, 3);
  const b = makeRowPhases(7, 4, 3);
  assert.deepEqual(a, b);
});
```

- [ ] **Step 6: Run, expect failure**

Run: `npm test`
Expected: failures saying `Cannot find module ... noise.js`.

- [ ] **Step 7: Implement `src/util/noise.js`**

```js
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
```

- [ ] **Step 8: Run, expect pass**

Run: `npm test`
Expected: 9/9 pass total.

- [ ] **Step 9: Commit**

```bash
git add src/util/ tests/util/
git commit -m "Util: math helpers + deterministic per-row noise"
```

---

## Task 5: Tile types + level loader + Level 1 data

**Goal:** Define tile constants and queries (isSolid, isLethal). Parse an ASCII grid into a 2D tile array, extract player start, enemies, events. Author Level 1.

**Files:**
- Create: `src/world/tile.js`
- Create: `src/world/level-loader.js`
- Create: `levels/level1.js`
- Create: `levels/index.js`
- Test: `tests/world/tile.test.js`
- Test: `tests/world/level-loader.test.js`

**Steps:**

- [ ] **Step 1: Write failing tests for `tile.js`**

Create `tests/world/tile.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TILE, isSolid, isLethal, fromChar, cellClassFor } from '../../src/world/tile.js';

test('TILE constants are defined', () => {
  assert.ok(TILE.FREE !== undefined);
  assert.ok(TILE.CYAN_SOLID !== undefined);
  assert.ok(TILE.SYS !== undefined);
  assert.ok(TILE.BAD !== undefined);
  assert.ok(TILE.GOAL !== undefined);
});

test('isSolid: solid blocks return true', () => {
  for (const t of [TILE.CYAN_SOLID, TILE.CYAN_DIAG, TILE.CYAN_DOTS, TILE.OPT, TILE.SYS, TILE.FRAGILE]) {
    assert.ok(isSolid(t), `expected solid: ${t}`);
  }
});

test('isSolid: free / read / write / goal / checkpoint / bad return false-or-special', () => {
  assert.equal(isSolid(TILE.FREE), false);
  // Bad sector is solid (you collide with it) — but lethal.
  assert.equal(isSolid(TILE.BAD), true);
  // Goal is solid only in the sense the player touches it; we treat as non-solid for collision so player walks INTO it.
  assert.equal(isSolid(TILE.GOAL), false);
  assert.equal(isSolid(TILE.CHECKPOINT), false);
});

test('isLethal: bad sector', () => {
  assert.equal(isLethal(TILE.BAD), true);
  assert.equal(isLethal(TILE.CYAN_SOLID), false);
});

test('fromChar parses ASCII chars', () => {
  assert.equal(fromChar('.'), TILE.FREE);
  assert.equal(fromChar('~'), TILE.CYAN_SOLID);
  assert.equal(fromChar(':'), TILE.CYAN_DIAG);
  assert.equal(fromChar("'"), TILE.CYAN_DOTS);
  assert.equal(fromChar('Y'), TILE.SYS);
  assert.equal(fromChar('B'), TILE.BAD);
  assert.equal(fromChar('G'), TILE.GOAL);
  assert.equal(fromChar('C'), TILE.CHECKPOINT);
  assert.equal(fromChar('F'), TILE.FRAGILE);
  assert.equal(fromChar('O'), TILE.OPT);
});

test('cellClassFor returns the CSS class', () => {
  assert.equal(cellClassFor(TILE.FREE), 'cell--free');
  assert.equal(cellClassFor(TILE.CYAN_SOLID), 'cell--cyan-solid');
  assert.equal(cellClassFor(TILE.BAD), 'cell--bad');
  assert.equal(cellClassFor(TILE.GOAL), 'cell--goal');
});
```

- [ ] **Step 2: Run, expect failure**

Run: `npm test`. Expected: tile tests fail (module missing).

- [ ] **Step 3: Implement `src/world/tile.js`**

```js
export const TILE = Object.freeze({
  FREE: 0,
  CYAN_SOLID: 1,
  CYAN_DIAG: 2,
  CYAN_DOTS: 3,
  OPT: 4,
  SYS: 5,
  BAD: 6,
  CHECKPOINT: 7,
  FRAGILE: 8,
  GOAL: 9,
});

const SOLID = new Set([
  TILE.CYAN_SOLID, TILE.CYAN_DIAG, TILE.CYAN_DOTS,
  TILE.OPT, TILE.SYS, TILE.FRAGILE, TILE.BAD,
]);

const LETHAL = new Set([TILE.BAD]);

export const isSolid  = (t) => SOLID.has(t);
export const isLethal = (t) => LETHAL.has(t);

const CHAR_TO_TILE = {
  '.': TILE.FREE,
  '~': TILE.CYAN_SOLID,
  ':': TILE.CYAN_DIAG,
  "'": TILE.CYAN_DOTS,
  'O': TILE.OPT,
  'Y': TILE.SYS,
  'B': TILE.BAD,
  'C': TILE.CHECKPOINT,
  'F': TILE.FRAGILE,
  'G': TILE.GOAL,
};

export const fromChar = (ch) => {
  const t = CHAR_TO_TILE[ch];
  if (t === undefined) return TILE.FREE; // any unknown char -> free
  return t;
};

const TILE_TO_CLASS = {
  [TILE.FREE]: 'cell--free',
  [TILE.CYAN_SOLID]: 'cell--cyan-solid',
  [TILE.CYAN_DIAG]: 'cell--cyan-diag',
  [TILE.CYAN_DOTS]: 'cell--cyan-dots',
  [TILE.OPT]: 'cell--opt',
  [TILE.SYS]: 'cell--sys',
  [TILE.BAD]: 'cell--bad',
  [TILE.CHECKPOINT]: 'cell--checkpoint',
  [TILE.FRAGILE]: 'cell--fragile',
  [TILE.GOAL]: 'cell--goal',
};

export const cellClassFor = (t) => TILE_TO_CLASS[t] || 'cell--free';
```

- [ ] **Step 4: Run, expect pass**

Run: `npm test`. Tile tests pass.

- [ ] **Step 5: Write failing tests for `level-loader.js`**

Create `tests/world/level-loader.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLevel } from '../../src/world/level-loader.js';
import { TILE } from '../../src/world/tile.js';

const sampleLevel = {
  id: 99,
  name: 'Sample',
  cursorSpeed: 2.0,
  width: 5,
  height: 3,
  grid: [
    '.....',
    '..P..',
    '~~B~G',
  ],
  enemies: [],
  events: [],
};

test('loadLevel returns a 2D tile array', () => {
  const lvl = loadLevel(sampleLevel);
  assert.equal(lvl.tiles.length, 3);
  assert.equal(lvl.tiles[0].length, 5);
});

test('loadLevel parses tile types correctly', () => {
  const lvl = loadLevel(sampleLevel);
  assert.equal(lvl.tiles[0][0], TILE.FREE);
  assert.equal(lvl.tiles[2][0], TILE.CYAN_SOLID);
  assert.equal(lvl.tiles[2][2], TILE.BAD);
  assert.equal(lvl.tiles[2][4], TILE.GOAL);
});

test('loadLevel extracts player start from P and replaces with FREE', () => {
  const lvl = loadLevel(sampleLevel);
  assert.deepEqual(lvl.playerStart, { row: 1, col: 2 });
  assert.equal(lvl.tiles[1][2], TILE.FREE);
});

test('loadLevel preserves cursorSpeed, width, height, name, id', () => {
  const lvl = loadLevel(sampleLevel);
  assert.equal(lvl.id, 99);
  assert.equal(lvl.name, 'Sample');
  assert.equal(lvl.cursorSpeed, 2.0);
  assert.equal(lvl.width, 5);
  assert.equal(lvl.height, 3);
});

test('loadLevel passes through enemies and events arrays', () => {
  const lvl = loadLevel({ ...sampleLevel, enemies: [{ type: 'virus' }], events: [{ time: 1 }] });
  assert.equal(lvl.enemies.length, 1);
  assert.equal(lvl.enemies[0].type, 'virus');
  assert.equal(lvl.events.length, 1);
});

test('loadLevel throws if no P found', () => {
  const bad = { ...sampleLevel, grid: ['.....', '.....', '~~~~~'] };
  assert.throws(() => loadLevel(bad), /no player start/i);
});
```

- [ ] **Step 6: Run, expect failure**

Run: `npm test`. level-loader tests fail (module missing).

- [ ] **Step 7: Implement `src/world/level-loader.js`**

```js
import { TILE, fromChar } from './tile.js';

export function loadLevel(raw) {
  const { id, name, cursorSpeed, width, height, grid, enemies = [], events = [] } = raw;
  if (grid.length !== height) {
    throw new Error(`Level ${id}: grid has ${grid.length} rows but height=${height}`);
  }
  const tiles = grid.map(row => {
    if (row.length !== width) {
      throw new Error(`Level ${id}: row width ${row.length} != ${width}`);
    }
    return [...row].map(fromChar);
  });

  let playerStart = null;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] === 'P') {
        playerStart = { row: r, col: c };
        tiles[r][c] = TILE.FREE; // player isn't a tile
      }
    }
  }
  if (!playerStart) throw new Error(`Level ${id}: no player start (P) found`);

  return { id, name, cursorSpeed, width, height, tiles, playerStart, enemies, events };
}
```

- [ ] **Step 8: Run, expect pass**

Run: `npm test`. Level loader tests pass.

- [ ] **Step 9: Author `levels/level1.js`**

Every grid row is exactly 60 characters. Goal tower at cols 57–59 spans
rows 4–7 (G markers, non-solid → win on touch) above rows 8–15 (Y, solid
base for the player to reach the top).

```js
// Level 1 — "Cluster 0". 60 cols x 16 rows. SML 1-1 inspired beats.
export default {
  id: 1,
  name: 'Cluster 0',
  cursorSpeed: 3.5,                       // cells/sec base advance
  width: 60,
  height: 16,
  grid: [
    // 0         1         2         3         4         5
    // 0123456789012345678901234567890123456789012345678901234567890
    '............................................................', // 0
    '............................................................', // 1
    '............................................................', // 2
    '............................................................', // 3
    '.........................................................GGG', // 4  goal markers (top of tower)
    '.........................................................GGG', // 5
    '.........................................................GGG', // 6
    '.........................................................GGG', // 7
    '.........................................................YYY', // 8  goal-tower base begins
    '..............::....................YYYYY................YYY', // 9  floating cyan-diag + high-yellow alt route
    '.........................FFFF............................YYY', // 10 fragile floating platform
    '........YYY.....................Y........................YYY', // 11 low yellow platform + stepping pillar
    '..P...................C.........Y....................YY..YYY', // 12 player start, checkpoint, pillar top, small bumps
    '~~~~~~B~~~~:~~:~~...~~~~:~~:~~.....~~~~:~~:~~~B~.w.~~~~~~YYY', // 13 surface: bad sectors + write tell
    '~~~~~~~~~~~~~~~~~...~~~~~~~~~~.....~~~~~~~~~~~~~...~~~~~~YYY', // 14 mid floor
    '~~~~~~~~~~~~~~~~~...~~~~~~~~~~.....~~~~~~~~~~~~~...~~~~~~YYY', // 15 bottom floor
  ],
  enemies: [
    { type: 'virus', cell: { row: 12, col: 6 },  patrol: { from: 4,  to: 11 } },
    { type: 'virus', cell: { row: 12, col: 21 }, patrol: { from: 20, to: 25 } },
  ],
  // Read/write tell schedule deferred to post-MVP; the static `r` and `w`
  // chars in the grid render as decorative animations (still solid/free for
  // collision purposes).
  events: [],
};
```

**Width sanity check:** before moving on, paste this into a node REPL or
add a temporary log and confirm every row is 60 chars:

```bash
node -e "import('./levels/level1.js').then(m => m.default.grid.forEach((r, i) => console.log(i, r.length, r.length === 60 ? 'ok' : 'BAD')))"
```

Expected: every row prints `60 ok`. Fix any row that prints `BAD` before
proceeding.

- [ ] **Step 10: Author `levels/index.js`**

```js
import level1 from './level1.js';
export const levels = [level1];
```

- [ ] **Step 11: Add a smoke test for level 1 loadability**

Append to `tests/world/level-loader.test.js`:

```js
import level1 from '../../levels/level1.js';

test('Level 1 loads without error and has a player start', () => {
  const lvl = loadLevel(level1);
  assert.equal(lvl.id, 1);
  assert.equal(lvl.width, 60);
  assert.equal(lvl.height, 16);
  assert.ok(lvl.playerStart);
  assert.equal(lvl.tiles.length, 16);
  assert.equal(lvl.tiles[0].length, 60);
});
```

- [ ] **Step 12: Run, expect pass**

Run: `npm test`. All world tests pass including the Level 1 smoke test.

- [ ] **Step 13: Commit**

```bash
git add src/world/tile.js src/world/level-loader.js levels/ tests/world/
git commit -m "Tile types + level loader + Level 1 data"
```

---

## Task 6: DOM grid renderer + camera

**Goal:** A `Renderer` that, given a level and a camera offset, paints a window of cells into the display frame using a recycled cell pool. Manual visual verify by hard-coding a render call from boot.js.

**Files:**
- Create: `src/render/camera.js`
- Create: `src/render/grid.js`
- Modify: `src/boot.js` (temporarily, to call render once)

**Steps:**

- [ ] **Step 1: Write `src/render/camera.js`**

```js
// Camera tracks max(player.x, mean(cursor.x[]) + offset).
// Returns the leftmost visible column (in cells, fractional).

export function createCamera({ viewportCols }) {
  return { x: 0, viewportCols };
}

// Update the camera given the player x (in cells) and the cursor mean x (in cells).
// Keeps the player roughly 1/3 from the left edge, but pulls forward if the cursor approaches.
export function updateCamera(camera, playerCol, cursorMeanCol) {
  const targetByPlayer = playerCol - camera.viewportCols / 3;
  const targetByCursor = cursorMeanCol - 2; // keep cursor visible at left edge
  const target = Math.max(targetByPlayer, targetByCursor, 0);
  camera.x = target;
  return camera;
}
```

(No tests needed for this trivial pure logic; integration-tested by manual play.)

- [ ] **Step 2: Write `src/render/grid.js`**

```js
import { cellClassFor } from '../world/tile.js';

// Creates a fixed pool of cells sized to viewport. Repaints by setting className.
export function createGridRenderer({ container, viewportCols, viewportRows, cellWidth = 10, cellHeight = 14 }) {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.style.gridTemplateColumns = `repeat(${viewportCols}, ${cellWidth}px)`;
  grid.style.gridAutoRows = `${cellHeight}px`;
  grid.style.gap = '1px';
  grid.style.background = '#fff';
  grid.style.width = 'max-content';

  const cells = [];
  for (let i = 0; i < viewportRows * viewportCols; i++) {
    const d = document.createElement('div');
    d.className = 'cell cell--free';
    grid.appendChild(d);
    cells.push(d);
  }
  container.appendChild(grid);

  return {
    cells,
    viewportCols,
    viewportRows,
    cellWidth,
    cellHeight,
    grid,
  };
}

// Paints the visible window of the level given the camera offset.
// camera.x is the leftmost visible column (fractional). We snap to integer for cell-level rendering.
export function paintGrid(renderer, level, camera) {
  const { cells, viewportCols, viewportRows } = renderer;
  const xOffset = Math.floor(camera.x);
  for (let r = 0; r < viewportRows; r++) {
    for (let c = 0; c < viewportCols; c++) {
      const worldCol = xOffset + c;
      let tileClass = 'cell--free';
      if (r >= 0 && r < level.height && worldCol >= 0 && worldCol < level.width) {
        tileClass = cellClassFor(level.tiles[r][worldCol]);
      }
      cells[r * viewportCols + c].className = `cell ${tileClass}`;
    }
  }
  // Apply pixel-smooth horizontal offset for the fractional remainder
  const subPx = (camera.x - xOffset) * (renderer.cellWidth + 1);
  renderer.grid.style.transform = `translateX(${-subPx}px)`;
}
```

- [ ] **Step 3: Temporarily wire boot.js to render Level 1 statically**

Replace `src/boot.js`:

```js
import { loadLevel } from './world/level-loader.js';
import { createCamera } from './render/camera.js';
import { createGridRenderer, paintGrid } from './render/grid.js';
import level1 from '../levels/level1.js';

const level = loadLevel(level1);
const display = document.getElementById('display');
const renderer = createGridRenderer({
  container: display,
  viewportCols: 50,
  viewportRows: level.height,
});
const camera = createCamera({ viewportCols: 50 });
paintGrid(renderer, level, camera);
```

- [ ] **Step 4: Manual verify**

Run: `npm run dev`. Open the page. Expected: Level 1's leftmost 50 columns render. You should see cyan ground, a bad sector at col 6 (B), a yellow platform around cols 8–10, etc. Free cells are invisible (just gaps).

Tweak `cellWidth`/`cellHeight` in CSS if the proportions look wrong vs. real Win98 defrag.

- [ ] **Step 5: Commit**

```bash
git add src/render/camera.js src/render/grid.js src/boot.js
git commit -m "DOM grid renderer with cell pool + camera"
```

---

## Task 7: Input layer

**Goal:** Capture key presses for move-left, move-right, jump, drop. preventDefault on all game-bound keys. Maintain pressed-state and provide jump-buffer + coyote-time helpers (pure logic).

**Files:**
- Create: `src/input/keymap.js`
- Create: `src/input/keystate.js`
- Create: `src/input/buffer.js`
- Test: `tests/input/buffer.test.js`

**Steps:**

- [ ] **Step 1: Write `src/input/keymap.js`**

```js
// Map browser KeyboardEvent.code → game action.
export const KEY_TO_ACTION = {
  ArrowLeft: 'left',  KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump',    KeyW: 'jump',  Space: 'jump',
  ArrowDown: 'drop',  KeyS: 'drop',
};

export const GAME_KEYS = new Set(Object.keys(KEY_TO_ACTION));
```

- [ ] **Step 2: Write `src/input/keystate.js`**

```js
import { KEY_TO_ACTION, GAME_KEYS } from './keymap.js';

// Mutable state: current pressed actions + edges since last poll.
export function createKeyState() {
  return {
    pressed: new Set(),     // actions currently held
    pressedEdge: new Set(), // actions whose key went down this frame (consumed by poll)
  };
}

export function attachKeyState(keystate, target = window) {
  target.addEventListener('keydown', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    const action = KEY_TO_ACTION[e.code];
    if (!action) return;
    if (!keystate.pressed.has(action)) keystate.pressedEdge.add(action);
    keystate.pressed.add(action);
  });
  target.addEventListener('keyup', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    const action = KEY_TO_ACTION[e.code];
    if (!action) return;
    keystate.pressed.delete(action);
  });
}

// Call once per game tick. Returns the set of edges since last poll, then clears it.
export function consumeEdges(keystate) {
  const edges = new Set(keystate.pressedEdge);
  keystate.pressedEdge.clear();
  return edges;
}
```

- [ ] **Step 3: Write failing tests for `buffer.js`**

Create `tests/input/buffer.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJumpBuffer, recordJumpPress, tickBuffer, recordLeftGround, canJump } from '../../src/input/buffer.js';

test('canJump returns true when on ground and jump pressed this frame', () => {
  const buf = createJumpBuffer();
  recordJumpPress(buf, 1.0);
  assert.equal(canJump(buf, 1.0, /* onGround */ true), true);
});

test('jump buffer remembers a press for ~80ms before landing', () => {
  const buf = createJumpBuffer();
  recordJumpPress(buf, 1.0); // pressed at t=1.0 mid-air
  // not on ground yet
  assert.equal(canJump(buf, 1.0, false), false);
  // landed at t=1.06 — buffer should still hold (within 80ms window)
  assert.equal(canJump(buf, 1.06, true), true);
});

test('jump buffer expires after window', () => {
  const buf = createJumpBuffer();
  recordJumpPress(buf, 1.0);
  // landed at t=1.2 — outside 80ms window
  assert.equal(canJump(buf, 1.2, true), false);
});

test('coyote time allows jump shortly after leaving ground', () => {
  const buf = createJumpBuffer();
  recordLeftGround(buf, 1.0);
  recordJumpPress(buf, 1.05); // pressed 50ms after walking off
  assert.equal(canJump(buf, 1.05, /* onGround */ false), true);
});

test('coyote time expires', () => {
  const buf = createJumpBuffer();
  recordLeftGround(buf, 1.0);
  recordJumpPress(buf, 1.2); // 200ms after leaving — too late
  assert.equal(canJump(buf, 1.2, false), false);
});

test('tickBuffer prunes stale entries', () => {
  const buf = createJumpBuffer();
  recordJumpPress(buf, 1.0);
  recordLeftGround(buf, 1.0);
  tickBuffer(buf, 5.0);
  assert.equal(buf.lastJumpPressedAt, null);
  assert.equal(buf.lastLeftGroundAt, null);
});
```

- [ ] **Step 4: Run, expect failure**

Run: `npm test`. buffer.test.js fails (module missing).

- [ ] **Step 5: Implement `src/input/buffer.js`**

```js
const JUMP_BUFFER_SEC  = 0.08; // 80ms
const COYOTE_TIME_SEC  = 0.08; // 80ms

export function createJumpBuffer() {
  return {
    lastJumpPressedAt: null,
    lastLeftGroundAt: null,
  };
}

export function recordJumpPress(buf, t) {
  buf.lastJumpPressedAt = t;
}

export function recordLeftGround(buf, t) {
  buf.lastLeftGroundAt = t;
}

export function tickBuffer(buf, t) {
  if (buf.lastJumpPressedAt !== null && t - buf.lastJumpPressedAt > JUMP_BUFFER_SEC) {
    buf.lastJumpPressedAt = null;
  }
  if (buf.lastLeftGroundAt !== null && t - buf.lastLeftGroundAt > COYOTE_TIME_SEC) {
    buf.lastLeftGroundAt = null;
  }
}

export function canJump(buf, t, onGround) {
  const recentPress = buf.lastJumpPressedAt !== null && (t - buf.lastJumpPressedAt) <= JUMP_BUFFER_SEC;
  if (!recentPress) return false;
  if (onGround) return true;
  const inCoyote = buf.lastLeftGroundAt !== null && (t - buf.lastLeftGroundAt) <= COYOTE_TIME_SEC;
  return inCoyote;
}

// Consume the buffer after a successful jump.
export function clearJump(buf) {
  buf.lastJumpPressedAt = null;
  buf.lastLeftGroundAt = null;
}
```

- [ ] **Step 6: Run, expect pass**

Run: `npm test`. Buffer tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/input/ tests/input/
git commit -m "Input: keymap, keystate, jump buffer + coyote logic"
```

---

## Task 8: Player physics + jump

**Goal:** Player has position, velocity, on_ground state. Per tick, apply gravity, integrate velocity, write back to position. Jump sets vertical velocity to a negative value; releasing jump early caps the upward velocity (variable-height).

**Files:**
- Create: `src/config.js`
- Create: `src/player/state.js`
- Create: `src/player/physics.js`
- Create: `src/player/jump.js`
- Test: `tests/player/physics.test.js`
- Test: `tests/player/jump.test.js`

**Steps:**

- [ ] **Step 1: Create `src/config.js`**

```js
// All gameplay-tunable constants live here. Values in cells/sec or cells/sec^2.
export const CONFIG = {
  // Cell dimensions (must match CSS)
  CELL_W: 10,
  CELL_H: 14,
  CELL_GAP: 1,

  // Player movement
  MOVE_SPEED:        8,       // horizontal target velocity (cells/sec)
  MOVE_ACCEL_GROUND: 50,      // accel toward target on ground
  MOVE_ACCEL_AIR:    25,      // reduced air control
  GRAVITY:           60,      // cells/sec^2

  // Jump
  JUMP_VELOCITY:     -22,     // initial upward velocity
  JUMP_CUT_VELOCITY: -8,      // upward velocity cap when jump released

  // Cursor
  CURSOR_SEED_BASE:  100,     // per-level seed = base + level.id
  CURSOR_NUM_ROWS_DEFAULT: 16,

  // Viewport
  VIEWPORT_COLS: 50,
};
```

- [ ] **Step 2: Create `src/player/state.js`**

```js
import { CONFIG } from '../config.js';

export function createPlayer(start) {
  return {
    // Position in cells (fractional). Center of the player's 1-cell box.
    x: start.col + 0.5,
    y: start.row + 0.5,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    state: 'falling', // 'running' | 'jumping' | 'falling' | 'dying'
    jumping: false,
    width: 1,   // in cells
    height: 1,  // in cells
  };
}
```

- [ ] **Step 3: Write failing tests for `physics.js`**

Create `tests/player/physics.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyGravity, integrate, applyHorizontalIntent } from '../../src/player/physics.js';
import { CONFIG } from '../../src/config.js';

function p({ vy = 0, onGround = false, vx = 0 } = {}) {
  return { x: 0, y: 0, vx, vy, onGround, jumping: false, width: 1, height: 1 };
}

test('applyGravity: vy increases by g*dt when not on ground', () => {
  const player = p({ onGround: false });
  applyGravity(player, 0.1);
  assert.equal(player.vy, CONFIG.GRAVITY * 0.1);
});

test('applyGravity: no-op when on ground', () => {
  const player = p({ onGround: true });
  applyGravity(player, 0.1);
  assert.equal(player.vy, 0);
});

test('integrate moves position by velocity * dt', () => {
  const player = p({ vx: 5, vy: 2 });
  integrate(player, 0.1);
  assert.equal(player.x, 0.5);
  assert.equal(player.y, 0.2);
});

test('applyHorizontalIntent accelerates toward target speed', () => {
  const player = p({ onGround: true });
  applyHorizontalIntent(player, +1, 0.1); // pressing right
  // After 0.1s of accel from 0: vx = MOVE_ACCEL_GROUND * 0.1 = 5 (capped to MOVE_SPEED if reached)
  assert.equal(player.vx, Math.min(CONFIG.MOVE_ACCEL_GROUND * 0.1, CONFIG.MOVE_SPEED));
});

test('applyHorizontalIntent decelerates when no input', () => {
  const player = p({ onGround: true, vx: 5 });
  applyHorizontalIntent(player, 0, 0.1);
  assert.ok(Math.abs(player.vx) < 5);
});
```

- [ ] **Step 4: Run, expect failure**

Run: `npm test`. physics tests fail.

- [ ] **Step 5: Implement `src/player/physics.js`**

```js
import { CONFIG } from '../config.js';

export function applyGravity(player, dt) {
  if (player.onGround) {
    if (player.vy > 0) player.vy = 0;
    return;
  }
  player.vy += CONFIG.GRAVITY * dt;
}

export function integrate(player, dt) {
  player.x += player.vx * dt;
  player.y += player.vy * dt;
}

// intent: -1 (left), 0 (none), +1 (right)
export function applyHorizontalIntent(player, intent, dt) {
  const accel = player.onGround ? CONFIG.MOVE_ACCEL_GROUND : CONFIG.MOVE_ACCEL_AIR;
  const target = intent * CONFIG.MOVE_SPEED;
  const delta = target - player.vx;
  const step = Math.sign(delta) * Math.min(Math.abs(delta), accel * dt);
  player.vx += step;
  if (intent !== 0) player.facing = intent;
}
```

- [ ] **Step 6: Run, expect pass**

Run: `npm test`. Physics tests pass.

- [ ] **Step 7: Write failing tests for `jump.js`**

Create `tests/player/jump.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startJump, releaseJump } from '../../src/player/jump.js';
import { CONFIG } from '../../src/config.js';

test('startJump sets vy to JUMP_VELOCITY and marks jumping', () => {
  const player = { vy: 0, onGround: true, jumping: false };
  startJump(player);
  assert.equal(player.vy, CONFIG.JUMP_VELOCITY);
  assert.equal(player.onGround, false);
  assert.equal(player.jumping, true);
});

test('releaseJump caps upward velocity (variable-height jump)', () => {
  const player = { vy: -22, jumping: true };
  releaseJump(player);
  assert.equal(player.vy, CONFIG.JUMP_CUT_VELOCITY);
  assert.equal(player.jumping, false);
});

test('releaseJump no-op if already falling', () => {
  const player = { vy: 5, jumping: true };
  releaseJump(player);
  assert.equal(player.vy, 5);
  assert.equal(player.jumping, false);
});

test('releaseJump no-op if not jumping', () => {
  const player = { vy: -22, jumping: false };
  releaseJump(player);
  assert.equal(player.vy, -22);
});
```

- [ ] **Step 8: Implement `src/player/jump.js`**

```js
import { CONFIG } from '../config.js';

export function startJump(player) {
  player.vy = CONFIG.JUMP_VELOCITY;
  player.onGround = false;
  player.jumping = true;
}

export function releaseJump(player) {
  if (!player.jumping) return;
  player.jumping = false;
  if (player.vy < CONFIG.JUMP_CUT_VELOCITY) {
    player.vy = CONFIG.JUMP_CUT_VELOCITY;
  }
}
```

- [ ] **Step 9: Run, expect pass**

Run: `npm test`. Jump tests pass.

- [ ] **Step 10: Commit**

```bash
git add src/config.js src/player/ tests/player/
git commit -m "Player physics + jump (variable-height, gravity, accel)"
```

---

## Task 9: Tile collision

**Goal:** Resolve player-tile collisions on each axis separately. After integration, push the player out of any solid tile, snap velocity in the impacted direction to zero, and update `onGround` when landing on a solid from above.

**Files:**
- Create: `src/world/collision.js`
- Test: `tests/world/collision.test.js`

**Steps:**

- [ ] **Step 1: Write failing tests**

Create `tests/world/collision.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCollisions } from '../../src/world/collision.js';
import { TILE } from '../../src/world/tile.js';

// Build a small level: 5x5, ground at row 4
function makeLevel() {
  const tiles = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      row.push(r === 4 ? TILE.CYAN_SOLID : TILE.FREE);
    }
    tiles.push(row);
  }
  // Add a wall at col 3, rows 2-3
  tiles[2][3] = TILE.SYS;
  tiles[3][3] = TILE.SYS;
  return { tiles, width: 5, height: 5 };
}

test('player falling onto floor lands and onGround=true', () => {
  const level = makeLevel();
  // Player at y=3.6, falling fast — should land on the floor (top edge of row 4 is y=4.0; player center y should snap to 3.5)
  const player = { x: 1.5, y: 3.6, vx: 0, vy: 5, onGround: false, width: 1, height: 1 };
  resolveCollisions(player, level);
  assert.equal(player.onGround, true);
  assert.equal(player.vy, 0);
  assert.equal(player.y, 3.5); // center of row 3 (just above the floor)
});

test('player walking into a wall stops horizontally', () => {
  const level = makeLevel();
  // Wall at col 3 row 2-3. Player approaching from the left at row 2.
  const player = { x: 2.6, y: 2.5, vx: 5, vy: 0, onGround: false, width: 1, height: 1 };
  resolveCollisions(player, level);
  assert.equal(player.vx, 0);
  assert.ok(player.x <= 2.5);
});

test('player jumping into a ceiling stops upward', () => {
  // Build a level with a ceiling at row 1
  const tiles = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      row.push((r === 1 || r === 4) ? TILE.CYAN_SOLID : TILE.FREE);
    }
    tiles.push(row);
  }
  const level = { tiles, width: 5, height: 5 };
  const player = { x: 2.5, y: 2.4, vx: 0, vy: -5, onGround: false, width: 1, height: 1 };
  resolveCollisions(player, level);
  assert.equal(player.vy, 0);
  assert.ok(player.y >= 2.5); // pushed below the ceiling row
});

test('falling through free space does not change y', () => {
  const tiles = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) row.push(TILE.FREE);
    tiles.push(row);
  }
  const level = { tiles, width: 5, height: 5 };
  const player = { x: 2.5, y: 2.5, vx: 0, vy: 5, onGround: false, width: 1, height: 1 };
  resolveCollisions(player, level);
  assert.equal(player.y, 2.5);
  assert.equal(player.onGround, false);
});
```

- [ ] **Step 2: Run, expect failure**

Run: `npm test`. Collision tests fail.

- [ ] **Step 3: Implement `src/world/collision.js`**

```js
import { isSolid } from './tile.js';

// Player AABB: cells centered at (x, y), width × height.
// We assume player.width = player.height = 1.
//
// resolveCollisions performs per-axis push-out against any solid cells.
// Call AFTER integration. Mutates player.x, .y, .vx, .vy, .onGround.

export function resolveCollisions(player, level) {
  // Reset onGround; we'll set true if we land on something.
  player.onGround = false;

  // Resolve Y first (so landing computes onGround), then X.
  resolveY(player, level);
  resolveX(player, level);
}

function resolveY(player, level) {
  const half = player.height / 2;
  if (player.vy > 0) {
    // Moving down — check tile at player's bottom
    const bottomY = player.y + half;
    const topRow = Math.floor(bottomY);
    if (topRow >= 0 && topRow < level.height) {
      const colL = Math.floor(player.x - half + 0.001);
      const colR = Math.floor(player.x + half - 0.001);
      for (let c = colL; c <= colR; c++) {
        if (c < 0 || c >= level.width) continue;
        if (isSolid(level.tiles[topRow][c])) {
          player.y = topRow - half;
          player.vy = 0;
          player.onGround = true;
          return;
        }
      }
    }
  } else if (player.vy < 0) {
    // Moving up — check tile at player's top
    const topY = player.y - half;
    const topRow = Math.floor(topY);
    if (topRow >= 0 && topRow < level.height) {
      const colL = Math.floor(player.x - half + 0.001);
      const colR = Math.floor(player.x + half - 0.001);
      for (let c = colL; c <= colR; c++) {
        if (c < 0 || c >= level.width) continue;
        if (isSolid(level.tiles[topRow][c])) {
          player.y = topRow + 1 + half;
          player.vy = 0;
          return;
        }
      }
    }
  } else {
    // vy == 0 — check if we're standing on something (for onGround tracking when walking)
    const bottomY = player.y + half;
    const justBelow = Math.floor(bottomY + 0.01);
    if (justBelow >= 0 && justBelow < level.height) {
      const colL = Math.floor(player.x - half + 0.001);
      const colR = Math.floor(player.x + half - 0.001);
      for (let c = colL; c <= colR; c++) {
        if (c < 0 || c >= level.width) continue;
        if (isSolid(level.tiles[justBelow][c])) {
          player.onGround = true;
          break;
        }
      }
    }
  }
}

function resolveX(player, level) {
  const half = player.width / 2;
  if (player.vx > 0) {
    const rightX = player.x + half;
    const targetCol = Math.floor(rightX);
    if (targetCol >= 0 && targetCol < level.width) {
      const rowT = Math.floor(player.y - half + 0.001);
      const rowB = Math.floor(player.y + half - 0.001);
      for (let r = rowT; r <= rowB; r++) {
        if (r < 0 || r >= level.height) continue;
        if (isSolid(level.tiles[r][targetCol])) {
          player.x = targetCol - half;
          player.vx = 0;
          return;
        }
      }
    }
  } else if (player.vx < 0) {
    const leftX = player.x - half;
    const targetCol = Math.floor(leftX);
    if (targetCol >= 0 && targetCol < level.width) {
      const rowT = Math.floor(player.y - half + 0.001);
      const rowB = Math.floor(player.y + half - 0.001);
      for (let r = rowT; r <= rowB; r++) {
        if (r < 0 || r >= level.height) continue;
        if (isSolid(level.tiles[r][targetCol])) {
          player.x = targetCol + 1 + half;
          player.vx = 0;
          return;
        }
      }
    }
  }
}
```

- [ ] **Step 4: Run, expect pass**

Run: `npm test`. Collision tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/world/collision.js tests/world/collision.test.js
git commit -m "Collision: per-axis AABB resolve against tile grid"
```

---

## Task 10: Defrag cursor (per-row jagged)

**Goal:** A cursor object holds per-row x-positions. Per tick, advance the base by `cursorSpeed * dt`, then compute each row's offset from `noise.rowOffset`. Provide a query: `cursor.atRow(row)`.

**Files:**
- Create: `src/world/cursor.js`
- Test: `tests/world/cursor.test.js`

**Steps:**

- [ ] **Step 1: Write failing tests**

Create `tests/world/cursor.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCursor, advanceCursor, cursorAtRow, cursorMean } from '../../src/world/cursor.js';

test('createCursor seeds per-row phases deterministically', () => {
  const a = createCursor({ levelId: 1, height: 16, speed: 3.0 });
  const b = createCursor({ levelId: 1, height: 16, speed: 3.0 });
  for (let r = 0; r < 16; r++) {
    assert.equal(cursorAtRow(a, r), cursorAtRow(b, r));
  }
});

test('cursor base advances at speed', () => {
  const c = createCursor({ levelId: 1, height: 16, speed: 3.0 });
  advanceCursor(c, 1.0); // 1 second
  assert.ok(c.baseX >= 3.0 - 1e-9 && c.baseX <= 3.0 + 1e-9);
});

test('cursorAtRow varies between rows', () => {
  const c = createCursor({ levelId: 1, height: 16, speed: 3.0 });
  advanceCursor(c, 1.0);
  const r0 = cursorAtRow(c, 0);
  const r5 = cursorAtRow(c, 5);
  assert.notEqual(r0, r5);
});

test('cursorMean is approximately equal to baseX over time', () => {
  const c = createCursor({ levelId: 1, height: 16, speed: 3.0 });
  // Average over 30 seconds of ticks
  let sum = 0;
  let n = 0;
  for (let i = 0; i < 300; i++) {
    advanceCursor(c, 0.1);
    sum += cursorMean(c);
    n += 1;
  }
  // The mean of mean(rowOffsets) approximates 0; thus mean(cursorMean) ≈ baseX.
  // Sanity-check: cursorMean is within ±3 cells of baseX every frame.
  for (let i = 0; i < 300; i++) {
    advanceCursor(c, 0.1);
    assert.ok(Math.abs(cursorMean(c) - c.baseX) < 3.0);
  }
});
```

- [ ] **Step 2: Run, expect failure**

Run: `npm test`. Cursor tests fail.

- [ ] **Step 3: Implement `src/world/cursor.js`**

```js
import { CONFIG } from '../config.js';
import { makeRowPhases, rowOffset } from '../util/noise.js';

export function createCursor({ levelId, height, speed }) {
  const seed = (CONFIG.CURSOR_SEED_BASE + levelId) >>> 0;
  return {
    baseX: 0,
    speed,
    height,
    t: 0,
    phases: makeRowPhases(seed, height),
  };
}

export function advanceCursor(cursor, dt) {
  cursor.baseX += cursor.speed * dt;
  cursor.t += dt;
}

export function cursorAtRow(cursor, row) {
  return cursor.baseX + rowOffset(row, cursor.t, cursor.phases);
}

export function cursorMean(cursor) {
  let sum = 0;
  for (let r = 0; r < cursor.height; r++) sum += cursorAtRow(cursor, r);
  return sum / cursor.height;
}
```

- [ ] **Step 4: Run, expect pass**

Run: `npm test`. Cursor tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/world/cursor.js tests/world/cursor.test.js
git commit -m "Defrag cursor: per-row jagged front, deterministic per level"
```

---

## Task 11: Sprites (player + cursor + enemy stub) and game loop integration

**Goal:** Render the player as an absolutely-positioned div on top of the grid, render cursor cells (jagged) on top of the grid, and run a `requestAnimationFrame` loop that ties input → physics → collision → cursor → render. At end of this task: open the page, move with arrows/WASD, jump with space. No death yet.

**Files:**
- Create: `src/render/player-sprite.js`
- Create: `src/render/cursor-sprite.js`
- Create: `src/render/enemy-sprite.js` (stub — empty list for now)
- Create: `src/game.js`
- Modify: `src/boot.js` (full wire-up)
- Modify: `styles/sprites.css` (player sprite style)

**Steps:**

- [ ] **Step 1: Create `styles/sprites.css`**

```css
.sprite {
  position: absolute;
  pointer-events: none;
  image-rendering: pixelated;
}
.sprite--player {
  background: #ffff00;
  border: 1px solid #806000;
  box-shadow: 0 0 0 1px #ffff00;
  z-index: 5;
}
.sprite--cursor {
  position: absolute;
  background: #00ff00;
  border: 1px solid #008800;
  box-shadow: 0 0 4px 1px #00ff00, inset 0 0 0 1px #ccffcc;
  animation: cursorPulse 0.4s steps(2) infinite;
  z-index: 4;
}
.sprite--enemy { z-index: 4; }
```

- [ ] **Step 2: Create `src/render/player-sprite.js`**

```js
import { CONFIG } from '../config.js';

export function createPlayerSprite(container) {
  const el = document.createElement('div');
  el.className = 'sprite sprite--player';
  el.style.width  = `${CONFIG.CELL_W}px`;
  el.style.height = `${CONFIG.CELL_H}px`;
  container.appendChild(el);
  return el;
}

// Position the player relative to the grid, accounting for camera offset.
export function positionPlayerSprite(el, player, camera) {
  const stride = CONFIG.CELL_W + CONFIG.CELL_GAP;
  const strideY = CONFIG.CELL_H + CONFIG.CELL_GAP;
  const cellLeft = (player.x - player.width / 2 - camera.x) * stride;
  const cellTop  = (player.y - player.height / 2) * strideY;
  el.style.transform = `translate(${cellLeft}px, ${cellTop}px)`;
}
```

- [ ] **Step 3: Create `src/render/cursor-sprite.js`**

```js
import { CONFIG } from '../config.js';
import { cursorAtRow } from '../world/cursor.js';

// Renders one absolutely-positioned div per row, placed at cursor.atRow(row).
// Re-uses the divs across frames.
export function createCursorSprite(container, height) {
  const els = [];
  for (let r = 0; r < height; r++) {
    const d = document.createElement('div');
    d.className = 'sprite sprite--cursor';
    d.style.width  = `${CONFIG.CELL_W}px`;
    d.style.height = `${CONFIG.CELL_H}px`;
    container.appendChild(d);
    els.push(d);
  }
  return els;
}

export function positionCursorSprite(els, cursor, camera) {
  const stride  = CONFIG.CELL_W + CONFIG.CELL_GAP;
  const strideY = CONFIG.CELL_H + CONFIG.CELL_GAP;
  for (let r = 0; r < els.length; r++) {
    const x = cursorAtRow(cursor, r);
    const left = (x - camera.x) * stride;
    const top  = r * strideY;
    els[r].style.transform = `translate(${left}px, ${top}px)`;
  }
}
```

- [ ] **Step 4: Create `src/render/enemy-sprite.js` (stub)**

```js
// Stubbed for Task 11; enemies are wired in Task 13.
export function createEnemyRenderer(container) {
  return { container, els: [] };
}
export function paintEnemies(/* renderer, enemies, camera */) {
  // no-op for now
}
```

- [ ] **Step 5: Create `src/game.js`**

```js
import { createPlayer } from './player/state.js';
import { applyGravity, integrate, applyHorizontalIntent } from './player/physics.js';
import { startJump, releaseJump } from './player/jump.js';
import { resolveCollisions } from './world/collision.js';
import { createCursor, advanceCursor } from './world/cursor.js';
import { createJumpBuffer, recordJumpPress, recordLeftGround, tickBuffer, canJump, clearJump } from './input/buffer.js';
import { consumeEdges } from './input/keystate.js';

export function createGameState(level) {
  return {
    level,
    player: createPlayer(level.playerStart),
    cursor: createCursor({ levelId: level.id, height: level.height, speed: level.cursorSpeed }),
    jumpBuffer: createJumpBuffer(),
    t: 0,
    state: 'playing', // 'playing' | 'dying' | 'won' | 'paused'
  };
}

// One fixed-timestep update.
export function tick(game, dt, keystate) {
  if (game.state !== 'playing') return;

  const { player, cursor, jumpBuffer, level } = game;
  game.t += dt;
  tickBuffer(jumpBuffer, game.t);

  // --- Input ---
  const edges = consumeEdges(keystate);
  if (edges.has('jump')) recordJumpPress(jumpBuffer, game.t);
  // Detect jump key release — we don't track release as edge here, so check pressed state directly.
  if (player.jumping && !keystate.pressed.has('jump')) {
    releaseJump(player);
  }
  let intent = 0;
  if (keystate.pressed.has('left'))  intent -= 1;
  if (keystate.pressed.has('right')) intent += 1;
  applyHorizontalIntent(player, intent, dt);

  // --- Jump ---
  const wasOnGround = player.onGround;
  if (canJump(jumpBuffer, game.t, player.onGround)) {
    startJump(player);
    clearJump(jumpBuffer);
  }

  // --- Physics ---
  applyGravity(player, dt);
  integrate(player, dt);
  resolveCollisions(player, level);

  // Track ground transitions for coyote-time
  if (wasOnGround && !player.onGround) recordLeftGround(jumpBuffer, game.t);

  // --- Cursor ---
  advanceCursor(cursor, dt);
}
```

- [ ] **Step 6: Update `src/render/camera.js`**

Replace with the version that uses cursor mean:

```js
import { CONFIG } from '../config.js';
import { cursorMean } from '../world/cursor.js';

export function createCamera() {
  return { x: 0, viewportCols: CONFIG.VIEWPORT_COLS };
}

export function updateCamera(camera, player, cursor) {
  const targetByPlayer = player.x - camera.viewportCols / 3;
  const targetByCursor = cursorMean(cursor) - 2;
  camera.x = Math.max(targetByPlayer, targetByCursor, 0);
  return camera;
}
```

- [ ] **Step 7: Rewrite `src/boot.js` to wire everything**

```js
import { CONFIG } from './config.js';
import { loadLevel } from './world/level-loader.js';
import { createGameState, tick } from './game.js';
import { createCamera, updateCamera } from './render/camera.js';
import { createGridRenderer, paintGrid } from './render/grid.js';
import { createPlayerSprite, positionPlayerSprite } from './render/player-sprite.js';
import { createCursorSprite, positionCursorSprite } from './render/cursor-sprite.js';
import { createKeyState, attachKeyState } from './input/keystate.js';
import level1 from '../levels/level1.js';

const level = loadLevel(level1);
const game  = createGameState(level);

const display = document.getElementById('display');
const renderer = createGridRenderer({
  container: display,
  viewportCols: CONFIG.VIEWPORT_COLS,
  viewportRows: level.height,
  cellWidth: CONFIG.CELL_W,
  cellHeight: CONFIG.CELL_H,
});
const camera = createCamera();

// Sprites need an absolutely-positioned overlay that moves with the grid.
display.style.position = 'relative';
const overlay = document.createElement('div');
overlay.style.position = 'absolute';
overlay.style.top = '4px';
overlay.style.left = '4px';
overlay.style.pointerEvents = 'none';
display.appendChild(overlay);

const playerEl = createPlayerSprite(overlay);
const cursorEls = createCursorSprite(overlay, level.height);

const keystate = createKeyState();
attachKeyState(keystate);

const FIXED_DT = 1 / 60;
let acc = 0;
let last = performance.now() / 1000;

function frame(now) {
  const t = now / 1000;
  const dt = Math.min(0.05, t - last);
  last = t;
  acc += dt;
  while (acc >= FIXED_DT) {
    tick(game, FIXED_DT, keystate);
    acc -= FIXED_DT;
  }
  updateCamera(camera, game.player, game.cursor);
  paintGrid(renderer, level, camera);
  positionPlayerSprite(playerEl, game.player, camera);
  positionCursorSprite(cursorEls, game.cursor, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

- [ ] **Step 8: Manual verify**

Run: `npm run dev`. Open the page. Expected:
- Level 1 renders.
- Yellow player sprite is visible at the start (col 2).
- Pressing arrows / WASD moves the player horizontally.
- Pressing Space / Up / W jumps; releasing early cuts the jump short.
- Player falls due to gravity and lands on the cyan floor.
- Cursor cells (green flashing) appear at the left and slowly advance right (jagged front).
- Camera scrolls to follow the player and/or the cursor mean.
- Page does NOT scroll when pressing arrows/space.

If the player falls through the floor, check Step 7 of Task 9 — collision tests should still pass.

- [ ] **Step 9: Commit**

```bash
git add src/render/player-sprite.js src/render/cursor-sprite.js src/render/enemy-sprite.js \
        src/game.js src/render/camera.js src/boot.js styles/sprites.css
git commit -m "Game loop integration: player movement, jumping, cursor advancing"
```

---

## Task 12: Death + checkpoint + restart + goal/win

**Goal:** Player dies on contact with a bad sector or when the cursor in their row overtakes them. Death restarts the player at the last checkpoint touched (or level start). Touching the goal cluster wins the level.

**Files:**
- Create: `src/world/checkpoint.js`
- Modify: `src/world/tile.js` (add `isCheckpoint`, `isGoal` queries)
- Modify: `src/game.js` (add death/win logic)
- Test: `tests/world/checkpoint.test.js`

**Steps:**

- [ ] **Step 1: Add tile queries**

Append to `src/world/tile.js`:

```js
export const isCheckpoint = (t) => t === TILE.CHECKPOINT;
export const isGoal       = (t) => t === TILE.GOAL;
```

Note: `TILE.GOAL` is intentionally NOT in the `SOLID` set (in
`src/world/tile.js` from Task 5). The player walks INTO the goal cell to
trigger the win, rather than landing on top of it.

- [ ] **Step 2: Write failing tests for `checkpoint.js`**

Create `tests/world/checkpoint.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckpointTracker, recordCheckpoint, lastCheckpoint } from '../../src/world/checkpoint.js';

test('lastCheckpoint returns level start when no checkpoint touched', () => {
  const tracker = createCheckpointTracker({ row: 12, col: 2 });
  assert.deepEqual(lastCheckpoint(tracker), { row: 12, col: 2 });
});

test('recordCheckpoint updates the last position', () => {
  const tracker = createCheckpointTracker({ row: 12, col: 2 });
  recordCheckpoint(tracker, { row: 12, col: 22 });
  assert.deepEqual(lastCheckpoint(tracker), { row: 12, col: 22 });
});

test('recordCheckpoint of same position is idempotent', () => {
  const tracker = createCheckpointTracker({ row: 12, col: 2 });
  recordCheckpoint(tracker, { row: 12, col: 22 });
  recordCheckpoint(tracker, { row: 12, col: 22 });
  assert.deepEqual(lastCheckpoint(tracker), { row: 12, col: 22 });
});
```

- [ ] **Step 3: Implement `src/world/checkpoint.js`**

```js
export function createCheckpointTracker(start) {
  return { last: { row: start.row, col: start.col } };
}

export function recordCheckpoint(tracker, cell) {
  tracker.last = { row: cell.row, col: cell.col };
}

export function lastCheckpoint(tracker) {
  return { row: tracker.last.row, col: tracker.last.col };
}
```

- [ ] **Step 4: Run, expect pass**

Run: `npm test`. Checkpoint tests pass.

- [ ] **Step 5: Modify `src/game.js` for death/checkpoint/win**

Add these imports at the top (`createPlayer` is already imported from
Task 11; do not duplicate it):

```js
import { isLethal, isCheckpoint, isGoal } from './world/tile.js';
import { createCheckpointTracker, recordCheckpoint, lastCheckpoint } from './world/checkpoint.js';
import { cursorAtRow } from './world/cursor.js';
```

Then update the existing import line for `./world/cursor.js` to include
`cursorAtRow` alongside the existing names:

```js
import { createCursor, advanceCursor, cursorAtRow } from './world/cursor.js';
```

(Replace the existing `./world/cursor.js` import line; remove the
standalone `cursorAtRow` import added above to avoid a duplicate.)

Update `createGameState`:

```js
export function createGameState(level) {
  return {
    level,
    player: createPlayer(level.playerStart),
    cursor: createCursor({ levelId: level.id, height: level.height, speed: level.cursorSpeed }),
    jumpBuffer: createJumpBuffer(),
    checkpoints: createCheckpointTracker(level.playerStart),
    t: 0,
    state: 'playing',
    deathReason: null, // 'bad_sector' | 'cursor' | null
  };
}
```

At the end of `tick(game, dt, keystate)` (after cursor update), add:

```js
  // --- Touch detection: checkpoint, goal, lethal ---
  const cellRow = Math.floor(player.y);
  const cellCol = Math.floor(player.x);
  if (cellRow >= 0 && cellRow < level.height && cellCol >= 0 && cellCol < level.width) {
    const here = level.tiles[cellRow][cellCol];
    if (isLethal(here)) {
      die(game, 'bad_sector');
      return;
    }
    if (isCheckpoint(here)) {
      recordCheckpoint(game.checkpoints, { row: cellRow, col: cellCol });
    }
    if (isGoal(here)) {
      game.state = 'won';
      return;
    }
  }

  // --- Cursor catch ---
  const cursorX = cursorAtRow(cursor, cellRow);
  if (cursorX >= player.x) {
    die(game, 'cursor');
    return;
  }
}

function die(game, reason) {
  game.state = 'dying';
  game.deathReason = reason;
  // For MVP, restart immediately — no death animation.
  const cp = lastCheckpoint(game.checkpoints);
  const newPlayer = createPlayer(cp);
  // Reset cursor as well so it doesn't immediately re-kill the player on respawn.
  game.cursor = createCursor({ levelId: game.level.id, height: game.level.height, speed: game.level.cursorSpeed });
  game.player = newPlayer;
  game.jumpBuffer = createJumpBuffer();
  game.t = 0;
  game.state = 'playing';
}
```

- [ ] **Step 6: Manual verify**

Run: `npm run dev`. Expected:
- Walking into the bad sector (col 6, row 13 in level 1) kills you and restarts at level start.
- Walking into the checkpoint (col 22) and then dying restarts at col 22.
- Reaching the magenta goal tower (cols 57–59) ends the game (state = 'won') — for MVP, the player just stops moving.

If the cursor catches you, you also restart at the last checkpoint.

- [ ] **Step 7: Commit**

```bash
git add src/world/checkpoint.js tests/world/checkpoint.test.js src/world/tile.js src/game.js
git commit -m "Death (bad sector + cursor) + checkpoint restart + goal win"
```

---

## Task 13: Virus enemy

**Goal:** Spawn enemies declared in level data. Virus walks back and forth between patrol bounds, reverses at edges and at solid tiles. Player kills a virus by stomping (downward velocity on contact). Side touch = death. Render as a small green germ sprite.

**Files:**
- Create: `src/enemies/registry.js`
- Create: `src/enemies/virus.js`
- Modify: `src/render/enemy-sprite.js` (real implementation)
- Modify: `styles/sprites.css` (virus sprite background)
- Modify: `src/game.js` (spawn enemies, tick them, check player-enemy collision)
- Modify: `src/boot.js` (create enemy renderer)
- Test: `tests/enemies/virus.test.js`

**Steps:**

- [ ] **Step 1: Write failing tests for virus**

Create `tests/enemies/virus.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVirus, tickVirus } from '../../src/enemies/virus.js';

test('createVirus places enemy at declared cell, vx>0 by default', () => {
  const v = createVirus({ cell: { row: 12, col: 6 }, patrol: { from: 4, to: 11 } });
  assert.equal(v.x, 6.5);
  assert.equal(v.y, 12.5);
  assert.ok(v.vx > 0);
  assert.equal(v.alive, true);
});

test('virus reverses at right patrol bound', () => {
  const v = createVirus({ cell: { row: 0, col: 4 }, patrol: { from: 4, to: 5 } });
  v.x = 5.6; // past right bound
  tickVirus(v, 0);
  assert.ok(v.vx < 0);
});

test('virus reverses at left patrol bound', () => {
  const v = createVirus({ cell: { row: 0, col: 4 }, patrol: { from: 4, to: 5 } });
  v.vx = -1;
  v.x = 3.4; // past left bound
  tickVirus(v, 0);
  assert.ok(v.vx > 0);
});

test('tickVirus integrates position', () => {
  const v = createVirus({ cell: { row: 0, col: 4 }, patrol: { from: 4, to: 8 } });
  v.vx = 2;
  const x0 = v.x;
  tickVirus(v, 0.1);
  assert.equal(v.x, x0 + 0.2);
});

test('dead virus does not move', () => {
  const v = createVirus({ cell: { row: 0, col: 4 }, patrol: { from: 4, to: 8 } });
  v.alive = false;
  v.vx = 2;
  const x0 = v.x;
  tickVirus(v, 0.5);
  assert.equal(v.x, x0);
});
```

- [ ] **Step 2: Run, expect failure**

Run: `npm test`. Virus tests fail.

- [ ] **Step 3: Implement `src/enemies/virus.js`**

```js
const VIRUS_SPEED = 2.5; // cells/sec

export function createVirus(spec) {
  const { cell, patrol } = spec;
  return {
    type: 'virus',
    x: cell.col + 0.5,
    y: cell.row + 0.5,
    vx: VIRUS_SPEED,
    width: 1, height: 1,
    patrolFrom: patrol.from,
    patrolTo: patrol.to,
    alive: true,
  };
}

export function tickVirus(v, dt) {
  if (!v.alive) return;
  v.x += v.vx * dt;
  if (v.x > v.patrolTo + 0.5) v.vx = -VIRUS_SPEED;
  else if (v.x < v.patrolFrom + 0.5) v.vx = VIRUS_SPEED;
}
```

- [ ] **Step 4: Run, expect pass**

Run: `npm test`. Virus tests pass.

- [ ] **Step 5: Implement `src/enemies/registry.js`**

```js
import { createVirus, tickVirus } from './virus.js';

const FACTORIES = {
  virus: createVirus,
};
const TICKERS = {
  virus: tickVirus,
};

export function spawnEnemies(level) {
  return level.enemies.map(spec => {
    const f = FACTORIES[spec.type];
    if (!f) throw new Error(`Unknown enemy type: ${spec.type}`);
    return f(spec);
  });
}

export function tickEnemies(enemies, dt) {
  for (const e of enemies) {
    const t = TICKERS[e.type];
    if (t) t(e, dt);
  }
}
```

- [ ] **Step 6: Replace `src/render/enemy-sprite.js`**

```js
import { CONFIG } from '../config.js';

export function createEnemyRenderer(container) {
  return { container, els: new Map() }; // enemy → div
}

export function paintEnemies(renderer, enemies, camera) {
  const { container, els } = renderer;
  const stride  = CONFIG.CELL_W + CONFIG.CELL_GAP;
  const strideY = CONFIG.CELL_H + CONFIG.CELL_GAP;

  for (const e of enemies) {
    let el = els.get(e);
    if (!el) {
      el = document.createElement('div');
      el.className = `sprite sprite--enemy sprite--${e.type}`;
      el.style.width  = `${CONFIG.CELL_W}px`;
      el.style.height = `${CONFIG.CELL_H}px`;
      container.appendChild(el);
      els.set(e, el);
    }
    if (!e.alive) {
      el.style.display = 'none';
      continue;
    }
    el.style.display = '';
    const left = (e.x - e.width / 2 - camera.x) * stride;
    const top  = (e.y - e.height / 2) * strideY;
    el.style.transform = `translate(${left}px, ${top}px)`;
  }
}
```

- [ ] **Step 7: Add virus sprite styling**

Append to `styles/sprites.css`:

```css
.sprite--virus {
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 14'><circle cx='5' cy='8' r='3.5' fill='%2300aa00' stroke='%23004400' stroke-width='0.5'/><circle cx='3.7' cy='7' r='0.6' fill='%23000'/><circle cx='6.3' cy='7' r='0.6' fill='%23000'/><line x1='5' y1='4' x2='5' y2='2' stroke='%23004400' stroke-width='0.5'/><line x1='1.5' y1='8' x2='0.2' y2='8' stroke='%23004400' stroke-width='0.5'/><line x1='8.5' y1='8' x2='9.8' y2='8' stroke='%23004400' stroke-width='0.5'/></svg>") center/contain no-repeat;
}
```

- [ ] **Step 8: Wire enemies into `src/game.js`**

Add imports:

```js
import { spawnEnemies, tickEnemies } from './enemies/registry.js';
```

In `createGameState`, add:

```js
    enemies: spawnEnemies(level),
```

In `tick(game, dt, keystate)`, after the cursor update and before the touch detection block, add:

```js
  // --- Enemies ---
  tickEnemies(game.enemies, dt);

  // Player <-> enemy collision
  for (const e of game.enemies) {
    if (!e.alive) continue;
    if (Math.abs(e.x - player.x) < 0.6 && Math.abs(e.y - player.y) < 0.6) {
      // Stomp if player is moving downward and clearly above enemy center.
      if (player.vy > 0 && (player.y < e.y - 0.1)) {
        e.alive = false;
        player.vy = -10; // small bounce
      } else {
        die(game, 'enemy');
        return;
      }
    }
  }
```

- [ ] **Step 9: Wire enemy renderer in `src/boot.js`**

Add imports:

```js
import { createEnemyRenderer, paintEnemies } from './render/enemy-sprite.js';
```

After `const cursorEls = createCursorSprite(overlay, level.height);` add:

```js
const enemyRenderer = createEnemyRenderer(overlay);
```

In `frame(now)`, after `positionCursorSprite(cursorEls, game.cursor, camera);` add:

```js
  paintEnemies(enemyRenderer, game.enemies, camera);
```

- [ ] **Step 10: Manual verify**

Run: `npm run dev`. Expected:
- Two viruses appear at cols 6 and 21, walking back and forth.
- Walking into a virus from the side kills you and restarts at the last checkpoint.
- Jumping on a virus from above kills it (sprite disappears) and gives a small bounce.

- [ ] **Step 11: Commit**

```bash
git add src/enemies/ src/render/enemy-sprite.js styles/sprites.css \
        src/game.js src/boot.js tests/enemies/
git commit -m "Virus enemy: patrol, stomp-to-kill, side-touch death"
```

---

## Task 14: Status bar wiring

**Goal:** Status text reflects current cluster (player x), lives counter (start at 3, decrement on death), % complete (player x / level width), and level name in title bar.

**Files:**
- Create: `src/render/chrome.js`
- Modify: `src/game.js` (track lives)
- Modify: `src/boot.js` (call chrome update each frame)

**Steps:**

- [ ] **Step 1: Create `src/render/chrome.js`**

```js
const els = {
  title:    null,
  status:   null,
  pct:      null,
  progress: null,
};

export function bindChrome() {
  els.title    = document.getElementById('title');
  els.status   = document.getElementById('status-text');
  els.pct      = document.getElementById('status-pct');
  els.progress = document.getElementById('progress-bar');
}

export function updateChrome(game) {
  if (!els.title) return;
  els.title.textContent = `Defragmenting Drive C — Level ${game.level.id}: ${game.level.name}`;
  const playerCol = Math.floor(game.player.x);
  const cluster = playerCol.toString(16).padStart(4, '0').toUpperCase();
  const lives = game.lives.toString().padStart(2, '0');
  els.status.textContent = `Defragmenting file system... · cluster 0x${cluster} · ${lives} lives`;
  const pct = Math.max(0, Math.min(100, Math.floor((game.player.x / game.level.width) * 100)));
  els.pct.textContent = `${pct}% Complete`;
  els.progress.style.width = `${pct}%`;
}
```

- [ ] **Step 2: Modify `src/game.js`**

Add `lives: 3` to `createGameState`:

```js
    lives: 3,
```

In the `die(game, reason)` function, decrement lives at the start:

```js
function die(game, reason) {
  game.lives -= 1;
  game.state = 'dying';
  game.deathReason = reason;
  if (game.lives <= 0) {
    game.state = 'gameover';
    return;
  }
  // Otherwise restart at last checkpoint
  const cp = lastCheckpoint(game.checkpoints);
  const newPlayer = createPlayer(cp);
  game.cursor = createCursor({ levelId: game.level.id, height: game.level.height, speed: game.level.cursorSpeed });
  game.player = newPlayer;
  game.jumpBuffer = createJumpBuffer();
  game.t = 0;
  game.state = 'playing';
}
```

- [ ] **Step 3: Wire in `src/boot.js`**

Add import:

```js
import { bindChrome, updateChrome } from './render/chrome.js';
```

After `attachKeyState(keystate);` add:

```js
bindChrome();
```

Inside `frame(now)`, after the paint calls, add:

```js
  updateChrome(game);
```

- [ ] **Step 4: Manual verify**

Run: `npm run dev`. Expected:
- Title bar reads `Defragmenting Drive C — Level 1: Cluster 0`.
- Status text shows `cluster 0x00XX · 03 lives`.
- Progress bar fills as the player moves right.
- After three deaths, state is 'gameover' (no UI for it yet — that's post-MVP).

- [ ] **Step 5: Commit**

```bash
git add src/render/chrome.js src/game.js src/boot.js
git commit -m "Status bar wiring: cluster, lives, % complete, level name"
```

---

## Task 15: Audio (minimal)

**Goal:** Play a death sound on death and a level-complete chime on win. Use placeholder WAVs (a Win98 .wav from any source, or a synthesized beep generated in code).

**Files:**
- Create: `src/audio/sounds.js`
- Create: `assets/audio/death.wav` (placeholder)
- Create: `assets/audio/level-complete.wav` (placeholder)
- Modify: `src/game.js` (call audio on death/win)
- Modify: `src/boot.js` (initialize audio)

**Steps:**

- [ ] **Step 1: Create `src/audio/sounds.js`**

```js
const sounds = {};

export function loadSounds(map) {
  for (const [name, url] of Object.entries(map)) {
    const a = new Audio(url);
    a.preload = 'auto';
    sounds[name] = a;
  }
}

export function play(name) {
  const a = sounds[name];
  if (!a) return;
  // Clone for overlapping plays
  const c = a.cloneNode();
  c.play().catch(() => { /* ignore autoplay rejection until first user input */ });
}
```

- [ ] **Step 2: Add placeholder WAVs**

For development, generate two short tones with `ffmpeg` (or any tool). Run from repo root:

```bash
mkdir -p assets/audio
ffmpeg -f lavfi -i "sine=frequency=220:duration=0.4" -ac 1 assets/audio/death.wav -y
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.6" -ac 1 assets/audio/level-complete.wav -y
```

If `ffmpeg` is not installed, drop in any short WAVs of your choice. The implementation is what matters; assets can be swapped freely.

- [ ] **Step 3: Wire audio into `src/game.js`**

Add import:

```js
import { play } from './audio/sounds.js';
```

In `die(game, reason)`, after `game.lives -= 1;`, add:

```js
  play('death');
```

In `tick(game, dt, keystate)`, where `game.state = 'won'` is set, add right before:

```js
      play('levelComplete');
```

- [ ] **Step 4: Initialize audio in `src/boot.js`**

After `bindChrome();` add:

```js
import { loadSounds } from './audio/sounds.js';
loadSounds({
  death:         'assets/audio/death.wav',
  levelComplete: 'assets/audio/level-complete.wav',
});
```

(Move the import to the top with the other imports.)

- [ ] **Step 5: Manual verify**

Run: `npm run dev`. After interacting with the page (clicking once is enough to satisfy the browser's autoplay policy), trigger a death — death sound plays. Reach the goal — chime plays.

- [ ] **Step 6: Commit**

```bash
git add src/audio/ assets/audio/ src/game.js src/boot.js
git commit -m "Audio: death + level-complete sounds"
```

---

## Task 16: End-to-end manual playtest sign-off

**Goal:** Confirm the MVP plays as designed. This task has no code changes — it's the final verification gate.

**Steps:**

- [ ] **Step 1: Full unit-test sweep**

Run: `npm test`
Expected: all tests pass (count should be roughly: math 5 + noise 4 + buffer 6 + tile 6 + level-loader 7 + collision 4 + cursor 4 + checkpoint 3 + virus 5 = ~44 tests).

- [ ] **Step 2: Visual playtest**

Run: `npm run dev` and open http://localhost:8080.

Test the golden path:
- [ ] Player starts at col 2, falls onto the cyan floor.
- [ ] ←/→ and A/D move horizontally.
- [ ] Space / W / ↑ jumps; releasing early cuts the jump short.
- [ ] Page does not scroll when game keys are pressed.
- [ ] Bad sector at col 6 kills on contact; restart happens at level start.
- [ ] Yellow platform at cols 8–10 is jumpable.
- [ ] Walking into the virus at col 6 kills you. Stomping the virus from above kills it.
- [ ] Reaching the checkpoint at col 22 marks the position; subsequent deaths respawn there.
- [ ] Floating platforms (cyan diag, fragile yellow stripes, stable yellow) all render and are walkable.
- [ ] Cursor (jagged green column) advances from the left; different rows lead at different times.
- [ ] If you stop and let the cursor catch up, you die and respawn.
- [ ] Reaching the magenta goal tower at cols 57–59 ends the level (state='won').
- [ ] After 3 deaths: state='gameover' (player stops responding — UI for this is post-MVP).
- [ ] Title bar updates with level name; status text updates with cluster + lives; progress bar fills as you advance.
- [ ] Death sound plays on death; chime plays on goal touch.

- [ ] **Step 3: Commit (a tag, not code)**

```bash
git tag -a mvp-v0.1 -m "Defrag MVP playable: level 1 with virus enemy"
```

- [ ] **Step 4: Note follow-on work**

The spec's MVP slice is complete. Post-MVP work for follow-on plans:

- Levels 2–10 (level data + cursor speed tuning)
- Read/write tell mechanics (events array in level data + scheduled tile mutations)
- Fragile blocks (1-step crack, 2-step fall behavior)
- Pop-up dialog enemy
- Bullet packet, BSOD, mouse cursor, hourglass enemies
- Pause menu
- Level-select screen
- Game-over UI
- Legend dialog (cosmetic, accessible from the Legend button)
- Audio polish (step, jump, checkpoint sounds)
- Background music (optional)
