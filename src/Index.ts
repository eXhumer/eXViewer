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

import { app, components, ipcMain, shell, BrowserWindow } from "electron";
import { F1LiveTimingClient } from "./Client";
import { repository } from "../package.json";

declare const MAINWINDOW_WEBPACK_ENTRY: string;
declare const MAINWINDOW_PRELOAD_WEBPACK_ENTRY: string;

const ltClient = new F1LiveTimingClient();

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAINWINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAINWINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();
  mainWindow.setMenu(null);
};

const onReady = async () => {
  await components.whenReady();
  createMainWindow();
};

app.on("ready", onReady);

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin")
    app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0)
    createMainWindow();
});

ipcMain.handle("Info:Electron-Version", () => process.versions.electron);
ipcMain.handle("Info:NodeJS-Version", () => process.versions.node);
ipcMain.handle("Info:Open-GitHub-Project", async () => { await shell.openExternal(repository.url); });
ipcMain.handle("Info:Open-GPL-License", async () => { await shell.openExternal("https://www.gnu.org/licenses/"); });
