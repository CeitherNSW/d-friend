import { describe, it, expect, vi } from 'vitest';
import { registerMousePassthroughIpc } from './mouse-passthrough-ipc';

describe('registerMousePassthroughIpc', () => {
  it('should forward renderer mouse passthrough changes to the active window', () => {
    let listener: (_event: unknown, ignore: boolean) => void = () => {};
    const ipcMain = {
      on: vi.fn((_channel: string, handler: (_event: unknown, ignore: boolean) => void) => {
        listener = handler;
      }),
    };
    const win = { setIgnoreMouseEvents: vi.fn() };

    registerMousePassthroughIpc(ipcMain, () => win);
    listener({}, false);

    expect(ipcMain.on).toHaveBeenCalledWith('set-ignore-mouse-events', expect.any(Function));
    expect(win.setIgnoreMouseEvents).toHaveBeenCalledWith(false, { forward: true });
  });
});
