import { contextBridge, ipcRenderer } from 'electron';
import { ContentVideoContainer } from '@exhumer/f1tv-api';

contextBridge.exposeInMainWorld('player', {
  contentPlay: async (contentId: number, channelId?: number) =>
    await ipcRenderer.invoke('Player:Content-Play', contentId, channelId),
  onContentVideo: (cb: (e: Electron.IpcRendererEvent,
                        result: ContentVideoContainer) => void) => 
    ipcRenderer.on('Player:Content-Video', cb),
});
