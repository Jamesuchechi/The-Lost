import { PLAYER_CONFIG } from '@/config/constants';
import type { EventBus } from '@/core/EventBus';
import type { GameEvents } from '@/core/types';

export class StaminaSystem {
  public current: number;
  public readonly max: number = PLAYER_CONFIG.staminaMax;
  public isWinded = false;
  public windedTimer = 0; // seconds remaining in exhaustion

  private timeSinceLastDrain = 0;
  private breathTimer = 0;
  private eventBus: EventBus<GameEvents> | null = null;

  constructor(eventBus?: EventBus<GameEvents>) {
    this.current = this.max;
    if (eventBus) {
      this.eventBus = eventBus;
    }
  }

  public drain(amount: number): boolean {
    if (this.current < amount) return false;
    this.current = Math.max(0, this.current - amount);
    this.timeSinceLastDrain = 0;

    if (this.current <= 0 && !this.isWinded) {
      this.triggerExhaustion();
    }
    return true;
  }

  public drainContinuous(ratePerSec: number, dt: number): void {
    if (this.current <= 0) return;
    this.current = Math.max(0, this.current - ratePerSec * dt);
    this.timeSinceLastDrain = 0;

    if (this.current <= 0 && !this.isWinded) {
      this.triggerExhaustion();
    }
  }

  public canSprint(): boolean {
    return !this.isWinded && this.current > 5;
  }

  public canDodge(): boolean {
    return !this.isWinded && this.current >= PLAYER_CONFIG.dodgeStaminaCost;
  }

  public canAttack(isHeavy: boolean): boolean {
    const cost = isHeavy
      ? PLAYER_CONFIG.heavyAttackStaminaCost
      : PLAYER_CONFIG.lightAttackStaminaCost;
    return !this.isWinded && this.current >= cost;
  }

  private triggerExhaustion(): void {
    this.isWinded = true;
    this.windedTimer = PLAYER_CONFIG.staminaExhaustionDurationSec;
    this.breathTimer = 0;
  }

  public update(
    dt: number,
    isSprinting: boolean,
    isMoving: boolean,
    isCrouching: boolean,
    playerPos?: { x: number; y: number }
  ): void {
    if (isSprinting && isMoving && !this.isWinded) {
      this.drainContinuous(PLAYER_CONFIG.sprintStaminaCostPerSec, dt);
    } else {
      this.timeSinceLastDrain += dt;

      // Exhaustion countdown
      if (this.isWinded) {
        this.windedTimer -= dt;

        // Emit breath noise every 0.8s while winded
        this.breathTimer += dt;
        if (this.breathTimer >= 0.8 && playerPos && this.eventBus) {
          this.breathTimer = 0;
          this.eventBus.emit('noise', {
            x: playerPos.x,
            y: playerPos.y,
            radius: 180,
            sourceId: 'player',
            kind: 'breath'
          });
        }

        if (this.windedTimer <= 0) {
          this.isWinded = false;
          this.windedTimer = 0;
        }
      } else if (this.timeSinceLastDrain >= PLAYER_CONFIG.staminaRegenDelaySec) {
        // Normal regeneration
        let regenRate = PLAYER_CONFIG.staminaRegenPerSec;
        if (isCrouching || !isMoving) {
          regenRate *= 1.5; // +50% regen boost when crouched or stationary
        }
        this.current = Math.min(this.max, this.current + regenRate * dt);
      }
    }
  }
}
