# Defrag — Browser Platformer Built On Win98 Disk Defragmenter

## Overview

A browser-playable side-scrolling platformer themed as the Windows 98 Disk
Defragmenter. The game runs visually inside a pixel-accurate Win98 defrag
window. The player is a small sprite traversing the disk's cluster grid,
trying to reach the boot sector before the defragmentation operation
overwrites them.

The defrag operation is not background scenery — it is the antagonist.
Reading and writing animations are gameplay tells. The "% Complete" status
text is a live timer of player progress.

## Vision and tone

- **Authentic Win98 aesthetic, period-correct.** Window chrome, palette,
  block proportions, and legend categories match the actual `defrag.exe`
  from Win98. No anachronistic UI (no "viruses detected", no telemetry, no
  modern affordances).
- **Mario Game Boy 1-1 platformer feel.** Discrete levels, hand-authored,
  short, readable beats, increasing difficulty.
- **Race-against-the-clock pressure.** The disk is being defragged in real
  time. Lingering kills you.

## Core gameplay loop

1. Level starts. Defrag cursor enters from the left edge.
2. Player runs/jumps right, navigating stable terrain (yellow, system) and
   volatile terrain (cyan data, gray free space) while watching for read
   tells (green) and write tells (red) that signal imminent terrain change.
3. Hazards: bad sectors (instant death on touch), enemies (processes), the
   defrag cursor catching up (instant death).
4. Reaching the magenta goal cluster (boot sector) at the right edge of the
   level wins it.
5. Death restarts at the last checkpoint cluster touched.
6. Win advances to the next level.

## Visual design

### Window chrome

A Win98-style window containing the game. Specifics:

- Title bar: linear gradient `#000080` to `#1084d0`, white bold MS Sans
  Serif text. Title shows `Defragmenting Drive C — Level N: Cluster X`.
- Minimize / maximize / close buttons at top right (cosmetic).
- Optional menu bar: `File / View / Help`.
- Display frame: white background with sunken bevel border, holds the
  cluster grid.
- Status row beneath the grid:
  - Status text (e.g. `Defragmenting file system... · cluster 0x0XXX · 0N lives`).
  - Segmented progress bar showing `% Complete` (driven by player x position).
  - Buttons: `Stop`, `Pause`, `Legend`, `Hide Details`. `Pause` actually
    pauses the game; `Stop` returns to a level-select menu; `Legend` opens
    the legend dialog (cosmetic but accurate); `Hide Details` is
    decorative.

### Cluster grid

- Cells are **8 pixels wide × 11 pixels tall** (portrait), with **1px solid
  uniform borders** (no 3D bevels) and **1px gaps** on a white grid
  background.
- The grid fills the display frame; the camera scrolls horizontally as the
  player advances.
- Aesthetic is locked-loose: the above are starting values, expected to
  tune during implementation.

### Block / cluster types

Authentic Win98 categories preserved:

| Code | Name | Visual | Behavior |
|------|------|--------|----------|
| `~` | Unoptimized data (solid) | Cyan `#00b0b0`, dark cyan border | Volatile floor/platform. Defrag cursor reads it away. |
| `:` | Unoptimized data (diagonal) | Diagonal stripes cyan | Same as `~`; pattern variety. |
| `'` | Unoptimized data (dotted) | Dotted cyan | Same as `~`; pattern variety. |
| `O` | Optimized data | Solid blue `#0000a8` | Stable platform once defrag has finished it. |
| `.` | Free space | No border, no fill — pure white grid background | Empty. Pit. Visually indistinguishable from the gap between cells; the absence of a block IS the free space. |
| `Y` | Won't move (system) | Dark cross-hatch | Stable platform. Never changes during a level. |
| `B` | Bad sector | Solid red `#d80000` | Stable. Permanent death on touch. |
| `r` | Reading (tell) | Green `#00c000` flashing | Cyan block in the next ~1s; will become free space. Player warning to leap. |
| `w` | Writing (tell) | Red `#ff4040` flashing | Free space in the next ~1s; will become solid (cyan). Player warning to wait for a forming bridge. |

Game-only categories (extending the visual grammar):

| Code | Name | Visual | Behavior |
|------|------|--------|----------|
| `P` | Player | Yellow with dark border, optional sprite face | The "you" cluster. Could be themed as the read head. |
| `G` | Goal (boot sector) | Magenta diagonal stripes, slow pulse | Touch to win the level. |
| `C` | Checkpoint | Green dotted | Touching saves restart point. |
| `F` | Fragile | Yellow horizontal stripes | Cracks after one step on it; falls on the second. |
| `X` | Defrag cursor | Bright green column, sweeping pulse | The encroaching threat. Vertical column of cells. |

