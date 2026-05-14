import { describe, it, expect, vi } from 'vitest';
import { JumpBehavior } from './jump-behavior';
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

describe('JumpBehavior', () => {
  it('should set upward velocity on enter', () => {
    const behavior = new JumpBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    expect(ctx.velocity.y).toBe(-400);
  });

  it('should read jump settings from config', () => {
    const behavior = new JumpBehavior();
    const ctx = createCtx({
      config: {
        get: vi.fn((key: string, fallback: number) => {
          if (key === 'jump.velocityYPxPerSecond') return -600;
          if (key === 'jump.gravityPxPerSecondSquared') return 1000;
          return fallback;
        }),
      } as any,
    } as Partial<BehaviorContext>);

    behavior.enter(ctx);
    expect(ctx.velocity.y).toBe(-600);
    behavior.update(ctx, 100);
    expect(ctx.velocity.y).toBe(-500);
  });

  it('should play jump animation on enter', () => {
    const behavior = new JumpBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    expect(ctx.animation.play).toHaveBeenCalledWith('jump');
    expect(ctx.animation.setLoop).toHaveBeenCalledWith(false);
  });

  it('should apply gravity during update', () => {
    const behavior = new JumpBehavior();
    const ctx = createCtx({ position: { x: 500, y: 800 } });
    behavior.enter(ctx);
    const initialVy = ctx.velocity.y;
    behavior.update(ctx, 100);
    expect(ctx.velocity.y).toBeGreaterThan(initialVy);
  });

  it('should land when reaching groundY', () => {
    const behavior = new JumpBehavior();
    const ctx = createCtx({ position: { x: 500, y: 1035 } });
    behavior.enter(ctx);
    ctx.velocity.y = 200; // falling
    behavior.update(ctx, 100);
    expect(ctx.position.y).toBe(1040);
    expect(ctx.requestTransition).toHaveBeenCalledWith('idle', 'jump-landed');
  });

  it('should clamp at left edge', () => {
    const behavior = new JumpBehavior();
    const ctx = createCtx({ position: { x: -5, y: 800 } });
    behavior.enter(ctx);
    ctx.velocity.x = -100;
    behavior.update(ctx, 16);
    expect(ctx.position.x).toBe(0);
  });

  it('should only allow drag transition while airborne', () => {
    const behavior = new JumpBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    expect(behavior.canTransitionTo('drag')).toBe(true);
    expect(behavior.canTransitionTo('idle')).toBe(false);
  });

  it('should allow any transition after landing', () => {
    const behavior = new JumpBehavior();
    const ctx = createCtx({ position: { x: 500, y: 1050 } });
    behavior.enter(ctx);
    ctx.velocity.y = 100;
    behavior.update(ctx, 16);
    expect(behavior.canTransitionTo('idle')).toBe(true);
    expect(behavior.canTransitionTo('walk')).toBe(true);
  });
});
