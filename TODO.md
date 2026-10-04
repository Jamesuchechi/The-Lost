# The Lost: Build Plan

> Companion to [product.md](./product.md) and [architecture.md](./architecture.md).
> Convention: `[ ]` todo · `[~]` in progress · `[x]` done. IDs are stable so commits and issues can reference them (e.g. `feat(P2-03): live vision mask`).

## How to use this plan

- Each phase has a **goal**, **tasks**, and an **exit criteria** checklist. Don't start the next phase until exit criteria pass (or consciously defer items to the backlog).
- Estimates are for one developer working focused. Phase 1-4 is the "today" slice.
- Every phase ends with a **playtest** note: write 3 lines on what felt good, bad, and confusing.

## Overview

| Phase | Name | Est. | Milestone |
|---|---|---|---|
| 0 | Project setup | 0.5 h | M1 |
| 1 | Player, camera, world | 1.5 h | M1 |
| 2 | Fog of war + stamina | 1.5 h | M1 |
| 3 | Wolves, perception, noise | 2 h | M1 |
| 4 | Combat + stones + win/lose (Level 1 complete) | 2 h | **M1: Prototype** |
| 5 | Level config system + Director + Narrator | 3 h | M2 |
| 6 | Hunters + ranged + traps | 3 h | M2 |
| 7 | HUD, map, feedback polish | 2 h | **M2: Vertical slice** |
| 8 | Levels 2-5 content | 6 h | M3 |
| 9 | Lions + bosses | 4 h | M3 |
| 10 | Avatars, perks, progression, save | 4 h | **M3: Content** |
| 11 | Audio + art + lighting pass | 6 h | M4 |
| 12 | Settings, accessibility, balance | 3 h | M4 |
| 13 | QA, performance, release | 3 h | **M4: Release** |
| 14 | Post-launch | - | M5 |

---

## Phase 0: Project setup (0.5 h)

**Goal:** Empty game boots with CI green.

- [x] P0-01 Initialize project structure with Vite TypeScript
- [x] P0-02 Install deps: `three`, `@types/three`, `simplex-noise`; dev: `vitest`, `eslint`, `prettier`, `typescript-eslint`
- [x] P0-03 `tsconfig`: `strict`, `noUncheckedIndexedAccess`, path alias `@/*` → `src/*`
- [x] P0-04 Folder skeleton per [architecture.md §4](./architecture.md)
- [x] P0-05 Three.js renderer config (WebGLRenderer, sRGBEncoding/OutputColorSpace, shadowMap, fixed 60 FPS target), App entry → Game loop
- [x] P0-06 Core utilities: `rng.ts`, `EventBus.ts`, `math.ts`, `constants.ts`
- [x] P0-07 Vitest set up + first test (RNG determinism)
- [x] P0-08 ESLint/Prettier configs + `npm run lint`, `typecheck`, `test`, `build` scripts
- [x] P0-09 GitHub Actions workflow: lint, typecheck, test, build
- [x] P0-10 Commit docs (`README`, `product`, `architecture`, `todo`, `documentation`, `ideas`, `decisions`)

**Exit criteria**
- [x] `npm run dev` shows a blank game canvas
- [x] `npm test` passes; CI green

---

## Phase 1: Player, camera, world (1.5 h)

**Goal:** Walk around a procedurally generated chunked world bigger than the screen.

- [x] P1-01 `InputController`: WASD, mouse position (world-space), Shift, Ctrl, Space, LMB/RMB, E, Tab, Esc
- [x] P1-02 `Player` entity: position, velocity, facing toward mouse, walk/crouch/sprint speeds from constants
- [x] P1-03 Camera follow with deadzone + mouse look-ahead
- [x] P1-04 `LevelConfig` type + `level1.ts` (minimal fields)
- [x] P1-05 `WorldGenerator` v1: simplex heightmap/moisture → forest biome tiles + water + obstacles (pure, no rendering imports)
- [x] P1-06 `ObstacleGrid`: bitset + `isBlocked(x,y)` + DDA `hasLineOfSight`
- [x] P1-07 `ChunkManager`: load/unload chunks in a radius, instanced 3D terrain and obstacles
- [x] P1-08 Player vs. obstacle collision using the grid (slide along walls)
- [x] P1-09 Realistic 3D mesh representation for player, trees, rocks, altars, gate
- [x] P1-10 Debug overlay v0 (FPS, position, seed, chunk count) behind F3
- [x] P1-11 Test: `generateLevel` determinism for fixed seed; spawn is on walkable tile

