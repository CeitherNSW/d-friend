export interface PetContextIpcMain {
  on(channel: string, listener: (event: unknown, payload: { x: number; y: number }) => void): void;
}

export interface PetContextMenuItem {
  label?: string;
  type?: 'separator';
  click?: () => void;
}

export interface PetContextMenu {
  popup(options: { window?: any; x?: number; y?: number }): void;
}

export interface PetContextMenuBuilder {
  buildFromTemplate(template: PetContextMenuItem[]): PetContextMenu;
}

export interface PetContextMenuOptions {
  getWindow: () => any | null;
  onExit: () => void;
  onHideFor30Minutes: () => void;
  onSettings: () => void;
}

export function registerPetContextMenuIpc(
  ipcMain: PetContextIpcMain,
  Menu: PetContextMenuBuilder,
  options: PetContextMenuOptions,
): void {
  ipcMain.on('show-pet-context-menu', (_event, payload) => {
    const window = options.getWindow();
    if (!window) return;

    const menu = Menu.buildFromTemplate([
      { label: 'Exit', click: options.onExit },
      { label: 'Hide 30min', click: options.onHideFor30Minutes },
      { label: 'Settings', click: options.onSettings },
    ]);

    menu.popup({ window, x: payload.x, y: payload.y });
  });
}
