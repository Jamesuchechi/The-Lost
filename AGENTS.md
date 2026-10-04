# agent.md: Build Contract for The Lost

You are building **The Lost**, a top-down, open-world survival-escape browser game. This file is binding. Where it conflicts with your own preferences, defaults, or "better ideas", this file wins. Read it fully before writing any code, and re-read the relevant sections before starting each phase.

---

## 0. Precedence of sources

When documents disagree, resolve in this order (highest first):

1. `agent.md` (this file)
2. `product.md` (what the game is, numbers, rules)
3. `architecture.md` (how it is built)
4. `todo.md` (order of work, task IDs, exit criteria)
5. `documentation.md` (conventions and how-tos)
6. `README.md`
7. Concept images in `docs/concept/` (visual truth for look and feel; see §6)

If two documents at the same level conflict, **stop and ask** (§9). Never silently pick one.

## 1. Startup checklist (do this first, every session)

- [ ] Read `agent.md`, `product.md`, `architecture.md`, `todo.md`, `documentation.md`
- [ ] Look at every image in `docs/concept/`
- [ ] Run `git status` and `git log -10` to see where work stopped
- [ ] Open `todo.md`, find the first unchecked task in the **current phase**
- [ ] State, in one short paragraph: current phase, next task ID, and what you will do. Then begin.

Do not start by scaffolding "your own" structure. The structure is defined in `architecture.md` §4.

## 2. Locked decisions (non-negotiable)

You may not change, replace, or "improve" any of these without explicit written approval from the human.

| Area | Locked decision |
|---|---|
| Language | TypeScript, `strict: true`, `noUncheckedIndexedAccess: true`. No `any`. |
| Engine | Three.js (WebGL rendering, 3D physics / collision grid) |
| Build | Vite. Static output, no server. |
| Noise | `simplex-noise` |
| Tests | Vitest |
| Hosting model | Static site. No backend, no accounts, no network calls during play. |
| Persistence | `localStorage`, versioned, wrapped in try/catch |
| Perspective | Top-down 3D (overhead camera with depth, realistic 3D lighting, volumetric fog, realistic models) |
| Controls | WASD move, mouse aim, Shift sprint, Ctrl/C crouch, Space dodge, LMB light/hold heavy, RMB ranged, E interact, 1-4 hotbar, Q consumable, Tab map, F3 debug, Esc pause |
| Simulation | Fixed timestep 60 Hz with accumulator; render decoupled |
| Communication | Typed `EventBus` between systems (no direct system-to-system calls across layers) |
| World generation | Pure function `generateLevel(config, seed)`; no rendering imports; deterministic |
| Randomness | Named seeded `Rng` streams only (`world`, `placement`, `loot`, `ai`, `director`) |
| Content | Data-driven: levels, enemies, weapons, events, perks, avatars, narrator lines live in `src/config/` |
| Fog | Gameplay, not decoration: entities outside live vision are hidden and untargetable (product §4.1, architecture §8) |
| Folder layout | Exactly as in `architecture.md` §4 |

## 3. Absolute prohibitions

You must **never**:

1. Use `Math.random()` anywhere in gameplay, AI, generation, loot, or events.
2. Add a dependency not listed in the stack above without approval. (Small dev-only tooling like a type package is fine; say so in your report.)
3. Add a backend, database, analytics, telemetry, or network request.
4. Hardcode balance numbers inside logic. Numbers come from `src/config/` or `constants.ts`, and initial values come from `product.md` §6.
5. Make systems import each other across the simulation/presentation boundary. Use the event bus.
6. Put Three.js/rendering imports into `core/`, `world/` generation logic, or pure `ai/` functions.
7. Make enemies cheat: no perfect knowledge of the player's position. Enemies act only on sight, hearing, and scent (product §4.3).
8. Make fog purely visual. If an entity is hidden by fog it must also be non-targetable and excluded from HUD indicators.
9. Add features, enemies, weapons, levels, mechanics, or UI that are not in the docs. Ideas go to `docs/IDEAS.md` (§9), not into code.
10. Skip ahead to a later phase, or build "just the foundation" for future phases beyond what the current tasks require.
11. Use copyrighted or third-party art, audio, fonts, or code you cannot attribute. Placeholder art is drawn from code shapes (§6).
12. Disable lint, typecheck, or tests to get green. Never use `// @ts-ignore` or `eslint-disable` without a one-line justification and a note in your report.
13. Rewrite or reformat unrelated files. Keep diffs scoped to the task.
14. Claim something works without running it. "It should work" is not acceptable; run it and report the result.

## 4. Work protocol

### 4.1 One phase at a time, with human gates

- Work only inside the **current phase** in `todo.md`.
- Complete tasks in ID order unless a dependency forces otherwise (say so if you reorder).
- When all tasks and **exit criteria** of a phase pass, **stop**. Post the phase report (§8) and wait for the human to reply `approved phase N`. Only then begin the next phase.
- If a task cannot be completed as specified, do not improvise a different design. Follow §9.

### 4.2 Task loop

For each task ID:

