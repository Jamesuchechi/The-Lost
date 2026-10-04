import { describe, it, expect, vi } from 'vitest';
import { StateMachine } from '@/ai/StateMachine';

type TestState = 'Idle' | 'Patrol' | 'Chase' | 'Search';

describe('StateMachine', () => {
  it('initializes and transitions through states invoking callbacks', () => {
    const sm = new StateMachine<TestState>('Idle');
    const onEnterPatrol = vi.fn();
    const onExitPatrol = vi.fn();

    sm.registerState({ name: 'Idle' })
      .registerState({
        name: 'Patrol',
        onEnter: onEnterPatrol,
        onExit: onExitPatrol
      })
      .registerState({ name: 'Chase' });

    expect(sm.getCurrentState()).toBe('Idle');

    sm.transitionTo('Patrol');
    expect(sm.getCurrentState()).toBe('Patrol');
    expect(onEnterPatrol).toHaveBeenCalledWith('Idle');

    sm.transitionTo('Chase');
    expect(onExitPatrol).toHaveBeenCalledWith('Chase');
    expect(sm.getCurrentState()).toBe('Chase');
  });

  it('updates state time correctly', () => {
    const sm = new StateMachine<TestState>('Idle');
    const updateSpy = vi.fn();
    sm.registerState({ name: 'Idle', update: updateSpy });

    sm.update(0.5);
    sm.update(0.5);
    expect(sm.stateTime).toBeCloseTo(1.0);
    expect(updateSpy).toHaveBeenCalledTimes(2);
  });
});
