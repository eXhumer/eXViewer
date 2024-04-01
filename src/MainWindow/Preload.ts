import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('f1tv', {
  onSubscriptionToken: (cb: (e: Electron.IpcRendererEvent,
                             ascendon: string | null) => void) => 
    ipcRenderer.on('F1TV:Subscription-Token', cb),
  location: async () => await ipcRenderer.invoke('F1TV:Location'),
  login: async () => await ipcRenderer.invoke('F1TV:Login'),
  logout: async () => await ipcRenderer.invoke('F1TV:Logout'),
  whenLocationReady: async () => await ipcRenderer.invoke('F1TV:When-Location-Ready'),
});
