import { describe, it, expect, vi } from 'vitest';
import { CombatSystem } from '@/systems/CombatSystem';
import { EventBus } from '@/core/EventBus';
import type { GameEvents } from '@/core/types';
import { WEAPON_DEFS } from '@/config/weapons';
import { Wolf } from '@/entities/enemies/Wolf';
import { Pathfinding } from '@/world/Pathfinding';
import { ObstacleGrid } from '@/world/ObstacleGrid';

describe('CombatSystem', () => {
  it('hits targets within range and arc', () => {
    const bus = new EventBus<GameEvents>();
    const damageSpy = vi.fn();
    bus.on('damage', damageSpy);

    const combat = new CombatSystem(bus);
    const grid = new ObstacleGrid(20, 20);
    const pathfinder = new Pathfinding(grid);

    // Wolf located directly in front of player, facing player (-X)
    const wolf = new Wolf('wolf_1', 130, 100, pathfinder);
    wolf.facingAngle = Math.PI;
    const playerPos = { x: 100, y: 100 };
    const facingAngle = 0; // facing +X (towards wolf)

    const result = combat.executeMeleeAttack(
      'player',
      playerPos,
      facingAngle,
      WEAPON_DEFS['spear']!,
      false,
      [wolf]
    );

    expect(result.hitCount).toBe(1);
    expect(result.damageDealt).toBe(18);
    expect(wolf.health.current).toBe(45 - 18);
    expect(damageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'wolf_1',
        amount: 18
      })
    );
  });

  it('deals 3x backstab damage when attacking unaware target from behind', () => {
    const bus = new EventBus<GameEvents>();
    const combat = new CombatSystem(bus);
    const grid = new ObstacleGrid(20, 20);
    const pathfinder = new Pathfinding(grid);

    // Wolf at (100, 100) facing right (+X), unaware
    const wolf = new Wolf('wolf_backstab', 100, 100, pathfinder);
    wolf.facingAngle = 0;
    wolf.perception.awareness = 0;

    // Player positioned behind wolf at (70, 100), facing towards wolf (+X)
    const playerPos = { x: 70, y: 100 };
    const playerFacing = 0;

    const result = combat.executeMeleeAttack(
      'player',
      playerPos,
      playerFacing,
      WEAPON_DEFS['spear']!,
      false,
      [wolf]
    );

    expect(result.isBackstab).toBe(true);
    expect(result.damageDealt).toBe(18 * 3); // 54 damage
    expect(wolf.health.isDead).toBe(true); // 54 > 45 HP
  });
});
