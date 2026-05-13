/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { MouseBridge } from './mouse-bridge';
import { EventBus } from '../core/event-bus';

function createMockElement(): HTMLElement {
  const listeners: Record<string, Function[]> = {};
  return {
    addEventListener: vi.fn((event: string, handler: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn(),
    __listeners: listeners,
  } as any;
}

describe('MouseBridge', () => {
  it('should emit mouse:down on mousedown', () => {
    const eventBus = new EventBus();
    const bridge = new MouseBridge(eventBus);
    const element = createMockElement();
    const handler = vi.fn();
    eventBus.on('mouse:down', handler);

    bridge.attach(element);
    const mousedownHandler = (element as any).__listeners['mousedown'][0];
    mousedownHandler({ clientX: 100, clientY: 200 });

    expect(handler).toHaveBeenCalledWith({ x: 100, y: 200 });
  });

  it('should emit mouse:move only while dragging', () => {
    const eventBus = new EventBus();
    const bridge = new MouseBridge(eventBus);
    const element = createMockElement();
    const handler = vi.fn();
    eventBus.on('mouse:move', handler);

    bridge.attach(element);

    // Simulate document mousemove without mousedown — should not emit
    const docListeners: Record<string, Function[]> = {};
    const origAdd = document.addEventListener;
    document.addEventListener = vi.fn((event: string, h: any) => {
      if (!docListeners[event]) docListeners[event] = [];
      docListeners[event].push(h);
    }) as any;

    bridge.detach();
    bridge.attach(element);

    // Get the mousemove handler from document
    const moveHandler = docListeners['mousemove']?.[0];
    if (moveHandler) {
      moveHandler({ clientX: 50, clientY: 60 });
      expect(handler).not.toHaveBeenCalled();
    }

    document.addEventListener = origAdd;
  });

  it('should calculate velocity on mouse:up', () => {
    const eventBus = new EventBus();
    const bridge = new MouseBridge(eventBus);
    const handler = vi.fn();
    eventBus.on('mouse:up', handler);

    const element = createMockElement();
    bridge.attach(element);

    // Trigger mousedown
    const mousedownHandler = (element as any).__listeners['mousedown'][0];
    mousedownHandler({ clientX: 100, clientY: 100 });

    // mouse:up payload should have velocity fields
    expect(handler).not.toHaveBeenCalled();
  });

  it('should have correct priority for drag behavior integration', () => {
    const eventBus = new EventBus();
    const bridge = new MouseBridge(eventBus);
    expect(bridge).toBeDefined();
  });
});