The "Belongs at beginning / middle / end of drive" sub-categories from real
Win98 are *not* gameplay-distinct — collapsed to the three pattern variants
of `~`/`:`/`'` for visual variety only.

## Player and controls

- **Player size:** 1 cell.
- **Movement:**
  - Left: `Left Arrow` or `A`.
  - Right: `Right Arrow` or `D`.
  - Jump: `Up Arrow`, `W`, or `Space`.
  - Drop through fragile from above: `Down Arrow` or `S`.
- **Jump physics:**
  - Variable height by hold duration (longer hold = higher jump, capped).
  - Coyote time: ~80ms grace period after leaving a platform during which
    a jump still works. Standard platformer convenience.
  - Jump buffer: ~80ms grace period before landing during which a queued
    jump still triggers.
- **Movement physics:**
  - Acceleration toward target velocity rather than instant snap (small
    momentum). Standard Mario feel.
  - Air control: present but reduced compared to ground.
- **Browser:** `event.preventDefault()` for all game-bound keys to prevent
  page scrolling. Specifically guard Space, arrows, WASD.

## Threat: the defrag cursor

A vertical column of bright-green flashing cells, one cell wide,
spanning the full grid height. Starts at column 0 (or just off-screen left)
when a level begins.

- **Movement:** Advances rightward at a steady speed (per-level constant).
  Speed is chosen per level and increases across levels.
- **Death:** If the cursor's column overtakes the player's column, the
  player is immediately read away and dies.
- **Camera:** The viewport tracks `max(player.x, cursor.x + small_offset)`,
  meaning the player can run ahead and the cursor stays off-screen left,
  but if the player slows, the cursor enters the viewport and applies
  visible pressure.
- **Effect on terrain:** Cells the cursor sweeps over become free space
  (read away) for visual continuity. Optimized blocks (`O`) might be left
  alone — TBD during implementation tuning.
- **Effect on enemies:** Enemies are also read away when the cursor reaches
  their column; this lets a clever player wait out an enemy at the cost of
  losing lead time.

## Enemies (processes)

All enemies are 1 cell, treated as data for cursor purposes. Mario-archetype
mapping:

| Sprite | Name | Mario equiv | Behavior | First level |
|---|---|---|---|---|
| Green germ | Virus | Goomba | Walks platform, turns at edges, stompable from above. Side touch = death. | 1 |
| Mini error window | Pop-up dialog | Piranha plant | Sprouts from system blocks at intervals, stays few seconds, retracts. Stomp on title bar. | 1 |
| Red right-arrow | Bullet packet | Bullet Bill | Spawns from off-screen right, flies left. Cannot be stomped; jump or duck. | 3 |
| Mini BSOD window | BSOD | Lakitu | Hovers above player, drops bad-sector clusters onto terrain. Killable only by defrag cursor. | 5 |
| Mouse arrow | Mouse cursor | Boo | Idle when player moves; chases when player stops. | 7 |
| Yellow hourglass | Hourglass | — | Stationary; touch freezes player for 2 seconds (usually fatal). | 8 |

Enemy collision rules:
- Stompable enemies: kill if player's downward velocity is positive when
  contact happens on the enemy's top half.
- Non-stompable enemies: any contact is death.
- Player gets a small upward bounce on a successful stomp.

## Level structure and progression

- **Total:** 10 hand-authored levels.
- **Level dimensions:** ~60 cells wide × 16 cells tall as a starting size;
  later levels may be longer.
- **Per-level parameters:**
  - Tile grid (2D array, ASCII-friendly format below).
  - Cursor speed (cells/sec).
  - Active read/write tell schedule (which cells, when, what they become).
  - Enemy spawns (type, position, behavior parameters).
  - Goal column.
- **Difficulty curve:**
  - L1–L2: introduce walking, jumping, bad sectors, checkpoints.
  - L3–L4: introduce read/write tells as core mechanic, bullet packets.
  - L5–L6: introduce BSOD, fragile platforms with aggressive read tells.
  - L7–L8: mouse cursor (no-stopping), hourglass.
  - L9–L10: gauntlets combining everything.

### Level data format

Levels are stored as JS modules exporting an object:

