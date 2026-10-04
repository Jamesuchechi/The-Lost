import { describe, it, expect, vi } from 'vitest';
import { StaminaSystem } from '@/systems/StaminaSystem';
import { VisionSystem } from '@/systems/VisionSystem';
import { EventBus } from '@/core/EventBus';
import type { GameEvents } from '@/core/types';

describe('StaminaSystem', () => {
  it('drains stamina when sprinting and regens after delay', () => {
    const stamina = new StaminaSystem();
    expect(stamina.current).toBe(100);

    // Sprint for 2 seconds (18/s * 2 = 36 drained)
    stamina.update(2.0, true, true, false);
    expect(stamina.current).toBeCloseTo(64, 0);

    // Stop sprinting, wait 0.5s (within delay window -> no regen)
    stamina.update(0.5, false, true, false);
    expect(stamina.current).toBeCloseTo(64, 0);

    // Wait another 1.0s (past 1.0s delay -> regens 14/s * 1.0s = 14)
    stamina.update(1.0, false, true, false);
    expect(stamina.current).toBeGreaterThan(64);
  });

  it('triggers winded exhaustion state at zero stamina and emits breath noise', () => {
    const bus = new EventBus<GameEvents>();
    const noiseSpy = vi.fn();
    bus.on('noise', noiseSpy);

    const stamina = new StaminaSystem(bus);
    stamina.drain(100);

    expect(stamina.isWinded).toBe(true);
    expect(stamina.canSprint()).toBe(false);

    // Update for 1.0s to trigger breath noise
    stamina.update(1.0, false, false, false, { x: 100, y: 100 });
    expect(noiseSpy).toHaveBeenCalled();
    expect(noiseSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'breath',
        radius: 180
      })
    );

    // Fast-forward past 2.5s exhaustion duration
    stamina.update(2.0, false, false, false);
    expect(stamina.isWinded).toBe(false);
  });
});

describe('VisionSystem', () => {
  it('stacks modifiers correctly', () => {
    const vision = new VisionSystem(200);

    // Night (-35%) -> 200 * 0.65 = 130
    expect(vision.calculateTargetRadius({ isNight: true })).toBeCloseTo(130);

    // Night (-35%) + Torch (+30%) -> 200 * 0.95 = 190
    expect(vision.calculateTargetRadius({ isNight: true, hasTorch: true })).toBeCloseTo(190);

    // Fog surge (-40%) + Dense forest (-15%) -> 200 * 0.45 = 90
    expect(vision.calculateTargetRadius({ isFogSurge: true, inDenseForest: true })).toBeCloseTo(90);
  });

  it('smoothly interpolates towards target radius', () => {
    const vision = new VisionSystem(200);
    vision.update(0.1, { isNight: true }); // target is 130
    expect(vision.currentRadius).toBeLessThan(200);
    expect(vision.currentRadius).toBeGreaterThan(130);
  });
});
