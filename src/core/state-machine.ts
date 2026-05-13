import { Behavior, BehaviorContext } from './types';
import { BehaviorRegistry } from './behavior-registry';
import { EventBus } from './event-bus';

export class BehaviorStateMachine {
  private current: Behavior | null = null;
  private ctx: BehaviorContext;
  private registry: BehaviorRegistry;
  private eventBus: EventBus;

  constructor(registry: BehaviorRegistry, ctx: BehaviorContext, eventBus: EventBus) {
    this.registry = registry;
    this.ctx = ctx;
    this.eventBus = eventBus;
    this.ctx.requestTransition = this.requestTransition.bind(this);
  }

  start(initialId: string): void {
    const behavior = this.registry.get(initialId);
    if (!behavior) {
      throw new Error(`Behavior "${initialId}" not found in registry`);
    }
    this.current = behavior;
    this.ctx.elapsed = 0;
    this.current.enter(this.ctx);
  }

  requestTransition(nextId: string, reason: string): boolean {
    const next = this.registry.get(nextId);
    if (!next || !this.current) return false;

    if (next.priority >= this.current.priority) {
      return this.doTransition(next, reason);
    }

    if (this.current.canTransitionTo(nextId)) {
      return this.doTransition(next, reason);
    }

    return false;
  }

  private doTransition(next: Behavior, reason: string): boolean {
    const fromId = this.current!.id;
    this.current!.exit(this.ctx);
    this.current = next;
    this.ctx.elapsed = 0;
    this.current.enter(this.ctx);
    this.eventBus.emit('behavior:changed', { from: fromId, to: next.id, reason });
    return true;
  }

  update(dt: number): void {
    if (this.current) {
      this.ctx.elapsed += dt;
      this.current.update(this.ctx, dt);
    }
  }

  getCurrentBehavior(): Behavior | null {
    return this.current;
  }
}
