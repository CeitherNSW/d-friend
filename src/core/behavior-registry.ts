import { Behavior } from './types';

export class BehaviorRegistry {
  private behaviors = new Map<string, Behavior>();

  register(behavior: Behavior): void {
    if (this.behaviors.has(behavior.id)) {
      throw new Error(`Behavior "${behavior.id}" is already registered`);
    }
    this.behaviors.set(behavior.id, behavior);
  }

  unregister(id: string): void {
    this.behaviors.delete(id);
  }

  get(id: string): Behavior | undefined {
    return this.behaviors.get(id);
  }

  getAll(): Behavior[] {
    return Array.from(this.behaviors.values());
  }

  has(id: string): boolean {
    return this.behaviors.has(id);
  }
}
