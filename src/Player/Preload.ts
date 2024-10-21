import { contextBridge, ipcRenderer } from 'electron';
import { IPCChannel } from '../Type';
import { F1TV } from '@exhumer/f1tv-api';

contextBridge.exposeInMainWorld('player', {
  contentPlay: async (contentId: number, channelId?: number) =>
    await ipcRenderer.invoke(IPCChannel.PLAYER_CONTENT_PLAY, contentId, channelId),
  contextMenu: async (cursor_location: { x: number, y: number }) =>
    await ipcRenderer.invoke(IPCChannel.PLAYER_CONTEXT_MENU, cursor_location),
  onReadyToShow: (cb: (e: Electron.IpcRendererEvent,
                       videoContainer: F1TV.ContentVideoContainer,
                       ascendon: string,
                       config: F1TV.Config) => void) =>
    ipcRenderer.on(IPCChannel.PLAYER_READY_TO_SHOW, cb),
  offReadyToShow: (cb: (e: Electron.IpcRendererEvent,
                        videoContainer: F1TV.ContentVideoContainer,
                        ascendon: string,
                        config: F1TV.Config) => void) =>
    ipcRenderer.off(IPCChannel.PLAYER_READY_TO_SHOW, cb),
});
