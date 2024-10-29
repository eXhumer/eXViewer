import type { DecodedAscendonToken, F1TV } from '@exhumer/f1tv-api';
import { contextBridge, ipcRenderer } from 'electron';

import { IPCChannel } from '../type';

contextBridge.exposeInMainWorld('f1tv', {
  onAscendon: (cb: (e: Electron.IpcRendererEvent, ascendon: DecodedAscendonToken | null) => void) =>
    ipcRenderer.on(IPCChannel.F1TV_ASCENDON_UPDATED, cb),
  offAscendon: (cb: (e: Electron.IpcRendererEvent, ascendon: DecodedAscendonToken | null) => void) =>
    ipcRenderer.off(IPCChannel.F1TV_ASCENDON_UPDATED, cb),
  onConfig: (cb: (e: Electron.IpcRendererEvent, config: F1TV.Config | null) => void) =>
    ipcRenderer.on(IPCChannel.F1TV_CONFIG_UPDATED, cb),
  offConfig: (cb: (e: Electron.IpcRendererEvent, config: F1TV.Config | null) => void) =>
    ipcRenderer.off(IPCChannel.F1TV_CONFIG_UPDATED, cb),
  onEntitlement: (cb: (e: Electron.IpcRendererEvent, entitlement: string | null) => void) =>
    ipcRenderer.on(IPCChannel.F1TV_ENTITLEMENT_UPDATED, cb),
  offEntitlement: (cb: (e: Electron.IpcRendererEvent, entitlement: string | null) => void) =>
    ipcRenderer.off(IPCChannel.F1TV_ENTITLEMENT_UPDATED, cb),
  onLocation: (cb: (e: Electron.IpcRendererEvent, location: F1TV.LocationResult | null) => void) =>
    ipcRenderer.on(IPCChannel.F1TV_LOCATION_UPDATED, cb),
  offLocation: (cb: (e: Electron.IpcRendererEvent, location: F1TV.LocationResult | null) => void) =>
    ipcRenderer.off(IPCChannel.F1TV_LOCATION_UPDATED, cb),
  onReady: (cb: (e: Electron.IpcRendererEvent, config: F1TV.Config, location: F1TV.LocationResult) => void) =>
    ipcRenderer.on(IPCChannel.F1TV_READY, cb),
  offReady: (cb: (e: Electron.IpcRendererEvent, config: F1TV.Config, location: F1TV.LocationResult) => void) =>
    ipcRenderer.off(IPCChannel.F1TV_READY, cb),
  login: async () => await ipcRenderer.invoke(IPCChannel.F1TV_LOGIN),
  logout: async () => await ipcRenderer.invoke(IPCChannel.F1TV_LOGOUT),
});

contextBridge.exposeInMainWorld('mainWindow', {
  newPlayer: (contentId: number, platform: string) => ipcRenderer.invoke(IPCChannel.MAIN_WINDOW_NEW_PLAYER, contentId, platform),
  onReadyToShow: (cb: (e: Electron.IpcRendererEvent,
                       decodedAscendon: DecodedAscendonToken | null,
                       entitlement: string | null,
                       config: F1TV.Config | null,
                       location: F1TV.LocationResult | null) => void) =>
    ipcRenderer.on(IPCChannel.MAIN_WINDOW_READY_TO_SHOW, cb),
  offReadyToShow: (cb: (e: Electron.IpcRendererEvent,
                        decodedAscendon: DecodedAscendonToken | null,
                        entitlement: string | null,
                        config: F1TV.Config | null,
                        location: F1TV.LocationResult | null) => void) =>
    ipcRenderer.off(IPCChannel.MAIN_WINDOW_READY_TO_SHOW, cb),
});
