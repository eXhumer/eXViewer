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

import { app, components, globalShortcut, session, BrowserWindow, ipcMain, Menu } from 'electron';
import { AppConfig, F1TVLoginSession } from './Type';
import { ContentVideoContainer, F1TVClient } from '@exhumer/f1tv-api';
import { join } from 'path';
import { accessSync, constants, readFileSync, writeFileSync } from 'fs';

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const PLAYER_PRELOAD_WEBPACK_ENTRY: string;
declare const PLAYER_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup'))
  app.quit();

const APP_CONFIG_PATH = join(app.getPath('userData'), 'config.json');
const WM_INITMENU = 0x0116;

let loginWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
const f1tv = new F1TVClient();
const activePlayerWindows: BrowserWindow[] = [];

const buildPlayerContextMenu = (playerWindow: BrowserWindow) => {
  return Menu.buildFromTemplate([
    {
      label: 'Close',
      click: () => {
        playerWindow.close();
      }
    },
  ]);
};

const createPlayerWindow = (container: ContentVideoContainer) => {
  const playerWindow = new BrowserWindow({
    minHeight: 270,
    minWidth: 480,
    height: 720,
    width: 1280,
    backgroundColor: '#303030',
    frame: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: PLAYER_PRELOAD_WEBPACK_ENTRY,
    },
  });

  playerWindow.setAspectRatio(16 / 9);

  // Workaround for draggable frameless window in Windows
  // https://github.com/electron/electron/issues/24893#issuecomment-1109262719
  if (process.platform === 'win32')
    playerWindow.hookWindowMessage(WM_INITMENU, () => {
      playerWindow.setEnabled(false);
      playerWindow.setEnabled(true);
      playerCtxMenuPopup(playerWindow);
    });

  playerWindow.on('ready-to-show', () => {
    playerWindow.webContents.send('Player:Player-Data', container, f1tv.ascendon);
  });

  playerWindow.on('closed', () => {
    const index = activePlayerWindows.indexOf(playerWindow);

    if (index !== -1)
      activePlayerWindows.splice(index, 1);
  });

  playerWindow.loadURL(PLAYER_WEBPACK_ENTRY);

  if (!app.isPackaged)
    playerWindow.webContents.openDevTools();

  activePlayerWindows.push(playerWindow);
};

const createMainWindow = () => {
  if (mainWindow !== null) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('ready-to-show', () => {
    session.defaultSession.cookies
      .get({ url: 'https://f1tv.formula1.com', name: 'login-session' })
      .then((cookies) => {
        if (cookies.length > 0) {
          const loginSession = JSON.parse(decodeURIComponent(cookies[0].value)) as F1TVLoginSession;

          if (f1tv.ascendon !== loginSession.data.subscriptionToken)
            f1tv.ascendon = loginSession.data.subscriptionToken;
        }

        if (mainWindow !== null)
          mainWindow.webContents.send('F1TV:Subscription-Token', f1tv.ascendon);
      });
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (!app.isPackaged)
    mainWindow.webContents.openDevTools();
};

const playerCtxMenuPopup = (playerWindow: BrowserWindow, cursorLocation?: { x: number, y: number }) => {
  buildPlayerContextMenu(playerWindow)
    .popup(cursorLocation ? {
      x: cursorLocation.x,
      y: cursorLocation.y,
    } : undefined);
};

const whenReady = () => {
  globalShortcut.register('F12', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();

    if (focusedWindow !== null)
      focusedWindow.webContents.toggleDevTools();
  });

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.startsWith('https://f1tv.formula1.com/') && details.url.indexOf('/widevine') !== -1 && details.requestHeaders.Referer)
      delete details.requestHeaders.Referer;

    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });


  // intercept cookies and update the ascendon token
  session.defaultSession.cookies.on('changed', (e, cookie, cause, removed) => {
    if (cookie.name === 'login-session' && cookie.domain.endsWith('.formula1.com')) {
      if (removed) {
        f1tv.ascendon = null;
      } else {
        const loginSession = JSON.parse(decodeURIComponent(cookie.value)) as F1TVLoginSession;
        f1tv.ascendon = loginSession.data.subscriptionToken;

        if (loginWindow !== null)
          loginWindow.close();
      }

      if (mainWindow !== null)
        mainWindow.webContents.send('F1TV:Subscription-Token', f1tv.ascendon);
    }
  });

  createMainWindow();
};

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0)
    createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit();
});

app.enableSandbox();

try {
  accessSync(APP_CONFIG_PATH, constants.F_OK | constants.R_OK);
} catch (e) {
  writeFileSync(APP_CONFIG_PATH, JSON.stringify({}));
} finally {
  const config = JSON.parse(readFileSync(APP_CONFIG_PATH, { encoding: 'utf-8' })) as AppConfig;

  if (config.disableHardwareAcceleration) {
    console.log('Disabling hardware acceleration!');
    app.disableHardwareAcceleration();
  }
}

app
  .whenReady()
  .then(async () => await components.whenReady())
  .then(whenReady);

ipcMain.handle('Player:Content-Play', async (e, contentId: number, channelId?: number) => {
  if (f1tv.ascendon === null)
    return;

  const apiRes = await f1tv.contentPlay(contentId, channelId);

  return apiRes.resultObj;
});

ipcMain.handle('Player:Context-Menu', async (e, cursorLocation: { x: number, y: number }) => {
  const senderWindow = BrowserWindow.fromWebContents(e.sender);

  if (senderWindow === null)
    throw new Error('senderWindow === null | Failed to get sender window!');

  playerCtxMenuPopup(senderWindow, cursorLocation);
});

ipcMain.handle('eXViewer:New-Player', async (e, contentId: number) => {
  if (f1tv.ascendon === null)
    return;

  const apiRes = await f1tv.contentVideo(contentId);

  createPlayerWindow(apiRes);
});

ipcMain.handle('F1TV:Login', async () => {
  if (f1tv.ascendon !== null)
    return;

  if (loginWindow !== null) {
    loginWindow.focus();
    return;
  }

  loginWindow = new BrowserWindow({
    height: 600,
    width: 800,
    parent: mainWindow,
    webPreferences: {
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  loginWindow.on('closed', () => {
    if (f1tv.ascendon === null)
      console.warn('F1TV:Login | Login window closed without login!');

    loginWindow = null;
  });

  loginWindow.loadURL('https://account.formula1.com/#/en/login');

  if (!app.isPackaged)
    loginWindow.webContents.openDevTools();
});

ipcMain.handle('F1TV:Logout', async () => {
  if (f1tv.ascendon === null)
    return;

  await session.defaultSession.cookies.remove('https://f1tv.formula1.com', 'login-session');
  f1tv.ascendon = null;
});

ipcMain.handle('F1TV:Location', async () => {
  return f1tv.location;
});

ipcMain.handle('F1TV:When-Location-Ready', async () => {
  await f1tv.whenLocationReady();
});
