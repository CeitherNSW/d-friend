import type { NativeImage } from 'electron';

export type TrayIcon = string | NativeImage;

export interface TrayWindow {
  show(): void;
  hide(): void;
  isVisible(): boolean;
  on(event: 'close', handler: (event: { preventDefault(): void }) => void): void;
}

export interface TrayApp {
  on(event: 'before-quit', handler: () => void): void;
  quit(): void;
}

export interface TrayLike {
  setToolTip(value: string): void;
  setContextMenu(menu: unknown): void;
  on(event: 'double-click', handler: () => void): void;
  destroy(): void;
}

export interface TrayConstructor {
  new (icon: TrayIcon): TrayLike;
}

export interface MenuTemplateItem {
  label?: string;
  type?: 'separator';
  click?: () => void;
}

export interface MenuLike {
  buildFromTemplate(template: MenuTemplateItem[]): unknown;
}

export interface TrayControllerOptions {
  app: TrayApp;
  Menu: MenuLike;
  Tray: TrayConstructor;
  icon: TrayIcon;
  getWindow: () => TrayWindow | null;
}

export interface TrayController {
  init(): void;
  bindWindow(window: TrayWindow): void;
  showWindow(): void;
  hideWindow(): void;
  toggleWindow(): void;
  requestQuit(): void;
  dispose(): void;
  isQuitting(): boolean;
}

export function createTrayController(options: TrayControllerOptions): TrayController {
  let tray: TrayLike | null = null;
  let quitting = false;
  const boundWindows = new WeakSet<TrayWindow>();

  function showWindow(): void {
    options.getWindow()?.show();
  }

  function hideWindow(): void {
    options.getWindow()?.hide();
  }

  function toggleWindow(): void {
    const window = options.getWindow();
    if (!window) return;

    if (window.isVisible()) {
      window.hide();
    } else {
      window.show();
    }
  }

  function dispose(): void {
    tray?.destroy();
    tray = null;
  }

  function requestQuit(): void {
    quitting = true;
    dispose();
    options.app.quit();
  }

  function bindWindow(window: TrayWindow): void {
    if (boundWindows.has(window)) return;
    boundWindows.add(window);
    window.on('close', (event) => {
      if (quitting) return;
      event.preventDefault();
      window.hide();
    });
  }

  function init(): void {
    if (tray) return;

    tray = new options.Tray(options.icon);
    tray.setToolTip('d-friend');
    tray.setContextMenu(options.Menu.buildFromTemplate([
      { label: 'Show Pet', click: showWindow },
      { label: 'Hide Pet', click: hideWindow },
      { type: 'separator' },
      { label: 'Quit', click: requestQuit },
    ]));
    tray.on('double-click', toggleWindow);
    options.app.on('before-quit', () => {
      quitting = true;
      dispose();
    });

    const window = options.getWindow();
    if (window) {
      bindWindow(window);
    }
  }

  return {
    init,
    bindWindow,
    showWindow,
    hideWindow,
    toggleWindow,
    requestQuit,
    dispose,
    isQuitting: () => quitting,
  };
}
