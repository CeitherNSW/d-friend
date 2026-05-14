import { describe, it, expect, vi } from 'vitest';
import { DragBehavior } from './drag-behavior';
import { BehaviorContext } from '../core/types';
import { EventBus } from '../core/event-bus';

function createCtx(overrides?: Partial<BehaviorContext>): BehaviorContext {
  return {
    position: { x: 500, y: 500 },
    velocity: { x: 0, y: 0 },
    animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
    eventBus: new EventBus(),
    bounds: { left: 0, right: 1920, top: 0, bottom: 1040, groundY: 1040 },
    elapsed: 0,
    requestTransition: vi.fn(),
    ...overrides,
  };
}

describe('DragBehavior', () => {
  it('should have highest priority', () => {
    const behavior = new DragBehavior();
    expect(behavior.priority).toBe(100);
  });

  it('should play drag animation on enter', () => {
    const behavior = new DragBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    expect(ctx.animation.play).toHaveBeenCalledWith('drag');
  });

  it('should zero velocity on enter', () => {
    const behavior = new DragBehavior();
    const ctx = createCtx({ velocity: { x: 100, y: 50 } });
    behavior.enter(ctx);
    expect(ctx.velocity.x).toBe(0);
    expect(ctx.velocity.y).toBe(0);
  });

  it('should follow mouse position on mouse:move', () => {
    const behavior = new DragBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    ctx.eventBus.emit('mouse:move', { x: 700, y: 300 });
    expect(ctx.position.x).toBe(700);
    expect(ctx.position.y).toBe(300);
  });

  it('should request transition to fall on mouse:up', () => {
    const behavior = new DragBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    ctx.eventBus.emit('mouse:up', { x: 500, y: 500, velocityX: 0, velocityY: 0 });
    expect(ctx.requestTransition).toHaveBeenCalledWith('fall', 'drag-release');
  });

  it('should only allow transition to fall', () => {
    const behavior = new DragBehavior();
    expect(behavior.canTransitionTo('fall')).toBe(true);
    expect(behavior.canTransitionTo('idle')).toBe(false);
    expect(behavior.canTransitionTo('walk')).toBe(false);
  });

  it('should remove mouse listeners on exit', () => {
    const behavior = new DragBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);
    behavior.exit(ctx);

    ctx.eventBus.emit('mouse:move', { x: 700, y: 300 });
    ctx.eventBus.emit('mouse:up', { x: 700, y: 300, velocityX: 0, velocityY: 0 });

    expect(ctx.position).toEqual({ x: 500, y: 500 });
    expect(ctx.requestTransition).not.toHaveBeenCalled();
  });

  it('should compute velocity from the previous mouse sample', () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(0);
    const behavior = new DragBehavior();
    const ctx = createCtx();
    behavior.enter(ctx);

    nowSpy.mockReturnValueOnce(100);
    ctx.eventBus.emit('mouse:move', { x: 700, y: 500 });
    nowSpy.mockReturnValueOnce(200);
    ctx.eventBus.emit('mouse:move', { x: 720, y: 500 });

    expect(ctx.velocity.x).toBe(200);
    nowSpy.mockRestore();
  });
});
