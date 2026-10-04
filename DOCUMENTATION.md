# The Lost: Developer Documentation

> Practical guide for building and extending the game. For *why* things are designed this way, see [architecture.md](./architecture.md). For *what* the game is, see [product.md](./product.md). For task order, see [todo.md](./todo.md).

## Contents

1. [Getting started](#1-getting-started)
2. [Scripts](#2-scripts)
3. [Project conventions](#3-project-conventions)
4. [Controls and URL parameters](#4-controls-and-url-parameters)
5. [How-to guides](#5-how-to-guides)
6. [Configuration reference](#6-configuration-reference)
7. [Event reference](#7-event-reference)
8. [Debugging](#8-debugging)
9. [Testing](#9-testing)
10. [Performance guidelines](#10-performance-guidelines)
11. [Troubleshooting](#11-troubleshooting)
12. [Git and release workflow](#12-git-and-release-workflow)
13. [Glossary](#13-glossary)

---

## 1. Getting started

### Prerequisites

- Node.js 20+
- npm 10+ (or pnpm)
- A modern browser (Chrome recommended for profiling)

### Install and run

```bash
git clone <repo-url> the-lost
cd the-lost
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

### Bootstrapping from scratch

```bash
npm create vite@latest the-lost -- --template vanilla-ts
cd the-lost
npm i phaser simplex-noise
npm i -D vitest eslint prettier typescript-eslint
```

Recommended `tsconfig.json` options:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "tests"]
}
```

Vite alias (`vite.config.ts`):

```ts
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
```

---

## 2. Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm test` | Vitest (run once) |
| `npm run test:watch` | Vitest watch mode |

---

## 3. Project conventions

### Code style

- TypeScript `strict`. No `any` (use `unknown` and narrow).
- Prefer `const`, small pure functions, and early returns.
- Files: `PascalCase.ts` for classes/scenes/entities, `camelCase.ts` for modules of functions/config.
- No magic numbers in logic: constants go to `config/constants.ts` or the relevant config table.
- Units: **pixels** for positions/distances, **seconds** for time (`dt` is always seconds), **radians** for angles. Name variables with units when ambiguous (`radiusPx`, `durationSec`).

### Layering rules

1. `core/` imports nothing from the rest of the app.
2. `world/` and `ai/` logic functions are **pure** (no Phaser imports) wherever possible, so they can be unit tested.
3. `systems/` may use Phaser but communicate with other systems through the **event bus**.
4. `ui/` reads state through events or the read-only `HudModel`. It never mutates simulation state.
5. `config/` holds data only, with no behavior.

### Naming events

`camelCase` nouns/past-tense verbs: `noise`, `damage`, `stoneCollected`, `directorEvent`. Payloads are typed in `GameEvents` ([architecture §6.2](./architecture.md)).

### Randomness

Never call `Math.random()` in gameplay or generation code. Use a named `Rng` stream:

```ts
const rng = new Rng(seed, 'placement');
const x = rng.int(0, size.w - 1);
```

Streams: `world`, `placement`, `loot`, `ai`, `director`. Using separate streams ensures a new AI behavior doesn't change the generated map for the same seed.

---

## 4. Controls and URL parameters

### Default controls

| Input | Action |
|---|---|
| W A S D | Move |
| Mouse | Aim |
| Shift | Sprint |
| Ctrl / C | Crouch |
| Space | Dodge roll |
| LMB (hold) | Light attack (hold for heavy) |
| RMB | Ranged / alternate |
| E | Interact / pick up |
| 1-4 | Hotbar slots |
| Q | Use consumable |
| Tab | Map |
| F3 | Debug overlay |
| Esc | Pause |

### URL parameters

| Param | Example | Effect |
|---|---|---|
| `seed` | `?seed=abc123` | Fixes the world seed |
| `level` | `?level=3` | Starts at a specific level |
| `debug` | `?debug=1` | Enables the debug overlay |
| `god` | `?god=1` | Invulnerable (disabled in production builds) |
| `noevents` | `?noevents=1` | Disables director events |
| `avatar` | `?avatar=scout` | Picks an avatar |

Combine: `http://localhost:5173/?seed=test1&level=2&debug=1&noevents=1`

---

## 5. How-to guides

### 5.1 Add a new level

1. Create `src/config/levels/level6.ts` exporting a `LevelConfig`:

```ts
import type { LevelConfig } from './types';

export const level6: LevelConfig = {
  id: 6,
  name: 'The Ashen Peaks',
  biome: 'snow',
  mapSize: { w: 224, h: 224 },
  fog: { visionRadius: 190, density: 0.75, floor: 0.1 },
  time: { startHour: 20, dayLengthSec: 540 },
  stones: { count: 3, minDistFromSpawn: 80, minDistBetween: 55, decoys: 3, guards: ['hidden', 'trapped', 'guarded'] },
  clues: { perStone: 2, vagueness: 0.6 },
  enemies: [
    { type: 'wolf', count: 6, aggression: 0.7, speedMul: 1.05 },
    { type: 'hunter', count: 3, aggression: 0.7 },
  ],
  loot: { weapons: 0.25, healing: 0.3, ammo: 0.25 },
  events: { intervalSec: [70, 120], pool: ['fogSurge', 'packRelease', 'drums', 'monsoon'], maxIntensityToRoll: 0.3 },
  escape: { chargeSec: 75, waves: 3 },
  boss: null,
  audio: { ambience: 'snow_loop', music: 'tension_03' },
};
```

2. Register it in `src/config/levels/index.ts`:

```ts
export const LEVELS = [level1, level2, level3, level4, level5, level6] as const;
```

3. Add narrator intro/outro lines in `config/narrator.ts` under the level id.
4. Run `npm test`. The solvability property test iterates every registered level automatically.
5. Playtest with `?level=6&seed=test1&debug=1`.

### 5.2 Add a new enemy type

1. Add the type to `EnemyType` and an `EnemyDef` to `config/enemies.ts`:

```ts
bear: {
  hp: 160,
  speed: { patrol: 50, chase: 130 },
  damage: 22,
  senses: { sightRange: 260, fovRad: Math.PI * 0.6, hearingMul: 1.2, scent: true },
  attack: { range: 36, windupSec: 0.6, cooldownSec: 1.4 },
  radius: 18,
  noiseOnAttack: 300,
},
```

2. Create `entities/enemies/Bear.ts` extending `Enemy`.
3. Create `ai/behaviors/bear.ts` returning a `Record<string, State<Bear>>` (states: `Idle`, `Patrol`, `Investigate`, `Chase`, `Attack`, `Search`).
4. Register the factory in the enemy spawner map.
5. Add a counter entry to the codex and (optionally) narrator hints.
6. Reference it from a `LevelConfig.enemies` array.

### 5.3 Add a weapon

```ts
// config/weapons.ts
machete: {
  kind: 'melee',
  tier: 3,
  damage: 26,
  arcRad: Math.PI * 0.7,
  rangePx: 54,
  staminaCost: { light: 12, heavy: 28 },
  windupSec: { light: 0.12, heavy: 0.4 },
  durability: 60,
  noise: 320,
  staggers: true,
},
```

Add a pickup entry in the loot table and an icon in the asset manifest.

### 5.4 Add a director event

```ts
// config/events.ts
fogSurge: {
  id: 'fogSurge',
  weight: 3,
  minLevel: 1,
  durationSec: 45,
  narratorLines: [
    'The mist thickens. The Game does not want you to see.',
    'Fog rolls in, close as a held breath.',
  ],
  apply(ctx) { ctx.vision.addModifier('fogSurge', -0.4); },
  revert(ctx) { ctx.vision.removeModifier('fogSurge'); },
},
```

Rules for events: they must be **reversible** (`revert`) if they have duration, must **never spawn directly on the player**, and should respect `ctx.level.boss` states (no new events mid-boss unless flagged `allowDuringBoss`).

### 5.5 Add a biome

1. Define tile thresholds and palette in `world/biomes.ts`:

```ts
desert: {
  id: 'desert',
  tiles: [
    { max: 0.25, tile: 'water', walkable: false },
    { max: 0.35, tile: 'oasis_grass', walkable: true, surface: 'grass' },
    { max: 1.0,  tile: 'sand',  walkable: true, surface: 'sand' },
  ],
  obstacles: [{ id: 'cactus', density: 0.02, blocks: 1 }, { id: 'dune_rock', density: 0.015, blocks: 1 }],
  cover: [{ id: 'dry_brush', density: 0.04 }],
  palette: { ground: 0xd9b26f, ambient: 0xffd9a0 },
},
```

2. Add surface noise multipliers (`sand: 0.9`) in `constants.ts`.
3. Add landmark templates in `world/placement.ts`.
4. Add a level that uses it.

### 5.6 Add a perk

```ts
// config/perks.ts
lightFooted: {
  id: 'lightFooted',
  name: 'Light Footed',
  description: 'Footstep noise radius reduced by 25%.',
  rarity: 'common',
  modifiers: [{ stat: 'noise.step', op: 'mul', value: 0.75 }],
},
```

Perks are applied through a modifier pipeline (`base → add → mul → clamp`). Never mutate base stats directly.

### 5.7 Emit and listen to noise

```ts
// Player stepping
bus.emit('noise', {
  x: player.x, y: player.y,
  radius: baseRadius * surfaceMul(player.surface),
  sourceId: player.id,
  kind: 'step',
});
```

`PerceptionSystem` handles delivery to nearby enemies. Never call enemy methods directly from the emitter.

---

## 6. Configuration reference

### 6.1 `LevelConfig`

| Field | Type | Description |
|---|---|---|
| `id` | number | Level number (1-based, unique) |
| `name` | string | Display name |
| `biome` | BiomeId | Terrain/palette set |
| `mapSize` | `{w,h}` tiles | 128-256 recommended |
| `fog.visionRadius` | px | Base live vision radius (default 220) |
| `fog.density` | 0..1 | Reduces enemy sight range & visual clarity |
| `fog.floor` | 0..1 | Minimum visibility of darkness layer (accessibility) |
| `time.startHour` | 0-24 | Clock at spawn |
| `time.dayLengthSec` | s | Full day-night cycle |
| `stones.minDistFromSpawn` | tiles | Nearest allowed stone |
| `stones.minDistBetween` | tiles | Spacing between stones |
| `stones.decoys` | number | Fake sites with ambushes |
| `stones.guards` | array | Guard type per stone |
| `clues.perStone` | number | Clues leading to each stone |
| `clues.vagueness` | 0..1 | Angular error / textual ambiguity |
| `enemies[]` | array | Type, count, aggression, optional speed multiplier |
| `loot` | weights | Weapons/healing/ammo per chunk |
| `events.intervalSec` | `[min,max]` | Cooldown between director rolls |
| `events.pool` | string[] | Allowed event ids |
| `events.maxIntensityToRoll` | 0..1 | Director only rolls when intensity is at or below this |
| `escape.chargeSec` | s | Gate charge time during final chase |
| `escape.waves` | number | Enemy waves during escape |
| `boss` | object / null | Boss type and which stone it guards |
| `audio` | ids | Ambience and music tracks |

### 6.2 Constants (defaults)

| Constant | Value |
|---|---|
| `TILE_SIZE` | 32 px |
| `CHUNK_SIZE` | 32 tiles |
| `CHUNK_LOAD_RADIUS` | 2 chunks |
| `SIM_STEP` | 1/60 s |
| Player walk / crouch / sprint | 110 / 60 / 180 px/s |
| Player HP / stamina | 100 / 100 |
| Stamina regen / delay | 14 per s / 1.0 s |
| Exhaustion duration | 2.5 s |
| Dodge i-frames | 0.25 s |
| Spatial hash cell | 128 px |
| Pathfinding budget | 1.5 ms/frame |
| Scent node spacing / lifetime | 24 px / 45 s |

---

## 7. Event reference

| Event | Payload | Emitted by | Typical listeners |
|---|---|---|---|
| `noise` | `{x,y,radius,sourceId,kind}` | Player, Combat, Projectile, Director | PerceptionSystem, Debug overlay, Audio |
| `damage` | `{sourceId,targetId,amount,knockback,kind}` | CombatSystem, Trap, Env | Health, HUD, Audio, Camera |
| `death` | `{id,faction}` | Health | Game flow, Audio, Loot |
| `stoneCollected` | `{index,total}` | Stone entity | HUD, Narrator, Exit gate |
| `exitUnlocked` | none | Game flow | Escape sequence, Narrator, Audio |
| `directorEvent` | `{id,narratorLine,durationSec}` | Director | Narrator UI, Audio, VFX |
| `awarenessChanged` | `{enemyId,level,state}` | PerceptionSystem | Threat indicator, Audio (heartbeat) |
| `levelComplete` | `{levelId,timeSec}` | Game flow | Perk scene, Save |

Enable event logging in the debug overlay to see them as they fire.

---

## 8. Debugging

### Debug overlay (F3)

Toggles: FPS, entity counts, AI state labels, awareness meters, vision cones, noise rings, scent nodes, nav grid, chunk borders, director intensity graph, stone/exit reveal.

### Console helpers (dev builds)

```js
__lost.teleport(x, y)        // move player
__lost.give('bow')           // add weapon
__lost.fire('packRelease')   // fire director event
__lost.revealMap()           // set explored memory to full
__lost.setIntensity(0.9)
__lost.killAll()             // clear enemies
```

Expose via `if (import.meta.env.DEV) (window as any).__lost = {...}`.

### Reproducing a bug

1. Note the **seed** (shown in the debug overlay and the death screen).
2. Load with `?seed=<seed>&level=<n>&debug=1`.
3. For event timing issues, add `?noevents=1` or fire the event manually.
4. Add the failing seed to `tests/fixtures/regression-seeds.ts`.

---

## 9. Testing

```bash
npm test            # once
npm run test:watch  # watch
```

### What to test

| Area | Examples |
|---|---|
| `core/rng` | Same seed/stream → same sequence; different streams differ |
| `world/WorldGenerator` | Deterministic output; spawn walkable; stone and exit reachability; distance constraints (500 seeds per level) |
| `world/Pathfinding` | Shortest path on fixtures; no path through blocked tiles; budget respected |
| `ai/awareness` | Sight cone edges; LOS blocked; hearing falloff; decay |
| `systems/StaminaSystem` | Drain, regen delay, exhaustion lock-out |
| `systems/Director` | Respects cooldown and intensity cap; deterministic with seed |
| `core/storage` | Roundtrip; migration; corrupt data fallback |

### Example test

```ts
import { describe, it, expect } from 'vitest';
import { generateLevel } from '@/world/WorldGenerator';
import { LEVELS } from '@/config/levels';
import { isReachable } from '@/world/ObstacleGrid';

describe.each(LEVELS)('level $id solvability', (cfg) => {
  it('all stones and exit reachable for 100 seeds', () => {
    for (let i = 0; i < 100; i++) {
      const data = generateLevel(cfg, `seed-${i}`);
      for (const s of data.stones.filter(s => !s.decoy)) {
        expect(isReachable(data, data.spawn, s)).toBe(true);
      }
      expect(isReachable(data, data.spawn, data.exit)).toBe(true);
    }
  });
});
```

### Manual playtest checklist

- [ ] Can I tell where threats are without looking at a debug overlay?
- [ ] Do I understand why I died?
- [ ] Did I have at least two viable ways to deal with each encounter?
- [ ] Does stamina create tension without feeling punishing?
- [ ] Is there a moment of real fear in the first 5 minutes?

---

## 10. Performance guidelines

- **Avoid allocations in `update`**: reuse vectors/arrays; pool projectiles, particles, noise rings.
- **Stagger AI work**: perception every 3rd tick per enemy, pathfinding via the budgeted queue.
- **Spatial hash** for proximity queries; never loop all entities against all noise events.
- **Chunk streaming**: bake ground tiles to textures once per chunk load; unload far chunks.
- **Draw calls**: use atlases and batch static sprites; keep fog as one full-screen RT.
- **Profile** with Chrome DevTools Performance tab; look for GC spikes and long tasks > 8 ms.
- Keep per-frame budgets from [architecture §14](./architecture.md).

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Black screen on load | Asset path or Phaser config error | Check console; verify `public/` asset paths |
| Fog covers everything | Erase blend not applied / RT size mismatch | Ensure `BlendModes.ERASE` and RT matches camera size; resize on `Scale.RESIZE` event |
| Fog flickers on resize | RT recreated each frame | Recreate only on resize |
| Enemies visible through fog | Visibility rule not applied | Ensure entity `setVisible` follows `fog.isVisible(x,y)` each tick |
| Same seed gives different maps | Using `Math.random()` or sharing an RNG stream | Use named `Rng` streams only |
| Enemies freeze / stutter | Pathfinding queue starving | Increase budget slightly, cache paths, reduce re-request frequency |
| Stones unreachable | Obstacle carve or solvability check bug | Reproduce with failing seed, add to regression seeds |
| FPS drops over time | Leaked sprites/listeners | Verify chunk unload destroys sprites and `bus.on` unsubscribe is called on scene shutdown |
| Audio doesn't play | Browser autoplay policy | Start audio after first user input |
| Save won't load | Version mismatch / corrupt JSON | Wrap in try/catch, run `migrate`, fall back to defaults |

---

## 12. Git and release workflow

### Branching

- `main`: always deployable.
- Feature branches: `feat/p3-wolf-perception`, `fix/stone-reachability`, `chore/ci`.

### Commit messages (Conventional Commits)

```
feat(P3-05): perception system with sight cone and hearing
fix(world): carve corridor when stone unreachable
perf(ai): stagger perception updates
docs: update controls table
test(world): property test solvability for all levels
```

### Pull request checklist

- [ ] `typecheck`, `lint`, `test`, `build` pass
- [ ] New behavior is config-driven where possible
- [ ] Debug visualization added for new systems
- [ ] Docs updated (`documentation.md` and/or `product.md`)
- [ ] Playtest note added for gameplay changes

### Release

1. Update version in `package.json`, tag `vX.Y.Z`.
2. CI builds and deploys `main`.
3. Verify the production URL with the smoke checklist in [todo.md](./todo.md).

---

## 13. Glossary

| Term | Meaning |
|---|---|
| **Board** | A level |
| **The Game** | Antagonist system: director + narrator |
| **Director** | Pacing system that fires events based on intensity |
| **Intensity** | 0..1 value tracking recent threat exposure |
| **Live vision** | Current visible radius around the player |
| **Explored memory** | Terrain remembered after being seen |
| **Awareness** | Per-enemy 0..1 detection meter |
| **Scent trail** | Breadcrumb nodes wolves follow |
| **Chunk** | 32×32 tile streaming unit |
| **Stream** | A named seeded RNG sequence |
| **Decoy** | Fake stone site with ambush |
| **Perk** | Between-level upgrade chosen from three |