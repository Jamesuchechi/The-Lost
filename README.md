# The Lost

> *You were pulled into the Game. The fog is the first thing it takes from you.*

**The Lost** is a top-down, open-world survival-escape game for the browser. You are stranded in a foggy wilderness that is larger than your screen. Find **three ancient stones**, reach the exit gate, and survive the wolves, hunters, and lions that stalk you through the mist, all while managing stamina and outwitting a Game that never stops escalating.

Think *Jumanji* meets *Don't Starve*, seen from above, where fog is the mechanic and the Game is the villain.

![status](https://img.shields.io/badge/status-in%20development-orange)
![stack](https://img.shields.io/badge/stack-TypeScript%20%7C%20Three.js%20%7C%20Vite-blue)

---

## Features

- **Realistic 3D Top-Down Immersion.** Realistic forest environment, 3D foliage, dynamic lighting, real-time shadow casting, and volumetric fog.
- **Fog of war you can't ignore.** Limited live vision plus a remembered map. Enemies outside your vision are truly hidden.
- **Senses-based enemy AI.** Predators see, hear, and smell you. Sprint and they hear you, crouch and they might not. Wolves track your scent.
- **Stamina that matters.** One pool for sprinting, dodging, and fighting. Run dry and you're loud, slow, and prey.
- **Fight, sneak, or trap.** Melee, bow and sling, backstabs, snares, and distractions. Combat is possible, never free.
- **The Game fights back.** A director fires events (fog surges, pack releases, stampedes) and a narrator taunts you.
- **Five escalating boards.** Forest, swamp, savanna, frozen ridge, and sunken citadel, each with its own rules and boss.
- **Procedural, seeded worlds.** Share a seed, replay a run, or take on the daily seed.
- **Roguelite progression.** Pick a perk after every board, unlock new avatars.

## Status

Early development. Currently targeting **M1: Prototype** (Level 1 playable end to end). See [todo.md](./todo.md) for the full roadmap.

## Quick start

**Requirements:** Node.js 20+

```bash
git clone <repo-url> the-lost
cd the-lost
npm install
npm run dev
```

Then open the local URL printed in your terminal (default `http://localhost:5173`).

## Controls

| Input | Action |
|---|---|
| **W A S D** | Move |
| **Mouse** | Aim |
| **Shift** | Sprint |
| **Ctrl / C** | Crouch |
| **Space** | Dodge roll |
| **Left click** (hold) | Light attack (hold for heavy) |
| **Right click** | Ranged / alternate |
| **E** | Interact / pick up |
| **1-4** | Hotbar |
| **Q** | Use consumable |
| **Tab** | Map |
| **F3** | Debug overlay |
| **Esc** | Pause |

## URL parameters

| Param | Example | Effect |
|---|---|---|
| `seed` | `?seed=abc123` | Fixed world seed |
| `level` | `?level=3` | Start at a level |
| `debug` | `?debug=1` | Debug overlay |
| `noevents` | `?noevents=1` | Disable director events |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |

## Tech stack

- **TypeScript** (strict)
- **Three.js** (WebGL 3D rendering, lighting, materials, cameras)
- **Vite** for dev and build
- **simplex-noise** for procedural generation
- **Vitest** for tests
- Static hosting, no backend, `localStorage` for saves

## Project structure

```
src/
├─ config/     # data: levels, enemies, weapons, events, perks, narrator
├─ core/       # event bus, RNG, math, storage
├─ world/      # procedural generation, chunks, obstacle grid, pathfinding
├─ entities/   # player, enemies, projectiles, pickups, traps
├─ systems/    # stamina, combat, perception, director, fog, audio
├─ ai/         # state machines, awareness, behaviors
├─ scenes/     # boot, menu, game, UI, perk, game over
└─ ui/         # HUD, minimap, narrator, debug overlay
```

## Documentation

| Doc | Purpose |
|---|---|
| [product.md](./product.md) | Vision, design pillars, systems, levels, balance baseline |
| [architecture.md](./architecture.md) | Technical design, modules, schemas, ADRs |
| [documentation.md](./documentation.md) | Developer guide: conventions, how-tos, config reference, troubleshooting |
| [todo.md](./todo.md) | Phased build plan with tasks and exit criteria |

## Roadmap

- [ ] **M1: Prototype**: Level 1, fog, stamina, wolves, melee, 3 stones, win/lose
- [ ] **M2: Vertical slice**: director, narrator, hunters, ranged weapons, polished HUD
- [ ] **M3: Content**: levels 2-5, lions, bosses, avatars, perks, save
- [ ] **M4: Release**: audio, art and lighting pass, accessibility, balance, deploy
- [ ] **M5: Post-launch**: difficulty modes, daily seed, gamepad, leaderboards

## Contributing

1. Pick a task ID from [todo.md](./todo.md).
2. Create a branch: `feat/p3-wolf-perception`.
3. Keep changes config-driven and add a debug visualization for new systems.
4. Ensure `npm run typecheck && npm run lint && npm test && npm run build` pass.
5. Use Conventional Commits, e.g. `feat(P3-05): perception system`.

See [documentation.md](./documentation.md) for conventions.

## License

MIT (placeholder, update before publishing).

## Credits

Design and development by James. Assets and audio credits will be listed here as they are added.