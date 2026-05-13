import { describe, it, expect, vi } from 'vitest';
import { IdleBehavior } from './idle-behavior';
import { BehaviorContext } from '../core/types';

function createCtx(overrides?: Partial<BehaviorContext>): BehaviorContext {
  return {
    position: { x: 100, y: 500 },
    velocity: { x: 0, y: 0 },
    animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
    eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), clear: vi.fn() } as any,
    bounds: { left: 0, right: 1920, top: 0, bottom: 1040, groundY: 1040 },
    elapsed: 0,
    requestTransition: vi.fn(),
    ...overrides,
  };
}

describe('IdleBehavior', () => {
  it('should play idle animation on enter', () => {
    const behavior = new IdleBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    expect(ctx.animation.play).toHaveBeenCalledWith('idle');
    expect(ctx.animation.setLoop).toHaveBeenCalledWith(true);
  });

  it('should zero velocity on enter', () => {
    const behavior = new IdleBehavior();
    const ctx = createCtx({ velocity: { x: 50, y: 10 } });
    behavior.enter(ctx);
    expect(ctx.velocity.x).toBe(0);
    expect(ctx.velocity.y).toBe(0);
  });

  it('should request transition to walk after timeout', () => {
    const behavior = new IdleBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    // Simulate enough time passing (max is 8000ms)
    behavior.update(ctx, 9000);
    expect(ctx.requestTransition).toHaveBeenCalledWith('walk', 'idle-timeout');
  });

  it('should not transition before timeout', () => {
    const behavior = new IdleBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    behavior.update(ctx, 100);
    expect(ctx.requestTransition).not.toHaveBeenCalled();
  });

  it('should allow transition to any behavior', () => {
    const behavior = new IdleBehavior();
    expect(behavior.canTransitionTo('walk')).toBe(true);
    expect(behavior.canTransitionTo('drag')).toBe(true);
  });
});
