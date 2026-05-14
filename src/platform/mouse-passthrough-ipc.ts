export const SET_IGNORE_MOUSE_EVENTS_CHANNEL = 'set-ignore-mouse-events';

export interface IpcMainLike {
  on(channel: string, listener: (event: unknown, ignore: boolean) => void): void;
}

export interface MousePassthroughWindow {
  setIgnoreMouseEvents(ignore: boolean, options?: { forward: boolean }): void;
}

export function registerMousePassthroughIpc(
  ipcMain: IpcMainLike,
  getWindow: () => MousePassthroughWindow | null,
): void {
  ipcMain.on(SET_IGNORE_MOUSE_EVENTS_CHANNEL, (_event, ignore) => {
    getWindow()?.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
  });
}
