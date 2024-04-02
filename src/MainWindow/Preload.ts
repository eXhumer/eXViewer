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

contextBridge.exposeInMainWorld('f1tv', {
  onSubscriptionToken: (cb: (e: Electron.IpcRendererEvent,
                             ascendon: string | null) => void) => 
    ipcRenderer.on('F1TV:Subscription-Token', cb),
  location: async () => await ipcRenderer.invoke('F1TV:Location'),
  login: async () => await ipcRenderer.invoke('F1TV:Login'),
  logout: async () => await ipcRenderer.invoke('F1TV:Logout'),
  whenLocationReady: async () => await ipcRenderer.invoke('F1TV:When-Location-Ready'),
});

contextBridge.exposeInMainWorld('exviewer', {
  newPlayer: (contentId: number) => ipcRenderer.invoke('eXViewer:New-Player', contentId),
});
