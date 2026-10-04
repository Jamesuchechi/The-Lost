# The Lost: Product Specification

> Version 0.1 · Status: Draft · Owner: James Uchechi

## 1. Vision

**The Lost** is a top-down, open-world survival-escape game. You are pulled into a cursed board game ("the Game") and dropped into a foggy wilderness. To escape, you must find **three ancient stones** and reach the exit gate, while predators and hunters track you through the fog, your stamina drains, and the Game itself keeps escalating.

**One-line pitch:** *Jumanji meets Don't Starve, played top-down, where fog is the main mechanic and the Game is the villain.*

### Design pillars

| # | Pillar | What it means in practice |
|---|---|---|
| 1 | **Fog is fear** | Limited vision creates dread. Information (what you've seen, heard, tracked) is the real currency. |
| 2 | **Fight is a last resort, not a plan** | Combat exists and is satisfying, but it is loud, costs stamina, and attracts more enemies. |
| 3 | **The Game is alive** | A director rolls events, a narrator taunts you, and the rules shift per level. You never settle. |
| 4 | **Every run is a story** | Seeded procedural worlds, short runs, and emergent near-death moments worth retelling. |
| 5 | **Readable at a glance** | Despite fog, the player must always understand why they died and what to try next. |

### Non-goals (v1)

- No multiplayer or co-op
- No crafting trees beyond a small set of consumables and repairs
- No story cutscenes (the narrator carries all story)
- No mobile touch controls (desktop browser first)
- No user accounts or backend (all local)

## 2. Target audience

- **Primary:** Players of short-session roguelites and survival games (Hades, Vampire Survivors, Don't Starve, Darkwood) who like tension over grind.
- **Secondary:** Casual browser players who want a 10-15 minute run with no install.
- **Session length:** 10-15 min per level, 40-60 min for a full 5-level run.
- **Platform:** Desktop browsers (Chrome, Firefox, Safari, Edge). Keyboard + mouse. Gamepad is a later phase.

## 3. Core loop

```
Spawn → Explore (fog) → Find clue → Locate stone → Survive the retrieval
   ↑                                                         │
   └────────────── repeat ×3 ←──────────────────────────────┘
                                │
                    Exit gate unlocks → Final chase → Level complete → Perk → Next level
```

### Moment-to-moment loop (10-30 seconds)

1. Move carefully through fog, listening and watching for cues.
2. Detect a threat (growl, rustling, torch glow, footprints).
3. Decide: **avoid** (sneak, detour), **distract** (throw a stone, bait), **ambush** (trap, backstab), or **fight**.
4. Resolve, recover stamina and health, continue.

### Level loop (10-15 minutes)

1. Spawn at a random edge or camp. Narrator intro.
2. Gather basic supplies near spawn (stick, bandage).
3. Follow clues to Stone 1, then 2, then 3. Each stone has a unique guard challenge.
4. Gate opens. Final chase (60-90 seconds) while the gate charges.
5. Level complete → pick one perk → next board.

## 4. Game systems

### 4.1 Fog of war

Two layers:

- **Live vision:** a radius around the player. Anything outside it is *gameplay-hidden*, not just visually dark. Enemies outside live vision are not rendered and cannot be targeted.
- **Explored memory:** tiles you have seen stay dimly visible so you can navigate. Entities do **not** persist in memory (you only see terrain and static landmarks).

Vision radius modifiers:

| Factor | Modifier |
|---|---|
| Base | 100% |
| Night | -35% |
| Heavy fog surge event | -40% (temporary) |
| Torch equipped | +30%, but you become visible from farther away |
| High ground / watchtower | +50% |
| Dense forest | -15% |
| Rain | -10% |

### 4.2 Stamina

Single shared pool used for sprint, dodge, and attacks.

| Action | Cost | Notes |
|---|---|---|
| Sprint | 18 / sec | Cannot sprint below 10 |
| Dodge roll | 25 | 0.25s i-frames |
| Light attack | 12 | |
| Heavy attack | 28 | Staggers most enemies |
| Bow draw (hold) | 6 / sec | Reduced with a steady stance |
| Climb / swim | 10 / sec | Biome dependent |

- **Regen:** 14/sec after a 1.0s delay. Doubles when crouched and still.
- **Exhaustion:** hitting 0 triggers 2.5s of "winded": slow movement, loud breathing (noise radius 180).
- **Environmental modifiers:** cold (-30% regen), swamp (+50% move cost), rain (-10% regen), campfire proximity (+25% regen).

### 4.3 Senses and noise

Enemies perceive the player through three channels. This is the heart of the stealth-or-fight decision.

1. **Sight:** vision cone with range, reduced by fog density, blocked by obstacles. Crouching in cover reduces detection by 60%.
2. **Hearing:** every action emits noise with a radius. Enemies within the radius investigate the source.
3. **Scent (wolves only):** the player leaves scent nodes. Wolves follow the gradient. Water tiles and certain herbs break the trail.

Noise radii (px, baseline):

| Action | Radius |
|---|---|
| Crouch-walk | 40 |
| Walk | 140 |
| Sprint | 280 |
| Melee hit | 320 |
| Bow shot | 200 |
| Taking damage | 240 |
| Thrown stone impact | 260 (distraction) |
| Exhausted breathing | 180 |
| Campfire (continuous) | 120 |

Surface multipliers: dry leaves ×1.4, grass ×1.0, mud ×0.7, shallow water ×1.2, snow ×0.8.

### 4.4 Combat

Combat is real-time, top-down, with **mouse aim**.

- **Light attack (LMB):** fast, short arc, low stamina.
- **Heavy attack (hold LMB):** slower, wider, staggers.
- **Ranged (RMB or weapon slot):** bow or sling, limited ammo, retrievable arrows.
- **Dodge (Space):** short roll with i-frames, direction of movement.
- **Backstab:** attacking an unaware enemy from behind deals ×3 damage and is quiet (noise radius 60).
- **Stagger:** enough damage or a heavy hit interrupts enemy actions for 0.6s.

Weapons are scavenged, have durability, and come in tiers:

| Class | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| Melee | Sharpened stick | Spear | Machete |
| Ranged | Sling | Short bow | Longbow |
| Utility | Throwing stone | Snare | Pit trap / bait |

Health recovers only via consumables (bandage, herb poultice) or resting at campfires. Using a consumable takes 1.5 seconds and is interruptible.

### 4.5 Enemies

| Enemy | Role | Counter | Introduced |
|---|---|---|---|
| **Wolf** | Pack hunter, flanking, tracks scent | Chokepoints, water crossing, fire | L1 |
| **Hunter** | Ranged human, vision cone, sets traps, carries torch | Break line of sight, use fog, close in | L2 |
| **Lion** | Stalker, ambush, burst charge, low stamina | Dodge the charge, counter-attack while it tires | L3 |
| **Boss: Alpha / Chief / Guardian** | Gate to the final stone of selected levels | Pattern learning, arena traps | L3, L5 |

Enemy AI states: `Idle → Patrol → Investigate → Stalk → Chase → Search → Return`. The **Search** state, where an enemy knows you are near but has lost you, is the main tension generator.

### 4.6 The Game (director, events, narrator)

The Game is a **director** that manages pacing, in the style of tension-budget systems.

- Maintains an `intensity` value (0 to 1). Exposure to threats raises it. Quiet time lowers it.
- When intensity is low and a cooldown has passed, it rolls an **event** from the level's pool.
- Each event has a narrator line, an audio sting, and a UI flash.

Event catalog (initial):

| Event | Effect | Duration |
|---|---|---|
| Fog Surge | Vision radius -40% | 45s |
| Pack Release | Spawns a wolf pack at the fog edge, aware of the player | until resolved |
| Stampede | Herd crosses the map in a line; lethal if caught | 20s |
| Monsoon | Rain: noise -20%, stamina regen -10%, vision -10% | 60s |
| Stone Shift | A found-but-uncollected stone's clue changes | instant |
| Drums | Hunters become aware of general player area | 30s |
| Nightfall | Forces night early | rest of level |

The narrator speaks as text with a sound sting. Lines are data-driven per event and per level, with variants to avoid repetition.

### 4.7 Stones and clues

- Each level has **3 stones**, each guarded by a distinct challenge:
  - **Hidden:** in a fog-heavy ruin, found by following clues.
  - **Guarded:** a den or camp with enemies, requires stealth or fight.
  - **Trapped:** environmental puzzle (collapsing bridge, tide pool, trap floor).
- **Clues** (totems, cairns, journals, carved trees) point toward the next stone with a direction hint and distance flavor ("a day's walk beyond the dead oak").
- **Decoys:** higher levels place fake stone sites to waste time and expose the player.
- **Solvability:** world generation guarantees every stone and the exit are reachable.

### 4.8 Progression

- **Within a run:** after each level, choose **1 of 3 perks**, e.g. +15% max stamina, quieter steps, larger vision radius, bow ammo +4, backstab ×4.
- **Across runs (light meta):** unlocks avatars, starting loadout options, and a codex of enemies. No stat power creep that trivializes the game.

### 4.9 Avatars (Jumanji-style)

| Avatar | Strength | Weakness | Starts with |
|---|---|---|---|
| **Scout** | +15% move speed, +10% vision | -20% max health | Sling |
| **Brute** | +40% max health, heavy attack stagger | -15% vision radius, louder steps | Sharpened stick |
| **Hunter** | Bow proficiency, trap discount | -15% max stamina | Short bow, 6 arrows |
| **Ghost** (unlock) | Quiet steps, backstab ×4 | -30% max health | Throwing stones |

## 5. Levels

Each level is a "board" with a theme, one new mechanic, and a higher baseline of threat.

| # | Name | Biome | New mechanic | Enemies | Boss |
|---|---|---|---|---|---|
| 1 | The Veiled Woods | Forest | Tutorial: fog, stamina, stones | Wolves | None |
| 2 | The Drowned Marsh | Swamp | Slow terrain, poison water, trap stones | Wolves, hunters | None |
| 3 | The Burning Plain | Savanna | Open sightlines, stampede events | Lions, wolves, hunters | Alpha Lion |
| 4 | The Frozen Ridge | Snow | Cold meter, campfire reliance, blizzard fog | Wolf packs, hunters | None |
| 5 | The Sunken Citadel | Ruins | Vertical routes, puzzle traps, decoys | All | Guardian |

### Difficulty model

All difficulty is config-driven. Levers per level:

- Map size (128×128 to 256×256 tiles)
- Fog density and base vision radius
- Enemy count, speed multiplier, detection radius, aggression
- Stone distance from spawn, decoy count, clue vagueness
- Resource scarcity (weapon, healing, ammo drop rates)
- Event frequency and pool
- Time pressure (final chase length)

Difficulty modes (v1.1): **Wanderer** (forgiving), **Lost** (default), **Forsaken** (permadeath, no checkpoint, faster events).

## 6. Balance baseline

Starting values for tuning. Everything lives in config.

| Stat | Value |
|---|---|
| Player max health | 100 |
| Player max stamina | 100 |
| Walk / crouch / sprint speed (px/s) | 110 / 60 / 180 |
| Dodge distance | 90 px |
| Wolf: HP / chase speed / damage | 40 / 150 / 10 per bite |
| Hunter: HP / speed / arrow damage / range | 60 / 120 / 18 / 360 px |
| Lion: HP / stalk / charge speed / charge duration | 120 / 90 / 260 / 3.0s |
| Boss HP | 400 to 600 |
| Tile size / chunk size | 32 px / 32×32 tiles |
| Default live vision radius | 220 px |

**Intended feel check:** sprinting from a wolf for a full stamina bar (about 5.5 s) should gain ~165 px of separation. This is enough to break line of sight in cover, but not enough to outrun a pack across open ground.

## 7. UX and HUD

- **HUD (minimal):** health bar (bottom left), stamina bar (below it, fades when full), hotbar (bottom center), stone counter (top right), narrator text (top center).
- **Minimap / map (Tab):** shows only explored memory, player marker, discovered clues, and stone sites once found. No enemy markers.
- **Threat feedback:** screen-edge vignette pulse and directional tick when an enemy is aware of you. Heartbeat audio scales with the nearest aware enemy.
- **Noise ripple:** a faint expanding ring shows your noise radius so players learn the rules.
- **Death screen:** shows cause of death, a short replay of the last 5 seconds' enemy positions on the map, and run stats.

### Controls (default)

| Input | Action |
|---|---|
| W A S D | Move |
| Mouse | Aim |
| Shift | Sprint |
| Ctrl / C | Crouch |
| Space | Dodge |
| LMB | Light attack (hold for heavy) |
| RMB | Ranged / alternate |
| E | Interact / pick up |
| 1-4 | Hotbar |
| Q | Use consumable |
| Tab | Map |
| Esc | Pause |

All bindings are remappable.

## 8. Audio and art direction

- **Art:** minimalist 2D with strong lighting. Flat color biomes, silhouetted objects, dynamic light and shadow, soft fog gradients. Fast to produce and reads well in fog.
- **Palette:** desaturated greens and teals, warm light for torches and fire, red reserved for danger and damage.
- **Audio:** layered ambience per biome, music that thins out in fog and swells during chases, directional enemy sounds, narrator stings. All audio panned and attenuated by distance.

## 9. Accessibility

- Remappable controls
- Subtitles for all narrator and sound cues (direction indicators for important sounds)
- Colorblind-safe threat indicators (shape and pattern, not only color)
- Toggles: screen shake, vignette pulses, fog darkness floor
- Optional aim assist
- Adjustable UI scale

## 10. Scope and milestones

| Milestone | Contents |
|---|---|
| **M1: Prototype** | Level 1, fog, stamina, wolf, melee, 3 stones, win/lose |
| **M2: Vertical slice** | Director + narrator, hunters, ranged, Level 2, HUD polish |
| **M3: Content** | Levels 3-5, lions, bosses, traps, avatars, perks |
| **M4: Release** | Audio, art pass, balance, settings, save, deploy |
| **M5: Post-launch** | Difficulty modes, daily seed, gamepad, leaderboards (local) |

## 11. Success metrics (playtest)

- 70% of new players complete Level 1 within 3 attempts
- Median Level 1 duration: 8 to 12 minutes
- Death causes are spread across at least 3 sources (no single dominant killer)
- Players use at least 2 distinct tactics (sneak, trap, fight) per level on average
- Stable 60 FPS on a mid-range laptop with integrated graphics

## 12. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Fog makes the game unreadable | High | Strong audio and feedback cues, explored memory, playtest early |
| Combat overshadows stealth | High | Noise cost, scarce weapons, durability, enemy reinforcements |
| AI is cheap or exploitable | Med | Search state, awareness meter, scent tracking, playtest edge cases |
| Procedural maps feel samey | Med | Per-biome landmarks, authored set pieces placed by generator |
| Scope creep | High | Strict milestones, data-driven content, defer bosses and avatars until M3 |
| Browser performance | Med | Chunk streaming, pooling, AI budgeting, profile each phase |

## 13. Glossary

- **Board:** a level.
- **The Game:** the antagonist system (director + narrator).
- **Stone:** collectible required to unlock the exit.
- **Clue:** in-world hint pointing to the next stone.
- **Live vision:** current line-of-sight radius.
- **Explored memory:** terrain previously seen.
- **Intensity:** the director's pacing value.