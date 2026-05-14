import { describe, expect, it, vi } from 'vitest';
import { createTrayController } from './tray-controller';

class MockTray {
  static instances: MockTray[] = [];

  tooltip = '';
  contextMenu: unknown = null;
  destroyed = false;
  handlers = new Map<string, () => void>();

  constructor(public icon: unknown) {
    MockTray.instances.push(this);
  }

  setToolTip(value: string): void {
    this.tooltip = value;
  }

  setContextMenu(menu: unknown): void {
    this.contextMenu = menu;
  }

  on(event: string, handler: () => void): void {
    this.handlers.set(event, handler);
  }

  destroy(): void {
    this.destroyed = true;
  }
}

function createMockWindow(initialVisible = true) {
  let visible = initialVisible;
  const closeHandlers: Array<(event: { preventDefault: () => void }) => void> = [];

  return {
    show: vi.fn(() => {
      visible = true;
    }),
    hide: vi.fn(() => {
      visible = false;
    }),
    isVisible: vi.fn(() => visible),
    on: vi.fn((event: string, handler: (event: { preventDefault: () => void }) => void) => {
      if (event === 'close') {
        closeHandlers.push(handler);
      }
    }),
    emitClose(event: { preventDefault: () => void }): void {
      closeHandlers.forEach((handler) => handler(event));
    },
  };
}

function createController(initialVisible = true) {
  MockTray.instances = [];
  const window = createMockWindow(initialVisible);
  const appHandlers = new Map<string, () => void>();
  const app = {
    on: vi.fn((event: string, handler: () => void) => {
      appHandlers.set(event, handler);
    }),
    quit: vi.fn(),
  };
  const Menu = {
    buildFromTemplate: vi.fn((template: unknown[]) => template),
  };
  const controller = createTrayController({
    app,
    Menu,
    Tray: MockTray,
    icon: 'icon',
    getWindow: () => window,
  });

  return { app, appHandlers, controller, Menu, window };
}

describe('TrayController', () => {
  it('should create tray menu with show, hide, and quit actions', () => {
    const { controller, Menu } = createController();

    controller.init();

    const tray = MockTray.instances[0];
    expect(tray.tooltip).toBe('d-friend');
    expect(Menu.buildFromTemplate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ label: 'Show Pet' }),
      expect.objectContaining({ label: 'Hide Pet' }),
      expect.objectContaining({ label: 'Quit' }),
    ]));
    expect(tray.contextMenu).toBe(Menu.buildFromTemplate.mock.results[0].value);
  });

  it('should hide the window instead of closing it', () => {
    const { controller, window } = createController();
    const closeEvent = { preventDefault: vi.fn() };

    controller.init();
    window.emitClose(closeEvent);

    expect(closeEvent.preventDefault).toHaveBeenCalled();
    expect(window.hide).toHaveBeenCalled();
  });

  it('should toggle window visibility on tray double click', () => {
    const { controller, window } = createController(false);

    controller.init();
    const tray = MockTray.instances[0];
    tray.handlers.get('double-click')?.();
    expect(window.show).toHaveBeenCalled();

    tray.handlers.get('double-click')?.();
    expect(window.hide).toHaveBeenCalled();
  });

  it('should destroy tray and quit app from quit action', () => {
    const { app, controller, Menu } = createController();

    controller.init();
    const quitItem = (Menu.buildFromTemplate.mock.calls[0][0] as Array<{ label: string; click: () => void }>)
      .find((item) => item.label === 'Quit');
    quitItem?.click();

    expect(MockTray.instances[0].destroyed).toBe(true);
    expect(app.quit).toHaveBeenCalled();
  });
});
