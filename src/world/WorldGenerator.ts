import { createNoise2D } from 'simplex-noise';
import { Rng, mulberry32, hashSeed } from '@/core/rng';
import { TILE_SIZE } from '@/config/constants';
import type { LevelConfig } from '@/config/levels/types';
import { ObstacleGrid } from './ObstacleGrid';

export interface WorldPoint {
  x: number;
  y: number; // in world coordinates (pixels / units)
}

export interface StoneLocation {
  index: number;
  x: number;
  y: number;
  guardType: 'hidden' | 'guarded' | 'trapped';
  isDecoy: boolean;
}

export interface ClueLocation {
  x: number;
  y: number;
  targetStoneIndex: number;
}

export interface LevelData {
  config: LevelConfig;
  seed: string | number;
  width: number;
  height: number;
  grid: ObstacleGrid;
  spawnPos: WorldPoint;
  stoneLocations: StoneLocation[];
  clueLocations: ClueLocation[];
  exitLocation: WorldPoint;
}

export function generateLevel(config: LevelConfig, seed: string | number): LevelData {
  const width = config.mapSize.w;
  const height = config.mapSize.h;
  const grid = new ObstacleGrid(width, height);

  // Pure seeded noise generators
  const worldPrng = mulberry32(hashSeed(seed, 'world'));
  const elevationNoise = createNoise2D(worldPrng);
  const moistureNoise = createNoise2D(worldPrng);
  const detailNoise = createNoise2D(worldPrng);

  const placementRng = new Rng(seed, 'placement');

  // 1. Generate base terrain and obstacles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Map boundaries are solid dense trees
      if (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) {
        grid.setTile(x, y, ObstacleGrid.TYPE_TREE, true);
        continue;
      }

      const nx = x / 40;
      const ny = y / 40;

      const elevation = (elevationNoise(nx, ny) + 1) * 0.5; // 0..1
      const moisture = (moistureNoise(nx * 1.5, ny * 1.5) + 1) * 0.5; // 0..1
      const detail = (detailNoise(x / 8, y / 8) + 1) * 0.5;

      if (elevation < 0.18 && moisture > 0.65) {
        // Water pond (blocking)
        grid.setTile(x, y, ObstacleGrid.TYPE_WATER, true);
      } else if (elevation > 0.72 && detail > 0.6) {
        // Rock / boulder outcrop (blocking)
        grid.setTile(x, y, ObstacleGrid.TYPE_ROCK, true);
      } else if (moisture > 0.55 && detail > 0.42) {
        // Dense tree stand (blocking)
        grid.setTile(x, y, ObstacleGrid.TYPE_TREE, true);
      } else if (elevation > 0.45 && moisture < 0.35) {
        // Dirt path / clearing (walkable)
        grid.setTile(x, y, ObstacleGrid.TYPE_DIRT, false);
      } else {
        // Normal forest grass floor (walkable)
        grid.setTile(x, y, ObstacleGrid.TYPE_GRASS, false);
      }
    }
  }

  // 2. Select Player Spawn Position (Safe clearing in southern region)
  let spawnTileX = Math.floor(width / 2);
  let spawnTileY = height - 12;

  // Search for the closest open walkable tile
  let foundSpawn = false;
  for (let r = 0; r < 20 && !foundSpawn; r++) {
    for (let dy = -r; dy <= r && !foundSpawn; dy++) {
      for (let dx = -r; dx <= r && !foundSpawn; dx++) {
        const tx = spawnTileX + dx;
        const ty = spawnTileY + dy;
        if (!grid.isBlocked(tx, ty) && !grid.isBlocked(tx + 1, ty) && !grid.isBlocked(tx, ty + 1)) {
          spawnTileX = tx;
          spawnTileY = ty;
          foundSpawn = true;
        }
      }
    }
  }

  // Clear a 3x3 circle around spawn
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const tx = spawnTileX + dx;
      const ty = spawnTileY + dy;
      if (tx > 1 && tx < width - 2 && ty > 1 && ty < height - 2) {
        grid.setTile(tx, ty, ObstacleGrid.TYPE_GRASS, false);
      }
    }
  }

  const spawnPos: WorldPoint = {
    x: (spawnTileX + 0.5) * TILE_SIZE,
    y: (spawnTileY + 0.5) * TILE_SIZE
  };

  // 3. Place Stones (3 true ancient stones + optional decoys)
  const stoneLocations: StoneLocation[] = [];
  const targetStones = config.stones.count;
  const guardPool = [...config.stones.guards];

  for (let i = 0; i < targetStones; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const tx = placementRng.int(10, width - 11);
      const ty = placementRng.int(10, height - 11);
      const wx = (tx + 0.5) * TILE_SIZE;
      const wy = (ty + 0.5) * TILE_SIZE;

      const distSpawn = Math.hypot(wx - spawnPos.x, wy - spawnPos.y);
      if (distSpawn < config.stones.minDistFromSpawn) continue;

      let tooClose = false;
      for (const existing of stoneLocations) {
        if (Math.hypot(wx - existing.x, wy - existing.y) < config.stones.minDistBetween) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Clear immediate area for altar
      grid.setTile(tx, ty, ObstacleGrid.TYPE_ALTAR, false);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            grid.setTile(tx + dx, ty + dy, ObstacleGrid.TYPE_DIRT, false);
          }
        }
      }

      const guardType = guardPool[i] ?? 'guarded';
      stoneLocations.push({
        index: i,
        x: wx,
        y: wy,
        guardType,
        isDecoy: false
      });
      placed = true;
    }
  }

  // 4. Place Clues for each stone
  const clueLocations: ClueLocation[] = [];
  for (const stone of stoneLocations) {
    for (let c = 0; c < config.clues.perStone; c++) {
      const angle = placementRng.range(0, Math.PI * 2);
      const radius = placementRng.range(150, 450);
      const cx = stone.x + Math.cos(angle) * radius;
      const cy = stone.y + Math.sin(angle) * radius;
      const tx = Math.floor(cx / TILE_SIZE);
      const ty = Math.floor(cy / TILE_SIZE);
      if (tx > 2 && tx < width - 3 && ty > 2 && ty < height - 3) {
        grid.setTile(tx, ty, ObstacleGrid.TYPE_GRASS, false);
        clueLocations.push({
          x: cx,
          y: cy,
          targetStoneIndex: stone.index
        });
      }
    }
  }

  // 5. Place Exit Gate (at northern edge)
  let exitTileX = Math.floor(width / 2);
  let exitTileY = 4;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      grid.setTile(exitTileX + dx, exitTileY + dy, ObstacleGrid.TYPE_PATH, false);
    }
  }
  grid.setTile(exitTileX, exitTileY, ObstacleGrid.TYPE_GATE, false);

  const exitLocation: WorldPoint = {
    x: (exitTileX + 0.5) * TILE_SIZE,
    y: (exitTileY + 0.5) * TILE_SIZE
  };

  // 6. Guarantee Solvability: Carve walkable natural corridors from spawn to all stones and exit gate
  for (const stone of stoneLocations) {
    const stx = Math.floor(stone.x / TILE_SIZE);
    const sty = Math.floor(stone.y / TILE_SIZE);
    carveCorridor(grid, spawnTileX, spawnTileY, stx, sty, 2);
  }
  carveCorridor(grid, spawnTileX, spawnTileY, exitTileX, exitTileY, 2);

  return {
    config,
    seed,
    width,
    height,
    grid,
    spawnPos,
    stoneLocations,
    clueLocations,
    exitLocation
  };
}

