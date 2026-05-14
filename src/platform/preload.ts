import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore);
  },
  showPetContextMenu: (position: { x: number; y: number }) => {
    ipcRenderer.send('show-pet-context-menu', position);
  },
  getConfig: () => {
    return ipcRenderer.invoke('config:get-all');
  },
  setConfig: (key: string, value: unknown) => {
    return ipcRenderer.invoke('config:set', key, value);
  },
});
