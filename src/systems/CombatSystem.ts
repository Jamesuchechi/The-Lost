import { distance, isInCone, angleBetween, normalizeAngle } from '@/core/math';
import type { Vec2 } from '@/core/math';
import type { EventBus } from '@/core/EventBus';
import type { GameEvents } from '@/core/types';
import type { WeaponDef } from '@/config/weapons';
import type { Entity } from '@/entities/Entity';
import type { Wolf } from '@/entities/enemies/Wolf';

export interface AttackResult {
  hitCount: number;
  damageDealt: number;
  isBackstab: boolean;
  hitTargets: Entity[];
}

export class CombatSystem {
  private eventBus: EventBus<GameEvents>;

  constructor(eventBus: EventBus<GameEvents>) {
    this.eventBus = eventBus;
  }

  public executeMeleeAttack(
    attackerId: string,
    attackerPos: Vec2,
    attackerFacingAngle: number,
    weapon: WeaponDef,
    isHeavy: boolean,
    potentialTargets: Wolf[]
  ): AttackResult {
    let hitCount = 0;
    let totalDamage = 0;
    let backstabOccurred = false;
    const hitTargets: Entity[] = [];

    const baseDamage = isHeavy ? weapon.heavyDamage : weapon.lightDamage;

    for (const target of potentialTargets) {
      if (target.health.isDead) continue;

      const targetPos = { x: target.position.x, y: target.position.z };
      const dist = distance(attackerPos, targetPos);

      // 1. Range check (weapon reach + target collision radius)
      if (dist <= weapon.range + target.radius) {
        // 2. Forward Arc check
        if (isInCone(attackerPos, attackerFacingAngle, weapon.arcRad, targetPos)) {
          let damage = baseDamage;

          // 3. Backstab Check: Target is unaware (< 0.25) AND attacker is behind target's facing direction (> 135 deg)
          const angleToAttacker = angleBetween(targetPos, attackerPos);
          const angleDiffFromTargetFacing = Math.abs(
            normalizeAngle(angleToAttacker - target.facingAngle)
          );

          if (target.perception.awareness < 0.25 && angleDiffFromTargetFacing > (Math.PI * 3) / 4) {
            damage *= 3.0; // 3x backstab damage
            backstabOccurred = true;
          }

          // Apply damage
          target.takeDamage(damage);
          hitCount++;
          totalDamage += damage;
          hitTargets.push(target);

          // Apply knockback
          const knockbackForce = isHeavy ? 45 : 25;
          const kbAngle = angleBetween(attackerPos, targetPos);
          target.position.x += Math.cos(kbAngle) * knockbackForce;
          target.position.z += Math.sin(kbAngle) * knockbackForce;
          target.mesh.position.copy(target.position);

          // Alert target if still alive
          target.perception.awareness = 1.0;
          target.perception.alertLevel = 'alert';
          target.perception.lastKnownPlayerPos = { x: attackerPos.x, y: attackerPos.y };
          target.stateMachine.transitionTo('Chase');

          // Emit events
          this.eventBus.emit('damage', {
            sourceId: attackerId,
            targetId: target.id,
            amount: damage,
            knockback: knockbackForce,
            kind: 'melee'
          });

          if (target.health.isDead) {
            this.eventBus.emit('death', {
              id: target.id,
              faction: 'enemy'
            });
          }
        }
      }
    }

    // Emit melee hit noise
    if (hitCount > 0) {
      this.eventBus.emit('noise', {
        x: attackerPos.x,
        y: attackerPos.y,
        radius: backstabOccurred ? 80 : 320, // backstabs are quiet
        sourceId: attackerId,
        kind: 'attack'
      });
    }

    return {
      hitCount,
      damageDealt: totalDamage,
      isBackstab: backstabOccurred,
      hitTargets
    };
  }
}
