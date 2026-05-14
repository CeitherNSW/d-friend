import { describe, expect, it, vi } from 'vitest';
import { registerConfigIpc } from './config-ipc';

describe('registerConfigIpc', () => {
  it('should expose config get, get-all, and set handlers', () => {
    const handlers = new Map<string, (_event: unknown, ...args: any[]) => unknown>();
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (_event: unknown, ...args: any[]) => unknown) => {
        handlers.set(channel, handler);
      }),
    };
    const configStore = {
      getAll: vi.fn(() => ({ walk: { speedPxPerSecond: 80 } })),
      get: vi.fn(() => 80),
      set: vi.fn(),
    } as any;

    registerConfigIpc(ipcMain, configStore);

    expect(handlers.get('config:get-all')?.({}, 'ignored')).toEqual({ walk: { speedPxPerSecond: 80 } });
    expect(handlers.get('config:get')?.({}, 'walk.speedPxPerSecond', 0)).toBe(80);
    handlers.get('config:set')?.({}, 'walk.speedPxPerSecond', 120);

    expect(configStore.get).toHaveBeenCalledWith('walk.speedPxPerSecond', 0);
    expect(configStore.set).toHaveBeenCalledWith('walk.speedPxPerSecond', 120);
  });
});
