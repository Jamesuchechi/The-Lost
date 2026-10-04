import { describe, it, expect } from 'vitest';
import { level1 } from '@/config/levels/level1';
import { generateLevel } from '@/world/WorldGenerator';
import { distance } from '@/core/math';
import { TILE_SIZE } from '@/config/constants';

describe('Solvability Property Test (500 seeds)', () => {
  it('verifies all 3 stones and exit gate are reachable on 500 seeds', () => {
    const NUM_SEEDS = 500;

    for (let s = 0; s < NUM_SEEDS; s++) {
      const seed = `solvability_seed_${s}`;
      const level = generateLevel(level1, seed);

      // 1. Spawn Walkability
      expect(level.grid.isBlockedWorld(level.spawnPos.x, level.spawnPos.y, 8)).toBe(false);

      // 2. Stone Counts & Distance Constraints
      expect(level.stoneLocations.length).toBe(3);

      for (let i = 0; i < level.stoneLocations.length; i++) {
        const stone = level.stoneLocations[i]!;
        const distFromSpawn = distance(level.spawnPos, { x: stone.x, y: stone.y });
        expect(distFromSpawn).toBeGreaterThanOrEqual(level1.stones.minDistFromSpawn);

        for (let j = i + 1; j < level.stoneLocations.length; j++) {
          const other = level.stoneLocations[j]!;
          const distBetween = distance({ x: stone.x, y: stone.y }, { x: other.x, y: other.y });
          expect(distBetween).toBeGreaterThanOrEqual(level1.stones.minDistBetween);
        }
      }

      // 3. Flood-fill Reachability Check from Spawn
      const width = level.width;
      const height = level.height;
      const reachable = new Uint8Array(width * height);
      const queue: number[] = [];

      const startTileX = Math.floor(level.spawnPos.x / TILE_SIZE);
      const startTileY = Math.floor(level.spawnPos.y / TILE_SIZE);
      const startIndex = startTileY * width + startTileX;
      reachable[startIndex] = 1;
      queue.push(startIndex);

      while (queue.length > 0) {
        const idx = queue.shift()!;
        const cx = idx % width;
        const cy = Math.floor(idx / width);

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx! >= 0 && nx! < width && ny! >= 0 && ny! < height) {
            const nIdx = ny! * width + nx!;
            if (reachable[nIdx] === 0 && !level.grid.isBlocked(nx!, ny!)) {
              reachable[nIdx] = 1;
              queue.push(nIdx);
            }
          }
        }
      }

      // Verify all 3 stones are reachable
      for (const stone of level.stoneLocations) {
        const tx = Math.floor(stone.x / TILE_SIZE);
        const ty = Math.floor(stone.y / TILE_SIZE);
        expect(reachable[ty * width + tx]).toBe(1);
      }

      // Verify exit is reachable
      const exitTx = Math.floor(level.exitLocation.x / TILE_SIZE);
      const exitTy = Math.floor(level.exitLocation.y / TILE_SIZE);
      expect(reachable[exitTy * width + exitTx]).toBe(1);
    }
  });
});
