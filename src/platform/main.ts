import { app, BrowserWindow, ipcMain, Menu, nativeImage, screen, Tray } from 'electron';
import path from 'path';
import { registerMousePassthroughIpc } from './mouse-passthrough-ipc';
import { createTrayController, TrayController } from './tray-controller';
import { ConfigStore, DEFAULT_PET_CONFIG } from './config-store';
import { registerConfigIpc } from './config-ipc';
import { registerPetContextMenuIpc } from './pet-context-menu-ipc';

let mainWindow: BrowserWindow | null = null;
let trayController: TrayController | null = null;
let configStore: ConfigStore | null = null;

registerMousePassthroughIpc(ipcMain, () => mainWindow);

function createTrayIcon() {
  const petIconPngBase64 = [
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1B',
    'AACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJASURBVFhH7Vc9SBxBFLa0tEyZMp0o',
    'HAiCnEiMeCRgUGJ+N9zumCOVEAhKiksg4Zy5gFilChYpQiqrYGFhm0qbQCBNrLQSixQhzXvh',
    'm3jL7Zubdedci2A++IrbefO+2bdvvpkbGPiPfxHcjAa5HVcdNqNBGVsq2CSPySRbZNQvNop7',
    '0Y7rpCHnngt4O9JqX4rlkXTyjUw8I3MFg9aSZZk8hNRW6zJnYZBWmzJhPySttoP7g028IhOd',
    'h2SSj1LDC3w7maAMFm7O0IYrStLqiNejIamXAVYpJ3a492yRf7di57lkXhxp1ZKaGZBRu3IS',
    'kt2bGOPx4WG+URnl41eRk7hoHLan1EyB8vQymc+NOZu0ww9RzUkcEsdvl65JbQtrpzLYKPsm',
    'k6MjaeKvz+86MSFxcFSpbUFratEN/suDFw/4/cNZ/rK84IyFx8UrUtsirwFLpVYvpbYFSuME',
    'XwS9C/D0QPn09AC3nlx1gy+A7bgqtVP4XPDn63quwXQT3X/YfOQ8B+GGUjMDfB85Cdy4M223',
    'FozGt72wuPb8dRu3NDXujJ8uYFNqZmDNCJ4tJn5fvc83xyrpHn8zN2WNBlsOxG+4H8bgBTtP',
    'b7viMDmfCXXDdwnBZ4BQt9tJ5lUo6HKCu51M0CGq8al+y5Z7tVa1FUA1YEIyNhVHb4VcShDs',
    'a8hQkkl+YIdJjTNxejg5p2MI7Uv0I94NnOG9TsmzSEa9Cyp7HthEV7CFSKsTKZQR1eoE979',
    'C3d4vrGXDLwRL+R9w6fAH39Yd7fQxQm8AAAAASUVORK5CYII=',
  ].join('');

  return nativeImage.createFromBuffer(Buffer.from(petIconPngBase64, 'base64'));
}

function createWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    transparent: true,
    frame: false,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  trayController?.bindWindow(mainWindow);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  trayController = createTrayController({
    app,
    Menu,
    Tray,
    icon: createTrayIcon(),
    getWindow: () => mainWindow,
  });
  trayController.init();
}

app.whenReady().then(() => {
  configStore = new ConfigStore(app, DEFAULT_PET_CONFIG);
  registerConfigIpc(ipcMain, configStore);
  registerPetContextMenuIpc(ipcMain, Menu, {
    getWindow: () => mainWindow,
    onExit: () => {
      if (trayController) {
        trayController.requestQuit();
      } else {
        app.quit();
      }
    },
    onHideFor30Minutes: () => {
      mainWindow?.hide();
    },
    onSettings: () => {},
  });
  createWindow();
  createTray();
});

app.on('activate', () => {
  if (!mainWindow) {
    createWindow();
  } else {
    trayController?.showWindow();
  }
});

app.on('window-all-closed', () => {
  // Keep the app alive in the system tray until the user chooses Quit.
});
