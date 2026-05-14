import { ConfigStore } from './config-store';
import { ConfigValue } from '../core/config';

export interface ConfigIpcMain {
  handle(channel: string, listener: (_event: unknown, ...args: any[]) => unknown): void;
}

export function registerConfigIpc(ipcMain: ConfigIpcMain, configStore: ConfigStore): void {
  ipcMain.handle('config:get-all', () => configStore.getAll());
  ipcMain.handle('config:get', (_event, key: string, defaultValue: ConfigValue) => {
    return configStore.get(key, defaultValue);
  });
  ipcMain.handle('config:set', (_event, key: string, value: ConfigValue) => {
    configStore.set(key, value);
  });
}
