import type { EnemyType } from '@/core/types';

export interface EnemyDef {
  type: EnemyType;
  name: string;
  health: number;
  walkSpeed: number;
  runSpeed: number;
  attackDamage: number;
  attackRange: number;
  attackCooldownSec: number;
  visionRadius: number;
  visionFovRad: number; // in radians
  hearingMultiplier: number;
  tracksScent: boolean;
  collisionRadius: number;
  awarenessGainRate: number;
  awarenessDecayRate: number;
}

export const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  wolf: {
    type: 'wolf',
    name: 'Timber Wolf',
    health: 45,
    walkSpeed: 90,
    runSpeed: 190,
    attackDamage: 18,
    attackRange: 24,
    attackCooldownSec: 1.4,
    visionRadius: 180,
    visionFovRad: (110 * Math.PI) / 180, // 110 degrees
    hearingMultiplier: 1.2,
    tracksScent: true,
    collisionRadius: 14,
    awarenessGainRate: 1.8,
    awarenessDecayRate: 0.35
  },
  hunter: {
    type: 'hunter',
    name: 'Game Hunter',
    health: 65,
    walkSpeed: 75,
    runSpeed: 160,
    attackDamage: 24,
    attackRange: 220,
    attackCooldownSec: 2.0,
    visionRadius: 240,
    visionFovRad: (90 * Math.PI) / 180,
    hearingMultiplier: 1.0,
    tracksScent: false,
    collisionRadius: 12,
    awarenessGainRate: 2.0,
    awarenessDecayRate: 0.25
  },
  lion: {
    type: 'lion',
    name: 'Savanna Lion',
    health: 95,
    walkSpeed: 85,
    runSpeed: 220,
    attackDamage: 32,
    attackRange: 28,
    attackCooldownSec: 1.6,
    visionRadius: 200,
    visionFovRad: (120 * Math.PI) / 180,
    hearingMultiplier: 1.1,
    tracksScent: true,
    collisionRadius: 18,
    awarenessGainRate: 1.5,
    awarenessDecayRate: 0.3
  }
};
