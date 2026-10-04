import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';
import type { GameEvents } from '@/core/types';

describe('EventBus', () => {
  it('delivers emitted events to registered subscribers', () => {
    const bus = new EventBus<GameEvents>();
    const handler = vi.fn();

    const unsub = bus.on('noise', handler);
    bus.emit('noise', {
      x: 100,
      y: 200,
      radius: 140,
      sourceId: 'player',
      kind: 'step'
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      x: 100,
      y: 200,
      radius: 140,
      sourceId: 'player',
      kind: 'step'
    });

    unsub();
    bus.emit('noise', {
      x: 100,
      y: 200,
      radius: 140,
      sourceId: 'player',
      kind: 'step'
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('supports multiple handlers for the same event', () => {
    const bus = new EventBus<GameEvents>();
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    bus.on('damage', fn1);
    bus.on('damage', fn2);

    bus.emit('damage', {
      sourceId: 'wolf',
      targetId: 'player',
      amount: 15,
      knockback: 10,
      kind: 'melee'
    });

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });
});
