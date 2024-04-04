/*
  eXViewer - Unofficial live timing and content streaming client for F1TV
  Copyright (C) 2024  eXhumer

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { contextBridge, ipcRenderer } from 'electron';
import { ContentVideoContainer } from '@exhumer/f1tv-api';

contextBridge.exposeInMainWorld('player', {
  contentPlay: async (contentId: number, channelId?: number) =>
    await ipcRenderer.invoke('Player:Content-Play', contentId, channelId),
  contextMenu: async (cursor_location: { x: number, y: number }) =>
    await ipcRenderer.invoke('Player:Context-Menu', cursor_location),
  onContentVideo: (cb: (e: Electron.IpcRendererEvent,
                        result: ContentVideoContainer) => void) => 
    ipcRenderer.on('Player:Content-Video', cb),
});
