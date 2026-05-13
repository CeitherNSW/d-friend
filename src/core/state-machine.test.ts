import { describe, it, expect, vi } from 'vitest';
import { BehaviorStateMachine } from './state-machine';
import { BehaviorRegistry } from './behavior-registry';
import { EventBus } from './event-bus';
import { Behavior, BehaviorContext } from './types';

function createCtx(eventBus: EventBus): BehaviorContext {
  return {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
    eventBus,
    bounds: { left: 0, right: 1920, top: 0, bottom: 1040, groundY: 1040 },
    elapsed: 0,
    requestTransition: () => {},
  };
}

function createBehavior(id: string, priority: number, canTransition = true): Behavior {
  return {
    id,
    priority,
    enter: vi.fn(),
    update: vi.fn(),
    exit: vi.fn(),
    canTransitionTo: () => canTransition,
  };
}

describe('BehaviorStateMachine', () => {
  it('should start with initial behavior', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const idle = createBehavior('idle', 0);
    registry.register(idle);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');

    expect(sm.getCurrentBehavior()).toBe(idle);
    expect(idle.enter).toHaveBeenCalled();
  });

  it('should transition when next has higher priority', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const idle = createBehavior('idle', 0);
    const drag = createBehavior('drag', 100);
    registry.register(idle);
    registry.register(drag);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');
    const result = sm.requestTransition('drag', 'user-drag');

    expect(result).toBe(true);
    expect(idle.exit).toHaveBeenCalled();
    expect(drag.enter).toHaveBeenCalled();
    expect(sm.getCurrentBehavior()).toBe(drag);
  });

  it('should reject transition to lower priority when canTransitionTo is false', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const drag = createBehavior('drag', 100, false);
    const idle = createBehavior('idle', 0);
    registry.register(drag);
    registry.register(idle);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('drag');
    const result = sm.requestTransition('idle', 'auto');

    expect(result).toBe(false);
    expect(sm.getCurrentBehavior()).toBe(drag);
  });

  it('should allow transition to lower priority when canTransitionTo is true', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const drag = createBehavior('drag', 100, true);
    const idle = createBehavior('idle', 0);
    registry.register(drag);
    registry.register(idle);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('drag');
    const result = sm.requestTransition('idle', 'release');

    expect(result).toBe(true);
    expect(sm.getCurrentBehavior()).toBe(idle);
  });

  it('should emit behavior:changed event on transition', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const handler = vi.fn();
    eventBus.on('behavior:changed', handler);

    const idle = createBehavior('idle', 0);
    const walk = createBehavior('walk', 1);
    registry.register(idle);
    registry.register(walk);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');
    sm.requestTransition('walk', 'auto-schedule');

    expect(handler).toHaveBeenCalledWith({ from: 'idle', to: 'walk', reason: 'auto-schedule' });
  });

  it('should call update on current behavior', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const idle = createBehavior('idle', 0);
    registry.register(idle);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');
    sm.update(16);

    expect(idle.update).toHaveBeenCalled();
  });

  it('should throw when starting with unknown behavior', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    expect(() => sm.start('nonexistent')).toThrow();
  });
});