function carveCorridor(
  grid: ObstacleGrid,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  corridorWidth: number = 2
): void {
  let cx = startX;
  let cy = startY;

  while (cx !== endX || cy !== endY) {
    for (let dy = -Math.floor(corridorWidth / 2); dy <= Math.floor(corridorWidth / 2); dy++) {
      for (let dx = -Math.floor(corridorWidth / 2); dx <= Math.floor(corridorWidth / 2); dx++) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx > 1 && tx < grid.width - 2 && ty > 1 && ty < grid.height - 2) {
          if (grid.isBlocked(tx, ty)) {
            grid.setTile(tx, ty, ObstacleGrid.TYPE_DIRT, false);
          }
        }
      }
    }

    if (cx < endX) cx++;
    else if (cx > endX) cx--;

    if (cy < endY) cy++;
    else if (cy > endY) cy--;
  }

  for (let dy = -Math.floor(corridorWidth / 2); dy <= Math.floor(corridorWidth / 2); dy++) {
    for (let dx = -Math.floor(corridorWidth / 2); dx <= Math.floor(corridorWidth / 2); dx++) {
      const tx = endX + dx;
      const ty = endY + dy;
      if (tx > 1 && tx < grid.width - 2 && ty > 1 && ty < grid.height - 2) {
        if (grid.isBlocked(tx, ty)) {
          grid.setTile(tx, ty, ObstacleGrid.TYPE_DIRT, false);
        }
      }
    }
  }
}