1. Restate the task and the acceptance criteria in one or two lines.
2. Check the relevant sections of `product.md` and `architecture.md`.
3. Write or update tests first for pure logic where the task allows.
4. Implement the minimum that satisfies the task and the docs.
5. Run `npm run typecheck && npm run lint && npm test && npm run build`.
6. Verify in the browser (`npm run dev`) with `?debug=1`. Check behavior, not just compilation.
7. Tick the checkbox in `todo.md` (`[x]`) and commit.

### 4.3 Commits

Conventional Commits with the task ID:

```
feat(P3-05): perception system with sight cone and hearing
fix(P4-14): carve corridor when stone unreachable
test(P1-11): worldgen determinism
docs: update todo checkboxes
```

One logical change per commit. Never commit failing typecheck/lint/tests.

### 4.4 Scope control

- Do the task described. Nothing more, nothing less.
- If you notice a bug or improvement outside the task, add it to `docs/IDEAS.md` or `docs/BUGS.md` with a line each, and continue.
- Refactors are allowed only when required by the current task, and must be mentioned in the report.

## 5. Gameplay contract (must match exactly)

These are the rules the implementation must honor. Values live in config; initial values are in `product.md` §6 and the tables below.

**Core loop:** explore in fog, follow clues, find 3 stones (each with a distinct guard type), survive, unlock the exit gate, endure the final chase, complete the level, choose a perk, continue.

**Vision:** live vision radius (default 220 px) plus persistent explored memory. Modifiers per product §4.1. Entities beyond live vision are hidden. Light sources (hunter torch) may remain visible through fog.

**Stamina:** single pool of 100. Costs and regen per product §4.2 (sprint 18/s, dodge 25, light 12, heavy 28; regen 14/s after 1.0 s; exhaustion 2.5 s with breath noise radius 180).

**Noise radii (px):** crouch 40, walk 140, sprint 280, melee hit 320, bow shot 200, taking damage 240, thrown stone 260, breath 180, campfire 120. Surface multipliers per product §4.3.

**Enemy perception:** sight cone with LOS, hearing from noise events, scent for wolves. Awareness is a 0..1 meter per enemy. Thresholds: under 0.25 unaware, 0.25 to 0.6 investigate, 0.6 and above aware. Losing the player moves to `Search`, never straight to `Idle`.

**Enemy roster and introduction:** wolf (L1), hunter (L2), lion (L3), bosses (L3 and L5). Do not introduce earlier.

**Combat:** real-time, mouse aim. Light and heavy attacks, ranged, dodge with 0.25 s i-frames, backstab (x3, quiet) on unaware targets from the rear arc, stagger, weapon durability. Fighting is always possible and always costly (stamina plus noise).

**The Game (director):** intensity-based event director with a seeded stream, event pool per level, narrator lines per event. Events must be reversible if they have a duration.

**Levels:** exactly the five in product §5, defined as `LevelConfig` data. Level 1 must be fully config-driven before Level 2 is begun.

**Win / lose:** win by collecting 3 stones and reaching the unlocked gate. Lose at 0 health. Death screen shows cause of death, time, stones found.

**Solvability:** every stone, clue, and the exit must be reachable from spawn on every seed. This is enforced by a property test over at least 500 seeds per level.

## 6. Visual contract

The concept images in `docs/concept/` are the **source of truth for look and feel**. Expected files (the human will add them):

- `docs/concept/gameplay-frame.png`: the foggy forest frame with HUD
- `docs/concept/character-sheet.png`: Survivor, Hunter, Wolf, Lion, plus palette

### 6.1 What must match

- **Perspective:** strictly top-down. Characters are seen from above with shoulders, head, and held items visible.
- **Fog look:** small clear circle of live vision, soft stepped falloff, darker outside, a lighter trail for explored memory.
- **HUD layout:** health and stamina bars top-left; narrator line top-center with a small event tag beneath; stone counter top-right (three diamonds); hotbar bottom-center (four slots, slot 1 highlighted); minimap bottom-right showing explored area only, no enemy markers.
- **Threat readability:** wolves show a vision cone and an awareness marker (`!` red for aware, `?` amber for suspicious) with a small meter. The player's noise radius ring is toggleable.
- **Characters:**
  - *Survivor:* muted green jacket, red scarf, dark hair, tan backpack with bedroll, spear, pouch at hip.
  - *Hunter:* hooded dark-olive cloak, quiver on back, bow in one hand, lit torch in the other (orange glow visible through fog).
  - *Wolf:* gray fur with darker back stripe, pointed ears, bushy tail, amber eyes.
  - *Lion:* tan body, large dark-brown mane ring, tufted tail.

### 6.2 Palette (use these tokens; define them in `src/config/palette.ts`)

| Token | Hex |
|---|---|
| fog | `#0a100c` |
| ground | `#2d3f31` |
| canopy | `#1d3626` |
| skin | `#d2a47c` |
| jacket | `#4f6b57` |
| scarf | `#a8523a` |
| wolfFur | `#8c9091` |
| lion | `#c9a15b` |
| torch | `#ffae4d` |
| danger | `#e0584a` |
| clueGold | `#d6b25e` |

Do not introduce additional hues without approval. Tints and shades of these are fine.

### 6.3 Art & 3D Model production rules

