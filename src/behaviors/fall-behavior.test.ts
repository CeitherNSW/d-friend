import { describe, it, expect, vi } from 'vitest';
import { FallBehavior } from './fall-behavior';
import { BehaviorContext } from '../core/types';

function createCtx(overrides?: Partial<BehaviorContext>): BehaviorContext {
  return {
    position: { x: 500, y: 500 },
    velocity: { x: 0, y: 0 },
    animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
    eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), clear: vi.fn() } as any,
    bounds: { left: 0, right: 1920, top: 0, bottom: 1040, groundY: 1040 },
    elapsed: 0,
    requestTransition: vi.fn(),
    ...overrides,
  };
}

describe('FallBehavior', () => {
  it('should play fall animation on enter', () => {
    const behavior = new FallBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    expect(ctx.animation.play).toHaveBeenCalledWith('fall');
  });

  it('should apply gravity during update', () => {
    const behavior = new FallBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    behavior.update(ctx, 100);
    expect(ctx.velocity.y).toBeGreaterThan(0);
    expect(ctx.position.y).toBeGreaterThan(500);
  });

  it('should read fall physics settings from config', () => {
    const behavior = new FallBehavior();
    const ctx = createCtx({
      config: {
        get: vi.fn((key: string, fallback: number) => {
          if (key === 'fall.gravityPxPerSecondSquared') return 1000;
          if (key === 'fall.bounceDamping') return 0.5;
          if (key === 'fall.bounceThresholdPxPerSecond') return 40;
          return fallback;
        }),
      } as any,
    } as Partial<BehaviorContext>);

    behavior.enter(ctx);
    behavior.update(ctx, 100);

    expect(ctx.velocity.y).toBe(100);
    expect(ctx.position.y).toBe(510);
  });

  it('should bounce when hitting ground with high velocity', () => {
    const behavior = new FallBehavior();
    const ctx = createCtx({ position: { x: 500, y: 1050 }, velocity: { x: 0, y: 200 } });
    behavior.enter(ctx);
    behavior.update(ctx, 16);
    expect(ctx.position.y).toBe(1040);
    expect(ctx.velocity.y).toBeLessThan(0); // bounced upward
    expect(behavior.getBounceCount()).toBe(1);
  });

  it('should settle and transition to idle when velocity is low', () => {
    const behavior = new FallBehavior();
    const ctx = createCtx({ position: { x: 500, y: 1050 }, velocity: { x: 0, y: 30 } });
    behavior.enter(ctx);
    behavior.update(ctx, 16);
    expect(ctx.requestTransition).toHaveBeenCalledWith('idle', 'fall-settled');
  });

  it('should clamp horizontal position at edges', () => {
    const behavior = new FallBehavior();
    const ctx = createCtx({ position: { x: -10, y: 500 }, velocity: { x: -200, y: 100 } });
    behavior.enter(ctx);
    behavior.update(ctx, 16);
    expect(ctx.position.x).toBe(0);
  });

  it('should only allow transition to idle or drag', () => {
    const behavior = new FallBehavior();
    expect(behavior.canTransitionTo('idle')).toBe(true);
    expect(behavior.canTransitionTo('drag')).toBe(true);
    expect(behavior.canTransitionTo('walk')).toBe(false);
  });
});
