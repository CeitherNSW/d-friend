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
  it('should use PRD default weights when no weights are supplied', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    registry.register(createBehavior('idle', 0));
    registry.register(createBehavior('walk', 1));
    registry.register(createBehavior('jump', 2));
    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');

    const requestSpy = vi.spyOn(sm, 'requestTransition');
    const scheduler = new BehaviorScheduler(sm, undefined, 100, {
      random: () => 0.75,
    });
    scheduler.start();
    scheduler.update(100);

    expect(requestSpy).toHaveBeenCalledWith('walk', 'scheduler');
  });

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

  it('should follow weighted distribution over many iterations', () => {
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

    const samples = [
      ...Array.from({ length: 300 }, (_, index) => (index + 0.5) / 400),
      ...Array.from({ length: 100 }, (_, index) => 0.75 + (index + 0.5) / 400),
    ];
    let sampleIndex = 0;
    const counts = { walk: 0, jump: 0 };
    const scheduler = new BehaviorScheduler(sm, [
      { behaviorId: 'walk', weight: 3 },
      { behaviorId: 'jump', weight: 1 },
    ], 1, {
      random: () => samples[sampleIndex++ % samples.length],
    });
    scheduler.start();

    for (let index = 0; index < 400; index++) {
      scheduler.update(1);
      const current = sm.getCurrentBehavior()?.id;
      if (current === 'walk' || current === 'jump') {
        counts[current]++;
        sm.requestTransition('idle', 'test-reset');
      }
    }

    expect(counts.walk).toBe(300);
    expect(counts.jump).toBe(100);
  });

  it('should skip behaviors that are still cooling down', () => {
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
      { behaviorId: 'walk', weight: 1 },
      { behaviorId: 'jump', weight: 1 },
    ], 100, {
      cooldowns: { jump: 20000 },
      random: () => 0.99,
    });
    scheduler.start();
    scheduler.update(100);
    expect(requestSpy).toHaveBeenCalledWith('jump', 'scheduler');

    sm.requestTransition('idle', 'test-reset');
    requestSpy.mockClear();
    scheduler.update(100);

    expect(requestSpy).toHaveBeenCalledWith('walk', 'scheduler');
  });

  it('should pause scheduling after user interaction', () => {
    const registry = new BehaviorRegistry();
    const eventBus = new EventBus();
    const idle = createBehavior('idle', 0);
    const walk = createBehavior('walk', 1);
    registry.register(idle);
    registry.register(walk);

    const sm = new BehaviorStateMachine(registry, createCtx(eventBus), eventBus);
    sm.start('idle');

    const requestSpy = vi.spyOn(sm, 'requestTransition');
    const scheduler = new BehaviorScheduler(sm, [{ behaviorId: 'walk', weight: 1 }], 1000, {
      interactionPauseMs: 3000,
    });
    scheduler.start();
    scheduler.pauseAfterInteraction();

    scheduler.update(1000);
    scheduler.update(2000);
    expect(requestSpy).not.toHaveBeenCalled();

    scheduler.update(1000);
    expect(requestSpy).toHaveBeenCalledWith('walk', 'scheduler');
  });
});