```js
export default {
  id: 1,
  name: "Cluster 0",
  cursorSpeed: 3.5, // cells/sec
  width: 60,
  height: 16,
  // ASCII grid: rows top-to-bottom, chars left-to-right
  grid: [
    "............................................................",
    "............................................................",
    // ... 16 rows total, each 60 chars
  ],
  // Read/write tells — cells that change on a schedule
  events: [
    { time: 5.0, type: "read",  cell: [13, 43], becomes: "." },
    { time: 7.5, type: "write", cell: [13, 49], becomes: "~" },
  ],
  // Enemies
  enemies: [
    { type: "virus",  cell: [12, 6],  patrolFrom: 4,  patrolTo: 11 },
    { type: "virus",  cell: [12, 21], patrolFrom: 20, patrolTo: 25 },
    { type: "popup",  cell: [9, 38],  emergeEvery: 4.0, stayFor: 2.0 },
  ],
};
```

### Level 1 (authored)

```
        0         1         2         3         4         5
        0123456789012345678901234567890123456789012345678901234567890
row  0: ............................................................
row  1: ............................................................
row  2: ............................................................
row  3: ............................................................
row  4: .........................................................GGG
row  5: .........................................................GGG
row  6: .........................................................GGG
row  7: .........................................................GGG
row  8: ............................................................
row  9: ..............::....................YYYYY..................
row 10: .........................FFFF..............................
row 11: ........YYY......................Y.................YY.....GGG
row 12: ..P.....................C........YY..................YY...GGG
row 13: X~~~:~~B'~~~:~~':~~..............~~~~~~~~~~~r~B~..~~~~~~YYYGGG
row 14: X~~~:~~~~~~~:~~':~~..............~~~~:~~~~~~~~~~~..wwww~~~YYY
row 15: X~~~~~~~~~~~~~~~~~~..............~~~~~~~~~~~~~~~~..~~~~~~YY~~
```

(`X` columns at left = defrag cursor entering. `r` = read tell. `w` =
write tell. The exact authored grid is in the implementation as
`levels/level1.js`; the display above is illustrative.)

Beat sheet:
- 0–7: flat data ground intro
- 8–10: low yellow stable platform
- 12: single bad sector on the floor
- 14–15: floating cyan platform overhead
- 17–19: small pit
- 22: checkpoint
- 25–28: fragile floating platform
- 30–34: medium pit with stable stepping pillar at col 32
- 36–40: high yellow platform (alternate route)
- 43: read tell on the floor (vanishing-ground tease)
- 46: second bad sector
- 48–50: pit with write tell forming a bridge
- 52–55: staircase up to goal
- 57–59: goal tower

Enemies in level 1:
- Virus at col 6, patrolling cols 4–11.
- Virus at col 21, patrolling cols 20–25.
- Pop-up dialog at col 38, emerging from the system block.

## Tech architecture

### Stack

- Vanilla HTML, CSS, JavaScript. ES modules.
- No build step. Served by a tiny static dev server (e.g. `python3 -m
  http.server 8080`) so module imports work over `http://`.
- Single-page application; no backend.
- Targets modern desktop browsers (Chrome, Firefox, Safari, Edge — last 2
  versions). Mobile not in scope.

### Rendering

- DOM grid using CSS Grid. One `<div>` per cell. Each cell has a CSS class
  per type, plus animation classes for tells and the cursor. Free-space
  cells render as a `<div>` with no border and no background — the grid's
  white background shows through, matching the authentic Win98 appearance
  where free space is indistinguishable from the gap between blocks.
- Cell pool of size `viewport_cols × grid_rows` (≈ ~80 × 16 ≈ 1280 cells).
  Pool is recycled as the camera scrolls — when the camera moves right by
  one column, the leftmost column of cells gets repurposed as the new
  rightmost column rather than creating/destroying DOM nodes.
- Player and enemies are absolutely positioned `<div>`s overlaid on the
  grid, with smooth pixel motion (not cell-snapped).
- Defrag cursor is rendered as a column of cells animated with CSS.

### Game loop

- Single `requestAnimationFrame` loop in `game.js`. Computes delta time;
  runs fixed timestep updates (e.g. 60Hz physics) with rendering once per
  frame.
- Update order per tick:
  1. Process input (key buffer for jump-buffer logic).
  2. Apply physics to player (velocity, gravity, collision).
  3. Update enemies (patrol, emerge/retract, fire).
  4. Advance defrag cursor.
  5. Apply scheduled events (read/write tells maturing into terrain
     changes).
  6. Check win/death conditions.
  7. Render.

### Module layout

