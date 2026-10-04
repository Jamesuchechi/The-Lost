import { describe, it, expect } from 'vitest';
import { level1 } from '@/config/levels/level1';
import { generateLevel } from '@/world/WorldGenerator';
import { ObstacleGrid } from '@/world/ObstacleGrid';

describe('WorldGenerator & ObstacleGrid', () => {
  it('generates completely identical world layout for the same seed', () => {
    const seed = 'test-deterministic-seed-1';
    const worldA = generateLevel(level1, seed);
    const worldB = generateLevel(level1, seed);

    expect(worldA.spawnPos.x).toBe(worldB.spawnPos.x);
    expect(worldA.spawnPos.y).toBe(worldB.spawnPos.y);
    expect(worldA.exitLocation.x).toBe(worldB.exitLocation.x);
    expect(worldA.exitLocation.y).toBe(worldB.exitLocation.y);
    expect(worldA.stoneLocations.length).toBe(worldB.stoneLocations.length);

    for (let i = 0; i < worldA.stoneLocations.length; i++) {
      const stoneA = worldA.stoneLocations[i]!;
      const stoneB = worldB.stoneLocations[i]!;
      expect(stoneA.x).toBe(stoneB.x);
      expect(stoneA.y).toBe(stoneB.y);
      expect(stoneA.guardType).toBe(stoneB.guardType);
    }

    // Grid tiles exact match
    for (let y = 0; y < worldA.height; y++) {
      for (let x = 0; x < worldA.width; x++) {
        expect(worldA.grid.getTile(x, y)).toBe(worldB.grid.getTile(x, y));
        expect(worldA.grid.isBlocked(x, y)).toBe(worldB.grid.isBlocked(x, y));
      }
    }
  });

  it('spawns player on an unblocked, walkable tile', () => {
    const world = generateLevel(level1, 'spawn-walkable-seed');
    expect(world.grid.isBlockedWorld(world.spawnPos.x, world.spawnPos.y, 10)).toBe(false);
  });

  it('ObstacleGrid line-of-sight is blocked by obstacles and clear across open terrain', () => {
    const grid = new ObstacleGrid(20, 20);
    // Clear path
    expect(grid.hasLineOfSight(32, 32, 320, 32)).toBe(true);

    // Block a tile in the middle (x=5, y=1 -> tile index 5, 1)
    grid.setTile(5, 1, ObstacleGrid.TYPE_TREE, true);
    // Ray from (1, 1)*32 -> (10, 1)*32 crosses tile (5, 1)
    expect(grid.hasLineOfSight(32 + 16, 32 + 16, 320 + 16, 32 + 16)).toBe(false);
  });
});
