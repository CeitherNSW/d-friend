export interface EventMap {
  'mouse:down': { x: number; y: number };
  'mouse:up': { x: number; y: number; velocityX: number; velocityY: number };
  'mouse:move': { x: number; y: number };
  'edge:hit': { edge: 'left' | 'right' | 'top' | 'bottom' };
  'behavior:changed': { from: string; to: string; reason: string };
  'click': { x: number; y: number };
  'dblclick': { x: number; y: number };
  'contextmenu': { x: number; y: number };
}

type EventHandler<T> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventHandler<any>>>();

  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}
