import { describe, it, expect } from 'vitest';
import { Rng, mulberry32, hashSeed } from '@/core/rng';

describe('RNG & Determinism', () => {
  it('mulberry32 produces identical sequence for same seed', () => {
    const genA = mulberry32(12345);
    const genB = mulberry32(12345);

    for (let i = 0; i < 50; i++) {
      expect(genA()).toBe(genB());
    }
  });

  it('hashSeed produces distinct seeds for different streams', () => {
    const worldSeed = hashSeed('seed123', 'world');
    const lootSeed = hashSeed('seed123', 'loot');
    const aiSeed = hashSeed('seed123', 'ai');

    expect(worldSeed).not.toBe(lootSeed);
    expect(worldSeed).not.toBe(aiSeed);
    expect(lootSeed).not.toBe(aiSeed);
  });

  it('Rng class stream is completely deterministic', () => {
    const rng1 = new Rng('test-seed-42', 'world');
    const rng2 = new Rng('test-seed-42', 'world');

    for (let i = 0; i < 25; i++) {
      expect(rng1.float()).toBe(rng2.float());
      expect(rng1.range(10, 50)).toBe(rng2.range(10, 50));
      expect(rng1.int(1, 6)).toBe(rng2.int(1, 6));
      expect(rng1.chance(0.3)).toBe(rng2.chance(0.3));
    }
  });

  it('Rng.pick throws on empty array and picks items accurately', () => {
    const rng = new Rng('pick-test', 'loot');
    expect(() => rng.pick([])).toThrow();
    const items = ['stone', 'stick', 'herb'];
    const picked = rng.pick(items);
    expect(items).toContain(picked);
  });

  it('Rng.weighted picks items proportional to weights', () => {
    const rng = new Rng('weighted-test', 'loot');
    const items = [
      { item: 'common', weight: 90 },
      { item: 'rare', weight: 10 }
    ];
    let commonCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (rng.weighted(items) === 'common') commonCount++;
    }
    expect(commonCount).toBeGreaterThan(800);
  });
});
