import { describe, it, expect } from 'vitest';
import { PerceptionSystem } from '@/systems/PerceptionSystem';
import { ObstacleGrid } from '@/world/ObstacleGrid';
import { ScentTrail } from '@/systems/ScentTrail';
import { ENEMY_DEFS } from '@/config/enemies';

describe('PerceptionSystem', () => {
  it('detects player in front sight cone with clear line of sight and raises awareness', () => {
    const grid = new ObstacleGrid(20, 20);
    const perception = new PerceptionSystem(grid);

    const enemyPos = { x: 100, y: 100 };
    const playerPos = { x: 180, y: 100 }; // directly in front (angle 0)
    const facingAngle = 0;

    const state = {
      awareness: 0,
      lastKnownPlayerPos: null,
      hasVisualContact: false,
      alertLevel: 'unaware' as const
    };

    perception.evaluateEnemy(1.0, enemyPos, facingAngle, ENEMY_DEFS.wolf, playerPos, state);

    expect(state.hasVisualContact).toBe(true);
    expect(state.awareness).toBeGreaterThan(0.5);
    expect(state.alertLevel).toBe('alert');
  });

  it('fails visual detection if player is behind the enemy', () => {
    const grid = new ObstacleGrid(20, 20);
    const perception = new PerceptionSystem(grid);

    const enemyPos = { x: 100, y: 100 };
    const playerPos = { x: 20, y: 100 }; // behind facing angle 0
    const facingAngle = 0;

    const state = {
      awareness: 0,
      lastKnownPlayerPos: null,
      hasVisualContact: false,
      alertLevel: 'unaware' as const
    };

    perception.evaluateEnemy(1.0, enemyPos, facingAngle, ENEMY_DEFS.wolf, playerPos, state);
    expect(state.hasVisualContact).toBe(false);
    expect(state.awareness).toBe(0);
  });

  it('triggers investigation on hearing nearby noise event', () => {
    const grid = new ObstacleGrid(20, 20);
    const perception = new PerceptionSystem(grid);

    const enemyPos = { x: 100, y: 100 };
    const playerPos = { x: 20, y: 100 }; // behind enemy
    const facingAngle = 0;

    const state = {
      awareness: 0,
      lastKnownPlayerPos: null,
      hasVisualContact: false,
      alertLevel: 'unaware' as const
    };

    // Register sprint noise at player pos
    perception.registerNoise({
      x: playerPos.x,
      y: playerPos.y,
      radius: 280,
      sourceId: 'player',
      kind: 'step'
    });

    perception.evaluateEnemy(0.1, enemyPos, facingAngle, ENEMY_DEFS.wolf, playerPos, state);
    expect(state.awareness).toBeGreaterThanOrEqual(0.45);
    expect(state.alertLevel).toBe('investigate');
    expect(state.lastKnownPlayerPos).toEqual({ x: playerPos.x, y: playerPos.y });
  });

  it('tracks scent trail when visual contact is lost', () => {
    const grid = new ObstacleGrid(20, 20);
    const scentTrail = new ScentTrail();
    scentTrail.nodes.push({ x: 120, y: 110, age: 2, strength: 0.9 });

    const perception = new PerceptionSystem(grid, scentTrail);
    const enemyPos = { x: 100, y: 100 };
    const playerPos = { x: 400, y: 400 }; // far away

    const state = {
      awareness: 0,
      lastKnownPlayerPos: null,
      hasVisualContact: false,
      alertLevel: 'unaware' as const
    };

    perception.evaluateEnemy(0.1, enemyPos, 0, ENEMY_DEFS.wolf, playerPos, state);
    expect(state.awareness).toBeGreaterThanOrEqual(0.3);
    expect(state.alertLevel).toBe('investigate');
    expect(state.lastKnownPlayerPos).toEqual({ x: 120, y: 110 });
  });
});
