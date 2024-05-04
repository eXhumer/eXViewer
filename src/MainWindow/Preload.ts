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
import { IPCChannel } from '../Type';

contextBridge.exposeInMainWorld('f1tv', {
  onSubscriptionToken: (cb: (e: Electron.IpcRendererEvent,
                             ascendon: string | null) => void) => 
    ipcRenderer.on(IPCChannel.F1TV.SUBSCRIPTION_TOKEN, cb),
  offSubscriptionToken: (cb: (e: Electron.IpcRendererEvent,
                              ascendon: string | null) => void) =>
    ipcRenderer.removeListener(IPCChannel.F1TV.SUBSCRIPTION_TOKEN, cb),
  location: async () => await ipcRenderer.invoke(IPCChannel.F1TV.LOCATION),
  login: async () => await ipcRenderer.invoke(IPCChannel.F1TV.LOGIN),
  logout: async () => await ipcRenderer.invoke(IPCChannel.F1TV.LOGOUT),
  whenLocationReady: async () => await ipcRenderer.invoke(IPCChannel.F1TV.WHEN_LOCATION_READY),
});

contextBridge.exposeInMainWorld('exviewer', {
  newPlayer: (contentId: number) => ipcRenderer.invoke(IPCChannel.eXViewer.NEW_PLAYER, contentId),
});

window.addEventListener('DOMContentLoaded', () => {
  console.log(process.versions);
});
