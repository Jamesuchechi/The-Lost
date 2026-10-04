import { distance, isInCone } from '@/core/math';
import type { Vec2 } from '@/core/math';
import { ObstacleGrid } from '@/world/ObstacleGrid';
import type { EnemyDef } from '@/config/enemies';
import type { NoiseEvent } from '@/core/types';
import type { ScentTrail } from './ScentTrail';

export interface EnemyPerceptionState {
  awareness: number; // 0.0 .. 1.0
  lastKnownPlayerPos: Vec2 | null;
  hasVisualContact: boolean;
  alertLevel: 'unaware' | 'investigate' | 'alert';
}

export class PerceptionSystem {
  private grid: ObstacleGrid;
  private scentTrail?: ScentTrail;
  private recentNoises: NoiseEvent[] = [];

  constructor(grid: ObstacleGrid, scentTrail?: ScentTrail) {
    this.grid = grid;
    this.scentTrail = scentTrail;
  }

  public registerNoise(noise: NoiseEvent): void {
    this.recentNoises.push(noise);
  }

  public clearFrameNoises(): void {
    this.recentNoises = [];
  }

  public evaluateEnemy(
    dt: number,
    enemyPos: Vec2,
    enemyFacingAngle: number,
    enemyDef: EnemyDef,
    playerPos: Vec2,
    state: EnemyPerceptionState
  ): void {
    let visualContact = false;

    // 1. Vision Check (Cone + ObstacleGrid LOS)
    const distToPlayer = distance(enemyPos, playerPos);
    if (distToPlayer <= enemyDef.visionRadius) {
      if (isInCone(enemyPos, enemyFacingAngle, enemyDef.visionFovRad, playerPos)) {
        if (this.grid.hasLineOfSight(enemyPos.x, enemyPos.y, playerPos.x, playerPos.y)) {
          visualContact = true;
          state.hasVisualContact = true;
          state.lastKnownPlayerPos = { x: playerPos.x, y: playerPos.y };
          state.awareness = Math.min(1.0, state.awareness + enemyDef.awarenessGainRate * dt);
        }
      }
    }

    if (!visualContact) {
      state.hasVisualContact = false;
    }

    // 2. Hearing Check (Recent frame noise events)
    for (const noise of this.recentNoises) {
      const distToNoise = distance(enemyPos, { x: noise.x, y: noise.y });
      const effectiveHearingRadius = noise.radius * enemyDef.hearingMultiplier;

      if (distToNoise <= effectiveHearingRadius) {
        state.lastKnownPlayerPos = { x: noise.x, y: noise.y };
        state.awareness = Math.max(state.awareness, 0.45); // Instant bump to investigate
      }
    }

    // 3. Scent Check (If enemy tracks scent, e.g. wolf)
    let scentFound = false;
    if (!visualContact && enemyDef.tracksScent && this.scentTrail) {
      const scent = this.scentTrail.getStrongestScentNearby(enemyPos, 220);
      if (scent && state.awareness < 0.35) {
        state.lastKnownPlayerPos = { x: scent.x, y: scent.y };
        state.awareness = Math.max(state.awareness, 0.30);
        scentFound = true;
      }
    }

    // 4. Decay awareness if no active stimulus
    if (!visualContact && this.recentNoises.length === 0 && !scentFound) {
      state.awareness = Math.max(0, state.awareness - enemyDef.awarenessDecayRate * dt);
    }

    // 5. Categorize alert level
    if (state.awareness >= 0.6) {
      state.alertLevel = 'alert';
    } else if (state.awareness >= 0.25) {
      state.alertLevel = 'investigate';
    } else {
      state.alertLevel = 'unaware';
    }
  }
}
