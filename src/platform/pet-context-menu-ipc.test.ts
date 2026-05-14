import { describe, expect, it, vi } from 'vitest';
import { registerPetContextMenuIpc } from './pet-context-menu-ipc';

describe('registerPetContextMenuIpc', () => {
  it('should build and show the pet context menu with PRD actions', () => {
    const handlers: Array<(event: unknown, payload: { x: number; y: number }) => void> = [];
    const ipcMain = {
      on: vi.fn((_channel: string, registered: (event: unknown, payload: { x: number; y: number }) => void) => {
        handlers.push(registered);
      }),
    };
    const popup = vi.fn();
    const buildFromTemplate = vi.fn((template: unknown[]) => ({ popup }));
    const Menu = {
      buildFromTemplate,
    };
    const window = {};
    const onExit = vi.fn();
    const onHideFor30Minutes = vi.fn();
    const onSettings = vi.fn();

    registerPetContextMenuIpc(ipcMain, Menu, {
      getWindow: () => window,
      onExit,
      onHideFor30Minutes,
      onSettings,
    });
    handlers[0]({}, { x: 320, y: 240 });

    expect(buildFromTemplate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ label: 'Exit' }),
      expect.objectContaining({ label: 'Hide 30min' }),
      expect.objectContaining({ label: 'Settings' }),
    ]));
    expect(popup).toHaveBeenCalledWith({ window, x: 320, y: 240 });

    const template = buildFromTemplate.mock.calls[0][0] as Array<{ label: string; click: () => void }>;
    template.find((item) => item.label === 'Exit')?.click();
    template.find((item) => item.label === 'Hide 30min')?.click();
    template.find((item) => item.label === 'Settings')?.click();

    expect(onExit).toHaveBeenCalled();
    expect(onHideFor30Minutes).toHaveBeenCalled();
    expect(onSettings).toHaveBeenCalled();
  });
});
