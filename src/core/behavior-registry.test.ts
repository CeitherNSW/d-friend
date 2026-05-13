import { describe, it, expect } from 'vitest';
import { BehaviorRegistry } from './behavior-registry';
import { Behavior, BehaviorContext } from './types';

function createMockBehavior(id: string, priority = 0): Behavior {
  return {
    id,
    priority,
    enter(_ctx: BehaviorContext) {},
    update(_ctx: BehaviorContext, _dt: number) {},
    exit(_ctx: BehaviorContext) {},
    canTransitionTo(_nextId: string) { return true; },
  };
}

describe('BehaviorRegistry', () => {
  it('should register and retrieve a behavior', () => {
    const registry = new BehaviorRegistry();
    const behavior = createMockBehavior('idle');
    registry.register(behavior);
    expect(registry.get('idle')).toBe(behavior);
  });

  it('should throw on duplicate registration', () => {
    const registry = new BehaviorRegistry();
    registry.register(createMockBehavior('idle'));
    expect(() => registry.register(createMockBehavior('idle'))).toThrow();
  });

  it('should unregister a behavior', () => {
    const registry = new BehaviorRegistry();
    registry.register(createMockBehavior('walk'));
    registry.unregister('walk');
    expect(registry.get('walk')).toBeUndefined();
  });

  it('should return all registered behaviors', () => {
    const registry = new BehaviorRegistry();
    registry.register(createMockBehavior('idle'));
    registry.register(createMockBehavior('walk'));
    expect(registry.getAll()).toHaveLength(2);
  });

  it('should report has correctly', () => {
    const registry = new BehaviorRegistry();
    registry.register(createMockBehavior('jump'));
    expect(registry.has('jump')).toBe(true);
    expect(registry.has('fly')).toBe(false);
  });
});
