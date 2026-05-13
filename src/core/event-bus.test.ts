import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './event-bus';

describe('EventBus', () => {
  it('should call handler when event is emitted', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('mouse:down', handler);
    bus.emit('mouse:down', { x: 10, y: 20 });
    expect(handler).toHaveBeenCalledWith({ x: 10, y: 20 });
  });

  it('should support multiple listeners for same event', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('mouse:down', h1);
    bus.on('mouse:down', h2);
    bus.emit('mouse:down', { x: 0, y: 0 });
    expect(h1).toHaveBeenCalled();
    expect(h2).toHaveBeenCalled();
  });

  it('should not call handler after unsubscribe', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('mouse:up', handler);
    bus.off('mouse:up', handler);
    bus.emit('mouse:up', { x: 0, y: 0, velocityX: 0, velocityY: 0 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should not throw when emitting event with no listeners', () => {
    const bus = new EventBus();
    expect(() => bus.emit('edge:hit', { edge: 'left' })).not.toThrow();
  });

  it('should clear all listeners', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('click', handler);
    bus.clear();
    bus.emit('click', { x: 0, y: 0 });
    expect(handler).not.toHaveBeenCalled();
  });
});