**Exit criteria**
- [x] 256×256 map streams with no hitching; ≥ 60 FPS
- [x] Same seed → identical map (test + visual check)
- [x] `?seed=` URL param works

---

## Phase 2: Fog of war + stamina (1.5 h)

**Goal:** The game *feels* like The Lost: limited vision, memory of explored areas, and stamina pressure.

- [x] P2-01 `FogRenderer` live vision: volumetric fog plane + radial live vision erase at player
- [x] P2-02 Smooth vision radius changes (lerp) driven by a `VisionModifiers` object
- [x] P2-03 Explored memory: level-size canvas texture, updated on player movement with linear filter
- [x] P2-04 Entity visibility rule: entities outside live vision radius are hidden/culled
- [x] P2-05 `StaminaSystem`: pool, costs table, regen delay, regen boost when crouched/still
- [x] P2-06 Exhaustion state ("winded"): slow movement + breath noise event
- [x] P2-07 Sprint gating (can't sprint under threshold or when winded), crouch speed
- [x] P2-08 HUD: health + stamina bars with exhaustion states
- [x] P2-09 Noise emission from player movement (`noise` events with surface multipliers) + sound ripple rings
- [x] P2-10 Tests: stamina drain/regen/exhaustion timeline; vision modifier stacking

**Exit criteria**
- [x] Walking reveals terrain that stays dimly visible after leaving
- [x] Sprinting to zero stamina causes visible winded state
- [x] Debug overlay shows noise radii that change with crouch/walk/sprint

---

## Phase 3: Wolves, perception, noise (2 h)

**Goal:** Wolves that hunt using senses, with the full unaware → search loop.

- [x] P3-01 `Entity` + `Health` component; `EnemyDef` table (`config/enemies.ts`)
- [x] P3-02 `StateMachine` + unit tests
- [x] P3-03 `Pathfinding`: grid A* + binary heap + time-budgeted request queue
- [x] P3-04 Spatial hash / distance for entity & noise queries
- [x] P3-05 `Awareness` component + `PerceptionSystem` (sight cone + LOS, hearing from `noise` events)
- [x] P3-06 `ScentTrail` ring buffer + wolf scent following
- [x] P3-07 Wolf states: `Idle/Patrol → Investigate → Chase → Attack → Search → Return`
- [x] P3-08 Wolf pack roles (pressure vs. flank) with offset angle
- [x] P3-09 Enemy spawn from `level1.enemies`, patrol routes between waypoints
- [x] P3-10 Wolf 3D model, telegraph & attack logic
- [x] P3-11 Awareness indicator above enemy (`?` amber / `!` red)
- [x] P3-12 Debug: draw vision cones, state labels, scent nodes (F3)
- [x] P3-13 Tests: hearing/sight stimulus math; awareness decay; A* shortest path on fixture grids

**Exit criteria**
- [x] Crouching past a wolf at distance works; sprinting near one alerts it
- [x] Wolves lose you when you break LOS, then enter Search and return to Patrol
- [x] AI + perception stay under budget with 8 wolves (≤ 2.5 ms combined)

---

## Phase 4: Combat, stones, win/lose: Level 1 complete (2 h)

**Goal:** A complete, winnable, losable Level 1. **Milestone M1.**

- [ ] P4-01 `CombatSystem`: melee arc hit detection, `DamageEvent`, knockback, stagger
- [ ] P4-02 Player light + heavy attack with stamina costs and noise emission
- [ ] P4-03 Dodge roll with i-frames
- [ ] P4-04 Backstab rule (unaware + rear arc → ×3, quiet)
- [ ] P4-05 Wolf health, hit reactions, death, flee at 25% HP
- [ ] P4-06 Weapon pickups: sharpened stick (+ durability), `Pickup` entity + interact (E)
- [ ] P4-07 Consumables: bandage (1.5 s, interruptible)
- [ ] P4-08 `placement.ts`: stones (distance constraints), solvability flood-fill, spawn, exit gate
- [ ] P4-09 Stone entity + collection + `stoneCollected` event; stone counter (temp HUD)
- [ ] P4-10 Clues v1: totems pointing toward next stone (text + arrow glyph)
- [ ] P4-11 Exit gate: locked until 3 stones; unlocks → "escape" state with gate charge timer + extra wolf wave
- [ ] P4-12 Win screen and Death screen (cause of death, time, stones found)
- [ ] P4-13 Restart flow (new seed / same seed)
- [ ] P4-14 Property test: 500 seeds → all stones/exit reachable; distances respected
- [ ] P4-15 Playtest #1 and write notes

**Exit criteria (M1)**
- [ ] Full Level 1 playable start to finish in 8-12 min
- [ ] Player can win by stealth, by fighting, or a mix
- [ ] No softlocks (unreachable stone/exit) across 500 seeds
- [ ] Deployed to a preview URL

---

## Phase 5: Level config system + Director + Narrator (3 h)

**Goal:** The Game becomes a character; levels are fully config-driven.

- [ ] P5-01 Finalize `LevelConfig` schema ([architecture §6.3](./architecture.md)); migrate Level 1 fully to config
- [ ] P5-02 Config validation (runtime assertion with helpful errors) + unit test
- [ ] P5-03 `Director`: intensity model, cooldowns, weighted event selection (seeded stream `director`)
- [ ] P5-04 `GameEventDef` table + first events: Fog Surge, Pack Release, Nightfall
- [ ] P5-05 `DayNightSystem`: time-of-day, ambient tint, vision modifier hook
- [ ] P5-06 Narrator UI: text overlay with typewriter + fade, queue, subtitle style
- [ ] P5-07 Narrator line pools (`config/narrator.ts`) with variants and anti-repeat
- [ ] P5-08 Event bus → UI/audio hooks (sting placeholder)
- [ ] P5-09 Debug: force-fire events, show intensity graph, `?noevents=1`
- [ ] P5-10 Level intro card ("Board 1: The Veiled Woods") and outro
- [ ] P5-11 Tests: director never fires above `maxIntensityToRoll`; cooldown respected; deterministic with seed

**Exit criteria**
- [ ] Events fire at sensible cadence (check 3 playthroughs)
- [ ] Changing a number in `level1.ts` visibly changes difficulty without code edits

---

## Phase 6: Hunters, ranged weapons, traps (3 h)

**Goal:** Second enemy archetype and the tactical toolkit.

- [ ] P6-01 `Hunter` enemy: vision cone, torch light (visible through fog), patrol
- [ ] P6-02 Hunter ranged attack with telegraph and projectile; keep-distance + cover-seeking behavior
- [ ] P6-03 Hunter alert broadcast (shout noise) to nearby hunters
- [ ] P6-04 `Projectile` pool (arrows, stones) with lifetime and pierce
- [ ] P6-05 Player ranged: sling (infinite stones, weak) and short bow (ammo, draw hold)
- [ ] P6-06 Arrow retrieval pickups
- [ ] P6-07 Throwable stone distraction (noise at impact point)
- [ ] P6-08 Traps: snare (immobilize), pit trap (damage); player-placed and hunter-placed
- [ ] P6-09 Weapon durability and breakage feedback
- [ ] P6-10 Loot placement weights per chunk + guaranteed starter kit near spawn
- [ ] P6-11 Tests: projectile hit detection; trap trigger rules; loot starter-kit guarantee

**Exit criteria**
- [ ] A hunter can be avoided, distracted, trapped, outranged, or fought
- [ ] No more than one dominant tactic (check playtest notes)

---

## Phase 7: HUD, map, feedback polish (2 h). Milestone M2

- [ ] P7-01 `UIScene` as parallel scene; `HudModel` read-only snapshot
- [ ] P7-02 Final HUD: health, stamina (auto-fade), hotbar, stone counter, interaction prompts
- [ ] P7-03 Map (Tab): explored memory, player marker, found clues, discovered stones
- [ ] P7-04 Threat feedback: directional vignette pulse, heartbeat scaling (audio placeholder)
- [ ] P7-05 Noise ripple visualization (toggle)
- [ ] P7-06 Hit feedback: hit-stop, camera shake, flashes (all driven by `damage` events)
- [ ] P7-07 Pause menu + settings stub
- [ ] P7-08 Death replay of last 5 s enemy positions on map
- [ ] P7-09 Playtest #2 with 2-3 other people; collect "why did I die?" answers

**Exit criteria (M2)**
- [ ] First-time player understands fog, stamina, and noise without reading anything
- [ ] Deaths feel explainable ("I got loud", "I ran out of stamina")

---

## Phase 8: Levels 2-5 content (6 h)

- [ ] P8-01 Biome definitions: swamp, savanna, snow, ruins (tiles, obstacles, surface noise multipliers, palettes)
- [ ] P8-02 Level 2 config + swamp mechanics (slow terrain, poison water DoT)
- [ ] P8-03 Level 3 config + savanna (open sightlines, stampede event)
- [ ] P8-04 Level 4 config + snow (cold meter, campfires, blizzard fog event)
- [ ] P8-05 Level 5 config + ruins (vertical routes, puzzle traps, decoys)
- [ ] P8-06 Authored set pieces/landmarks per biome placed by generator
- [ ] P8-07 Stone guard types: hidden, guarded (den/camp), trapped (environmental puzzle)
- [ ] P8-08 Decoy stones with ambush
- [ ] P8-09 Clue variants by vagueness and biome flavor text
- [ ] P8-10 Events: Stampede, Monsoon, Drums, Stone Shift
- [ ] P8-11 Level progression flow (LevelComplete → next)
- [ ] P8-12 Solvability property test for all 5 level configs

**Exit criteria**
- [ ] Each level has one clearly new mechanic and feels distinct
- [ ] Difficulty curve validated by playtest (L1 easy → L5 hard but fair)

---

## Phase 9: Lions + bosses (4 h)

- [ ] P9-01 Lion: stalk at fog edge, charge (committed line, telegraph), winded recovery
- [ ] P9-02 Lion ambush from cover; interplay with grass cover tiles
- [ ] P9-03 Boss framework: phase FSM, telegraphed attack patterns, arena hazards, health bar
- [ ] P9-04 Alpha Lion (L3), Hunter Chief (optional L4), Guardian (L5)
- [ ] P9-05 Boss guards a stone; arena trap interactions (lure into traps)
- [ ] P9-06 Boss intro stinger and narrator lines
- [ ] P9-07 Balance pass on boss HP/damage using the baseline table

**Exit criteria**
- [ ] Each boss is beatable with ≥ 2 distinct approaches
- [ ] Lion charge is learnable and fair (playtest confirms)

---

## Phase 10: Avatars, perks, progression, save (4 h). Milestone M3

- [ ] P10-01 `avatars.ts` + Avatar select scene (Scout, Brute, Hunter; Ghost unlock)
- [ ] P10-02 Perk system: 1-of-3 draft after each level, stackable modifiers
- [ ] P10-03 Perk pool (≥ 12 perks) with stat modifier pipeline
- [ ] P10-04 Meta progression: unlocks, codex entries, best times
- [ ] P10-05 `SaveSystem`: versioned localStorage + migrations + error handling
- [ ] P10-06 Run summary screen (stats, perks taken, cause of death)
- [ ] P10-07 Daily seed mode (date → seed) scaffold
- [ ] P10-08 Tests: save/load roundtrip; migration; perk modifier stacking

**Exit criteria (M3)**
- [ ] A full 5-level run is completable
- [ ] Avatars play meaningfully different
- [ ] Refresh doesn't lose meta-progression

---

## Phase 11: Audio, art, lighting pass (6 h)

- [ ] P11-01 `AudioSystem` with buses (music/sfx/ambience/narrator) + volume settings
- [ ] P11-02 Positional SFX (distance attenuation, pan) for enemies and events
- [ ] P11-03 Biome ambience loops; dynamic music layers (calm / alert / chase)
- [ ] P11-04 Heartbeat and breathing driven by threat distance and stamina
- [ ] P11-05 Narrator stings and (optional) voice
- [ ] P11-06 Art pass: sprite/silhouette set, tile palettes, UI skin
- [ ] P11-07 `LightingSystem`: torches, campfires, day/night tint feeding fog erase pass
- [ ] P11-08 Particles: footsteps, hits, fog wisps, rain, snow
- [ ] P11-09 Asset atlas and preload/lazy-load per level

**Exit criteria**
- [ ] Mute the screen and you can still tell where enemies are (audio-only test)
- [ ] Palette keeps threats readable in fog (colorblind check)

---

## Phase 12: Settings, accessibility, balance (3 h)

- [ ] P12-01 Settings: volume sliders, remappable controls, UI scale
- [ ] P12-02 Accessibility: subtitles with direction, shape-coded threat indicators, screen shake/vignette toggles, fog darkness floor
- [ ] P12-03 Optional aim assist
- [ ] P12-04 Balance sweep: tune all numbers via config, track in a changelog
- [ ] P12-05 Difficulty modes scaffold (Wanderer / Lost / Forsaken)
- [ ] P12-06 Onboarding: contextual first-time hints (fog, noise, stamina) that disable after use

---

## Phase 13: QA, performance, release (3 h). Milestone M4

- [ ] P13-01 Performance profile on a low-end laptop; hit budgets in [architecture §14](./architecture.md)
- [ ] P13-02 Memory leak check (play 3 full runs, watch heap)
- [ ] P13-03 Cross-browser test (Chrome, Firefox, Safari, Edge)
- [ ] P13-04 Playwright smoke test in CI
- [ ] P13-05 Error boundary + friendly fatal error screen
- [ ] P13-06 Production build, asset compression, cache headers
- [ ] P13-07 Deploy to production URL; add share image/OG tags
- [ ] P13-08 Release checklist (below) signed off

**Release checklist**
- [ ] No console errors in a full run
- [ ] 60 FPS on target hardware
- [ ] All five levels solvable for 500 seeds each
- [ ] Settings persist
- [ ] README and docs match actual controls and features

---

## Phase 14: Post-launch backlog (M5)

- [ ] Gamepad support with aim assist tuning
- [ ] Difficulty modes finalized (Forsaken permadeath)
- [ ] Daily seed leaderboard (local first, optional backend later)
- [ ] More avatars, biomes, bosses
- [ ] Mid-level save/resume
- [ ] Mobile/touch exploration
- [ ] Mod-friendly level config loader (JSON import)
- [ ] Steam/desktop wrapper via Tauri or Electron

---

## Today's slice (suggested timeline)

| Time | Phases | Deliverable |
|---|---|---|
| Hour 0-0.5 | P0 | Boots, CI green |
| Hour 0.5-2 | P1 | Walk around chunked world |
| Hour 2-3.5 | P2 | Fog + stamina feel right |
| Hour 3.5-5.5 | P3 | Wolves hunt with senses |
| Hour 5.5-7.5 | P4 | Level 1 winnable and losable |

**Cut order if short on time:** hunters/lions → director/narrator → consumables → multiple weapons → clues polish. Wolves + fog + stamina + stones + melee is the irreducible core.

## Definition of Done (per task)

- [ ] Typechecks, lints, tests pass
- [ ] Behavior driven by config where applicable (no magic numbers in logic)
- [ ] Emits/handles events via the bus; no cross-system imports that skip it
- [ ] Debug visualization exists for new AI/systems
- [ ] Docs updated if public behavior/config changed

## Playtest log template

```
Date:
Build/seed:
Level:
Time to complete / died at:
Felt good:
Felt bad:
Confusing:
Top death cause:
Tweak to try next:
```