- **Full 3D Realism**: Build high-fidelity 3D procedural meshes, realistic PBR materials, detailed foliage/tree geometries, realistic lighting (shadow maps, volumetric fog, ambient occlusion), and anatomically proportioned models (Survivor, Wolf, Hunter, Lion).
- Geometry and procedural textures are generated or instantiated cleanly at load time and batched/instanced for high performance (60 FPS budget).
- Realistic color palettes and PBR surface properties (roughness, metalness, normal maps).
- Dynamic 3D lighting: torch light casts realistic moving shadows through trees and mist.

### 6.4 Visual verification

At the end of every phase that changes visuals, take a screenshot of the running game at 1280x720 with `?seed=concept1&debug=0`, save it to `docs/progress/phase-N.png`, and compare it against `docs/concept/gameplay-frame.png`. In your report, list **every visible difference** and say whether it is intended for this phase or a defect.

## 7. Quality gates

All must pass before a task is considered done:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Additional requirements:

- Pure logic (RNG, worldgen, perception math, stamina, director, pathfinding, storage) has unit tests. New pure logic without tests is incomplete.
- Worldgen determinism snapshot test for each level config.
- Solvability property test (500 seeds per level) from Phase 4 onward.
- Performance budgets from `architecture.md` §14 are checked at the end of Phases 3, 7, and 13 with the debug overlay and Chrome Performance tab. Report numbers.
- No console errors or warnings during a full playthrough.
- No `TODO`, `FIXME`, or commented-out code left in a completed task unless it references a task ID in `todo.md`.

## 8. Reporting format

After each task, a one-line status is enough. After each **phase**, post this report and stop:

```
## Phase N report
Status: complete | blocked
Tasks done: P?-?? … (all IDs)
Exit criteria: each criterion with pass/fail and how you verified it
Files added/changed: list (grouped by folder)
Tests: count added, total passing
Perf: frame time, AI ms, perception ms, entity counts (if applicable)
Visual diff vs concept: list of differences, intended or defect
Deviations from docs: none | list (each with justification)
Open questions: none | list
Next: Phase N+1 (waiting for "approved phase N")
```

Be factual. Do not pad. Do not claim success on anything you did not run.

## 9. Ambiguity and deviation protocol

If something is unclear, contradictory, infeasible, or you believe the design is wrong:

1. **Stop work on that point.** Do not guess and do not build a workaround.
2. Append an entry to `docs/DECISIONS.md`:

```
### D-<number>: <short title>
Date: <date>
Context: what you were doing (task ID)
Problem: what is unclear or conflicting, citing doc sections
Options: A) … B) … (max 3)
Recommendation: your pick and why
Status: awaiting human
```

3. Ask the human directly, referencing the D-number.
4. Continue with other tasks in the phase that are unaffected. If everything is blocked, stop.

Ideas and nice-to-haves go in `docs/IDEAS.md` as one line each. Bugs outside the current task go in `docs/BUGS.md`. Neither authorizes any code change.

## 10. Definition of done (per task)

- [ ] Behavior matches `product.md` and `architecture.md`
- [ ] Numbers are in config; no magic numbers in logic
- [ ] Systems communicate via the event bus where required
- [ ] Debug visualization exists for new AI or systems
- [ ] Tests added or updated; all gates green
- [ ] Verified in the running game, not just in tests
- [ ] `todo.md` checkbox ticked; commit made with task ID
- [ ] Docs updated if any public behavior or config changed

## 11. Phase map (quick reference)

| Phase | Name | Gate |
|---|---|---|
| 0 | Project setup | CI green, blank canvas |
| 1 | Player, camera, world | Chunked 256x256 world at 60 FPS, deterministic seed |
| 2 | Fog of war + stamina | Live vision + explored memory, winded state |
| 3 | Wolves, perception, noise | Sense-driven wolves under AI budget |
| 4 | Combat, stones, win/lose | Level 1 winnable and losable (M1) |
| 5 | Level config + Director + Narrator | Config-driven difficulty, events firing |
| 6 | Hunters, ranged, traps | Multiple valid tactics |
| 7 | HUD, map, feedback | Readable deaths (M2) |
| 8 | Levels 2 to 5 | Distinct mechanics per level |
| 9 | Lions + bosses | Fair, learnable encounters |
| 10 | Avatars, perks, save | Full 5-level run (M3) |
| 11 | Audio, art, lighting | Audio-only threat awareness |
| 12 | Settings, accessibility, balance | Options persist |
| 13 | QA, performance, release | Release checklist (M4) |

## 12. Kickoff prompt (paste this to start the agent)

> Read `agent.md`, `product.md`, `architecture.md`, `todo.md`, and `documentation.md` in full, and view every image in `docs/concept/`. Then follow the startup checklist in `agent.md` §1. Begin at Phase 0 and work strictly in task ID order. Do not proceed past a phase until I reply `approved phase N`. If anything is ambiguous or conflicts between documents, log it in `docs/DECISIONS.md` and ask me instead of guessing.

## 13. Final rule

When in doubt, do less and ask. A paused build is cheap; a build that drifts from the plan is expensive. The plan is the product.