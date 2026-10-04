import { PLAYER_CONFIG } from '@/config/constants';
import { lerp, distance } from '@/core/math';
import type { Vec2 } from '@/core/math';

export interface VisionModifiers {
  isNight?: boolean; // -35%
  isFogSurge?: boolean; // -40%
  hasTorch?: boolean; // +30%
  isHighGround?: boolean; // +50%
  inDenseForest?: boolean; // -15%
  isRaining?: boolean; // -10%
}

export class VisionSystem {
  public readonly baseRadius: number;
  public currentRadius: number;
  public targetRadius: number;
  private lerpSpeed = 4.0; // smooth transition speed

  constructor(baseRadius: number = PLAYER_CONFIG.baseVisionRadius) {
    this.baseRadius = baseRadius;
    this.currentRadius = baseRadius;
    this.targetRadius = baseRadius;
  }

  public calculateTargetRadius(modifiers: VisionModifiers): number {
    let multiplier = 1.0;

    if (modifiers.isNight) multiplier -= 0.35;
    if (modifiers.isFogSurge) multiplier -= 0.40;
    if (modifiers.hasTorch) multiplier += 0.30;
    if (modifiers.isHighGround) multiplier += 0.50;
    if (modifiers.inDenseForest) multiplier -= 0.15;
    if (modifiers.isRaining) multiplier -= 0.10;

    // Minimum clamp at 30% of base radius
    multiplier = Math.max(0.3, multiplier);
    return this.baseRadius * multiplier;
  }

  public update(dt: number, modifiers: VisionModifiers): void {
    this.targetRadius = this.calculateTargetRadius(modifiers);
    this.currentRadius = lerp(
      this.currentRadius,
      this.targetRadius,
      Math.min(1.0, dt * this.lerpSpeed)
    );
  }

  public isVisible(entityPos: Vec2, playerPos: Vec2): boolean {
    return distance(entityPos, playerPos) <= this.currentRadius;
  }
}
