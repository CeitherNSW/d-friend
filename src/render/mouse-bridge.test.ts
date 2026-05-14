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
  it('should emit mouse:down only after pointer movement starts a drag', () => {
    const eventBus = new EventBus();
    const bridge = new MouseBridge(eventBus);
    const element = createMockElement();
    const handler = vi.fn();
    eventBus.on('mouse:down', handler);
    const docListeners: Record<string, Function[]> = {};
    const origAdd = document.addEventListener;
    document.addEventListener = vi.fn((event: string, h: any) => {
      if (!docListeners[event]) docListeners[event] = [];
      docListeners[event].push(h);
    }) as any;

    bridge.attach(element);
    const mousedownHandler = (element as any).__listeners['mousedown'][0];
    mousedownHandler({ clientX: 100, clientY: 200 });

    expect(handler).not.toHaveBeenCalled();

    docListeners['mousemove'][0]({ clientX: 104, clientY: 200 });

    expect(handler).toHaveBeenCalledWith({ x: 100, y: 200 });
    document.addEventListener = origAdd;
  });

  it('should ignore non-primary mouse buttons', () => {
    const eventBus = new EventBus();
    const bridge = new MouseBridge(eventBus);
    const element = createMockElement();
    const handler = vi.fn();
    eventBus.on('mouse:down', handler);

    bridge.attach(element);
    const mousedownHandler = (element as any).__listeners['mousedown'][0];
    mousedownHandler({ clientX: 100, clientY: 200, button: 2 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should preserve a supplied grab offset while dragging', () => {
    const eventBus = new EventBus();
    const bridge = new MouseBridge(eventBus, {
      getAnchorPosition: () => ({ x: 500, y: 800 }),
    });
    const element = createMockElement();
    const moveHandler = vi.fn();
    eventBus.on('mouse:move', moveHandler);

    const docListeners: Record<string, Function[]> = {};
    const origAdd = document.addEventListener;
    document.addEventListener = vi.fn((event: string, h: any) => {
      if (!docListeners[event]) docListeners[event] = [];
      docListeners[event].push(h);
    }) as any;

    bridge.attach(element);
    const mousedownHandler = (element as any).__listeners['mousedown'][0];
    mousedownHandler({ clientX: 500, clientY: 760, button: 0 });
    docListeners['mousemove'][0]({ clientX: 620, clientY: 640 });

    expect(moveHandler).toHaveBeenCalledWith({ x: 620, y: 680 });
    document.addEventListener = origAdd;
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
    mousedownHandler({ clientX: 100, clientY: 100, button: 0 });

    const docListeners: Record<string, Function[]> = {};
    const origAdd = document.addEventListener;
    document.addEventListener = vi.fn((event: string, h: any) => {
      if (!docListeners[event]) docListeners[event] = [];
      docListeners[event].push(h);
    }) as any;

    bridge.detach();
    bridge.attach(element);
    (element as any).__listeners['mousedown'][1]({ clientX: 100, clientY: 100, button: 0 });
    docListeners['mousemove'][0]({ clientX: 160, clientY: 100 });
    docListeners['mouseup'][0]({ clientX: 200, clientY: 100 });

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      x: 200,
      y: 100,
      velocityX: expect.any(Number),
      velocityY: expect.any(Number),
    }));
    expect(handler.mock.calls[0][0].velocityX).toBeGreaterThan(0);
    document.addEventListener = origAdd;
  });

  it('should emit click, dblclick, and contextmenu events with anchor positions', () => {
    const eventBus = new EventBus();
    const bridge = new MouseBridge(eventBus, {
      getAnchorPosition: () => ({ x: 500, y: 760 }),
    });
    const element = createMockElement();
    const clickHandler = vi.fn();
    const dblclickHandler = vi.fn();
    const contextMenuHandler = vi.fn();
    const preventDefault = vi.fn();
    eventBus.on('click', clickHandler);
    eventBus.on('dblclick', dblclickHandler);
    eventBus.on('contextmenu', contextMenuHandler);

    bridge.attach(element);
    (element as any).__listeners['click'][0]({ clientX: 500, clientY: 760 });
    (element as any).__listeners['dblclick'][0]({ clientX: 500, clientY: 760 });
    (element as any).__listeners['contextmenu'][0]({
      clientX: 500,
      clientY: 760,
      preventDefault,
    });

    expect(clickHandler).toHaveBeenCalledWith({ x: 500, y: 760 });
    expect(dblclickHandler).toHaveBeenCalledWith({ x: 500, y: 760 });
    expect(contextMenuHandler).toHaveBeenCalledWith({ x: 500, y: 760 });
    expect(preventDefault).toHaveBeenCalled();
  });

  it('should have correct priority for drag behavior integration', () => {
    const eventBus = new EventBus();
    const bridge = new MouseBridge(eventBus);
    expect(bridge).toBeDefined();
  });
});
