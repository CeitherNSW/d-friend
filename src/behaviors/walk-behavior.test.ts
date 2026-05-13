import { describe, it, expect, vi } from 'vitest';
import { WalkBehavior } from './walk-behavior';
import { BehaviorContext } from '../core/types';

function createCtx(overrides?: Partial<BehaviorContext>): BehaviorContext {
  return {
    position: { x: 500, y: 1040 },
    velocity: { x: 0, y: 0 },
    animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
    eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), clear: vi.fn() } as any,
    bounds: { left: 0, right: 1920, top: 0, bottom: 1040, groundY: 1040 },
    elapsed: 0,
    requestTransition: vi.fn(),
    ...overrides,
  };
}

describe('WalkBehavior', () => {
  it('should play walk animation on enter', () => {
    const behavior = new WalkBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    expect(ctx.animation.play).toHaveBeenCalledWith('walk');
  });

  it('should set horizontal velocity on enter', () => {
    const behavior = new WalkBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    expect(Math.abs(ctx.velocity.x)).toBe(80);
  });

  it('should move position on update', () => {
    const behavior = new WalkBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    const startX = ctx.position.x;
    behavior.update(ctx, 1000);
    expect(ctx.position.x).not.toBe(startX);
  });

  it('should reverse direction at left edge', () => {
    const behavior = new WalkBehavior();
    const ctx = createCtx({ position: { x: -10, y: 1040 } });
    behavior.enter(ctx);
    ctx.velocity.x = -80;
    behavior.update(ctx, 16);
    expect(ctx.position.x).toBe(0);
    expect(ctx.eventBus.emit).toHaveBeenCalledWith('edge:hit', { edge: 'left' });
  });

  it('should reverse direction at right edge', () => {
    const behavior = new WalkBehavior();
    const ctx = createCtx({ position: { x: 1930, y: 1040 } });
    behavior.enter(ctx);
    ctx.velocity.x = 80;
    behavior.update(ctx, 16);
    expect(ctx.position.x).toBe(1920);
    expect(ctx.eventBus.emit).toHaveBeenCalledWith('edge:hit', { edge: 'right' });
  });

  it('should request transition to idle after timeout', () => {
    const behavior = new WalkBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    behavior.update(ctx, 7000);
    expect(ctx.requestTransition).toHaveBeenCalledWith('idle', 'walk-timeout');
  });

  it('should zero velocity on exit', () => {
    const behavior = new WalkBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    behavior.exit(ctx);
    expect(ctx.velocity.x).toBe(0);
  });
});
