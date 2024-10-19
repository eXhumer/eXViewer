import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('f1tv', {
  onLoginSession: (cb: (e: Electron.IpcRendererEvent, ascendon: string | null) => void) => 
    ipcRenderer.on('F1TV:Login-Session', cb),
  offLoginSession: (cb: (e: Electron.IpcRendererEvent, ascendon: string | null) => void) =>
    ipcRenderer.removeListener('F1TV:Login-Session', cb),
  login: async () => await ipcRenderer.invoke('F1TV:Login'),
  loginSession: async () => await ipcRenderer.invoke('F1TV:Login-Session'),
  logout: async () => await ipcRenderer.invoke('F1TV:Logout'),
});
