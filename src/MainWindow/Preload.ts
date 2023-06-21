/*
  eXViewer - Live timing and content streaming client for F1TV
  Copyright © 2023 eXhumer

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

import { contextBridge, ipcRenderer } from "electron";
import { name } from "../../package.json";

contextBridge.exposeInMainWorld(name, {
  electronVersion: () => ipcRenderer.invoke("Info:Electron-Version"),
  nodejsVersion: () => ipcRenderer.invoke("Info:NodeJS-Version"),
  openGitHubProject: () => ipcRenderer.invoke("Info:Open-GitHub-Project"),
  openGPLLicense: () => ipcRenderer.invoke("Info:Open-GPL-License"),
});
