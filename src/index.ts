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

import { app, ipcMain, session, BrowserWindow } from "electron";
import { F1LiveTimingClient, F1TVClient } from "./client";
import { LoginSession } from "./type";

if (require("electron-squirrel-startup"))
  app.quit();

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const f1tvClient = new F1TVClient();
const ltClient = new F1LiveTimingClient();
let loginWindow: Electron.BrowserWindow | null = null;
let mainWindow: Electron.BrowserWindow | null = null;

const createMainWindow = () => {
  if (mainWindow !== null) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("ready-to-show", () => {
    session.defaultSession.cookies.get({ url: "https://f1tv.formula1.com", name: "login-session" }).then(cookies => {
      if (cookies.length > 0 && f1tvClient === null) {
        const loginSession = JSON.parse(decodeURIComponent(cookies[0].value)) as LoginSession;
        const ascendon = loginSession.data.subscriptionToken;
        f1tvClient.ascendon = ascendon;
      }

      if (mainWindow === null)
        return;

      mainWindow.webContents.send("F1TV:Login-State",
        f1tvClient !== null ?
          f1tvClient.ascendon :
          null);
    });  
  });
};

ltClient.on("connected", () => {
  if (mainWindow === null)
    return;

  mainWindow.webContents.send("Live-Timing:Connected");
});

ltClient.on("disconnected", reason => {
  if (mainWindow === null)
    return;

  mainWindow.webContents.send("Live-Timing:Disconnected", reason);
});

ltClient.on("error", err => {
  if (mainWindow === null)
    return;

  mainWindow.webContents.send("Live-Timing:Error", err);
});

ltClient.on("feed", (topic, data, timestamp) => {
  if (mainWindow === null)
    return;

  mainWindow.webContents.send("Live-Timing:Feed", topic, data, timestamp);
});

ltClient.on("reconnecting", count => {
  if (mainWindow === null)
    return;

  mainWindow.webContents.send("Live-Timing:Reconnecting", count);
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0)
    createMainWindow();
});

app.on("before-quit", () => {
  ltClient.End();
});

app.on("ready", () => {
  session.defaultSession.cookies.on("changed", (e, cookie, cause, removed) => {
    if (cookie.name === "login-session") {
      if (removed)
        f1tvClient.ascendon = null;

      else {
        console.log(cookie, cause);
        const loginSession = JSON.parse(decodeURIComponent(cookie.value)) as LoginSession;
        const ascendon = loginSession.data.subscriptionToken;
        f1tvClient.ascendon = ascendon;

        if (loginWindow === null)
          return;

        loginWindow.close();
      }

      if (mainWindow === null)
        return;

      mainWindow.webContents.send("F1TV:Login-State", f1tvClient !== null ? f1tvClient.ascendon : null);
    }
  });

  createMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin")
    app.quit();
});

ipcMain.handle("F1TV:Login", async () => {
  // Ignore if already have already logged in
  if (f1tvClient !== null)
    return;

  // Focus on login window if already open
  if (loginWindow !== null) {
    loginWindow.focus();
    return;
  }

  // Create login window if not logged in and not already open
  loginWindow = new BrowserWindow({
    parent: mainWindow,
  });

  loginWindow.on("closed", () => {
    loginWindow = null;
  });

  loginWindow.loadURL("https://account.formula1.com/#/en/login");
});

ipcMain.handle("F1TV:Logout", async () => {
  if (f1tvClient === null)
    return;

  await session.defaultSession.cookies.remove("https://f1tv.formula1.com", "login-session");
  f1tvClient.ascendon = null;
  return true;
});

ipcMain.handle("F1TV:Refresh-Location", () => {
  if (f1tvClient === null) {
    mainWindow.webContents.send("F1TV:Error", "F1TV client not initialized yet!");
    return;
  }

  f1tvClient.refreshLocation()
    .then(() => {
      if (mainWindow === null)
        return;

      mainWindow.webContents.send("F1TV:Location", f1tvClient.currentLocation);
    })
    .catch(err => {
      if (mainWindow === null)
        return;

      mainWindow.webContents.send("F1TV:Error", err);
    });
});

ipcMain.handle("Live-Timing:Connection-State", () => {
  return ltClient.ConnectionState();
});

ipcMain.handle("Live-Timing:End", () => {
  return ltClient.End();
});

ipcMain.handle("Live-Timing:Start", () => {
  return ltClient.Start();
});

ipcMain.handle("Live-Timing:Subscribe", async (e, ...topics: string[]) => {
  return await ltClient.Subscribe(topics);
});

ipcMain.handle("Live-Timing:Unsubscribe", (e, ...topics: string[]) => {
  return ltClient.Unsubscribe(topics);
});