**Principle: many small files, one responsibility each.** When a file
starts to span multiple concerns or grows past ~150–200 lines, split it
rather than letting it sprawl. This keeps future iterations workable when
context is limited and makes targeted edits more reliable. Each enemy gets
its own file; each level gets its own file; each system (input, physics,
render, cursor, audio) gets its own file. Do not combine "small" related
files just to reduce file count — file count is cheap, file size is
expensive.

```
defrag/
  index.html
  src/
    game.js          // main loop, state machine
    input.js         // keyboard handler
    physics.js       // player/enemy motion, collision
    render.js        // DOM grid, camera, cell pool
    cursor.js        // defrag cursor logic
    enemies/
      index.js       // dispatch on type
      virus.js
      popup.js
      packet.js
      bsod.js
      mouse.js
      hourglass.js
    audio.js         // tiny WebAudio wrappers
    legend.js        // legend dialog
  levels/
    level1.js
    level2.js
    ...
    index.js         // exports the array of levels
  styles/
    chrome.css       // window chrome, buttons, title bar
    grid.css         // cell types, animations
    sprites.css      // player + enemy SVG backgrounds
  assets/
    audio/
      step.wav, jump.wav, death.wav, levelcomplete.wav, chime.wav
```

### State machine

Top-level states: `boot` → `menu` → `playing` → (`paused` | `dying` |
`won`) → `menu` again.

`playing` substate machine for the player: `running`, `jumping`,
`falling`, `frozen` (hourglass), `dying`.

### Collision

- Tile collision: AABB against cell boundaries, with separate axis
  resolution. Standard platformer technique.
- Tells (`r`, `w`) are not collidable with — `r` is still a solid cyan
  block until it expires, `w` is still empty until it solidifies.
- Fragile (`F`) is solid until stepped on, then transitions to "cracked"
  (visual change), then on the next step transitions to free.
- Defrag cursor occupies one column at a time; collision check is just
  `player.column < cursor.column` → death.

## Audio

Lo-fi single-shot WAV samples played via WebAudio. Short, in-character:

- `step` — soft tile-blip.
- `jump` — short rising bleep.
- `land` — light thud.
- `death` — Win98 system error chime ("ding-dong-ding").
- `level_complete` — Win98 startup-style chime.
- `checkpoint` — short two-note rise.
- `popup` — Win98 "ding" notification.
- `defrag_tick` — barely-audible tick whenever cursor advances a column.
  Subtle anxiety-inducing background metronome.

No music in MVP. Background music could be a stretch goal (chiptune
rendition of the Win98 startup melody, looping).

## Anti-anachronism rules (period accuracy)

For both the chrome and any in-game text, do not include things that
wouldn't have existed in `defrag.exe` circa 1998:

- No virus / threat / scan counters.
- No telemetry text or "uploading results" status.
- No cloud / network / online indicators.
- No accessibility shortcuts text in chrome (the era didn't show them
  unless ALT was held — though underlined hotkey letters like "S__t__op"
  are correct).
- No high-DPI / retina scaling assumptions in the visual design — the look
  should hold up on a literal 1024×768 display.

Decorative game-only text (lives counter, score) is fine since it lives in
the status bar context of a game, not the defrag tool.

## Out of scope (YAGNI)

- Level editor.
- Save state / persistence beyond current session.
- Mobile / touch controls.
- Multiplayer.
- Localization.
- Difficulty modes / accessibility toggles (post-MVP if at all).
- High-score leaderboards.
- Achievements.

## MVP slice (recommended first implementation plan)

Cut to the smallest playable thing that proves the design:

1. Window chrome (cosmetic).
2. DOM grid renderer with cell types.
3. Player movement + physics + jump.
4. Tile collision.
5. Defrag cursor advancing.
6. Death on cursor catch and bad sector.
7. Win on goal touch.
8. Checkpoint + restart.
9. Level 1 only.
10. Virus enemy only (1 enemy type).
11. One audio cue: death + level complete.

Post-MVP work: levels 2–10, additional enemies, read/write tell mechanics,
fragile blocks, audio polish, legend dialog, pause menu, level select.

## Open questions deferred to implementation

- Exact cursor speed per level (tune by playtesting).
- Exact jump physics constants (tune by playtesting).
- Whether the cursor consumes optimized blocks (`O`) or leaves them.
- Whether the camera locks to cell boundaries on scroll or moves
  pixel-smoothly. (Defaulting to pixel-smooth for the player; the grid
  itself remains cell-aligned because the cells are absolutely sized.)
- Visual treatment of the player sprite (currently just a yellow cell;
  could become a small read-head pixel sprite).
