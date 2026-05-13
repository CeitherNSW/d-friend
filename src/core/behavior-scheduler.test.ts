import { describe, it, expect, vi } from 'vitest';
import { BehaviorScheduler } from './behavior-scheduler';
import { BehaviorStateMachine } from './state-machine';
import { BehaviorRegistry } from './behavior-registry';
import { EventBus } from './event-bus';
import { Behavior, BehaviorContext } from './types';

function createBehavior(id: string, priority: number): Behavior {
  return {
    id,
    priority,
    enter: vi.fn(),
    update: vi.fn(),
    exit: vi.fn(),
    canTransitionTo: () => true,
  };
}

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

describe('BehaviorScheduler', () => {
  it('should not trigger before interval', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const idle = createBehavior('idle', 0);
    const walk = createBehavior('walk', 1);
    registry.register(idle);
    registry.register(walk);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');

    const requestSpy = vi.spyOn(sm, 'requestTransition');
    const scheduler = new BehaviorScheduler(sm, [{ behaviorId: 'walk', weight: 1 }], 5000);
    scheduler.start();
    scheduler.update(1000);

    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('should trigger transition after interval when idle', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const idle = createBehavior('idle', 0);
    const walk = createBehavior('walk', 1);
    registry.register(idle);
    registry.register(walk);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');

    const requestSpy = vi.spyOn(sm, 'requestTransition');
    const scheduler = new BehaviorScheduler(sm, [{ behaviorId: 'walk', weight: 1 }], 5000);
    scheduler.start();
    scheduler.update(5000);

    expect(requestSpy).toHaveBeenCalledWith('walk', 'scheduler');
  });

  it('should not trigger when not idle', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const idle = createBehavior('idle', 0);
    const walk = createBehavior('walk', 1);
    registry.register(idle);
    registry.register(walk);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');
    sm.requestTransition('walk', 'test');

    const requestSpy = vi.spyOn(sm, 'requestTransition');
    requestSpy.mockClear();

    const scheduler = new BehaviorScheduler(sm, [{ behaviorId: 'walk', weight: 1 }], 5000);
    scheduler.start();
    scheduler.update(5000);

    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('should not trigger when inactive', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const idle = createBehavior('idle', 0);
    registry.register(idle);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');

    const requestSpy = vi.spyOn(sm, 'requestTransition');
    const scheduler = new BehaviorScheduler(sm, [{ behaviorId: 'walk', weight: 1 }], 5000);
    scheduler.update(5000);

    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('should respect weighted selection', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const idle = createBehavior('idle', 0);
    const walk = createBehavior('walk', 1);
    const jump = createBehavior('jump', 2);
    registry.register(idle);
    registry.register(walk);
    registry.register(jump);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');

    const requestSpy = vi.spyOn(sm, 'requestTransition');
    const scheduler = new BehaviorScheduler(sm, [
      { behaviorId: 'walk', weight: 100 },
      { behaviorId: 'jump', weight: 0 },
    ], 100);
    scheduler.start();
    scheduler.update(100);

    expect(requestSpy).toHaveBeenCalledWith('walk', 'scheduler');
  });
});
