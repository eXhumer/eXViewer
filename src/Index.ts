import { accessSync, constants, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { app, components, globalShortcut, ipcMain, session, BrowserWindow, Menu } from 'electron';
import { F1TV, F1TVClient } from '@exhumer/f1tv-api';

import { AppConfig, IPCChannel, F1TVLoginSession } from './Type';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const PLAYER_PRELOAD_WEBPACK_ENTRY: string;
declare const PLAYER_WEBPACK_ENTRY: string;

const APP_CONFIG_PATH = join(app.getPath('userData'), 'config.json');

const f1tv = new F1TVClient();
let loginWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
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

const playerCtxMenuPopup = (playerWindow: BrowserWindow, cursorLocation?: { x: number, y: number }) => {
  buildPlayerContextMenu(playerWindow)
    .popup(cursorLocation ? {
      x: cursorLocation.x,
      y: cursorLocation.y,
    } : undefined);
};

const createPlayerWindow = (container: F1TV.ContentVideoContainer) => {
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

  playerWindow.on('system-context-menu', e => {
    e.preventDefault();
    playerCtxMenuPopup(playerWindow);
  })

  playerWindow.on('ready-to-show', () => {
    playerWindow.webContents.send(IPCChannel.PLAYER_READY_TO_SHOW, container, f1tv.ascendon, f1tv.config);
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

f1tv.on('ascendonUpdated', () => {
  if (mainWindow !== null)
    mainWindow.webContents.send(IPCChannel.F1TV_ASCENDON_UPDATED, f1tv.ascendon !== null ? f1tv.decodedAscendon : null);
});

f1tv.on('configUpdated', () => {
  if (mainWindow !== null)
    mainWindow.webContents.send(IPCChannel.F1TV_CONFIG_UPDATED, f1tv.config);
});

f1tv.on('entitlementUpdated', () => {
  if (mainWindow !== null)
    mainWindow.webContents.send(IPCChannel.F1TV_ENTITLEMENT_UPDATED, f1tv.entitlement);
});

f1tv.on('locationUpdated', () => {
  if (mainWindow !== null)
    mainWindow.webContents.send(IPCChannel.F1TV_LOCATION_UPDATED, f1tv.location);
});

f1tv.on('ready', () => {
  if (mainWindow !== null)
    mainWindow.webContents.send(IPCChannel.F1TV_READY, f1tv.config, f1tv.location);
});

const DefaultAppConfig: AppConfig = {
  disableHardwareAcceleration: false,
  enableSandbox: true,
};

const createMainWindow = (): void => {
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
          mainWindow.webContents.send(IPCChannel.MAIN_WINDOW_READY_TO_SHOW,
            f1tv.ascendon !== null ? f1tv.decodedAscendon : null,
            f1tv.entitlement,
            f1tv.config,
            f1tv.location);
      });
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (!app.isPackaged)
    mainWindow.webContents.openDevTools();
};

const whenReady = () => {
  globalShortcut.register('F12', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();

    if (focusedWindow !== null)
      focusedWindow.webContents.toggleDevTools();
  });

  // fix Widevine requests
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.startsWith('https://f1tv.formula1.com/') && details.url.indexOf('/widevine') !== -1 && details.requestHeaders.Referer)
      delete details.requestHeaders.Referer;

    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // intercept cookies and update the ascendon token
  session.defaultSession.cookies.on('changed', (e, cookie, cause, removed) => {
    if (cookie.name === 'login-session' && cookie.domain === '.formula1.com') {
      if (removed && (cause === 'explicit' || cause === 'expired')) {
        f1tv.ascendon = null;
      } else {
        const loginSession = JSON.parse(decodeURIComponent(cookie.value)) as F1TVLoginSession;

        if (loginSession.data.subscriptionToken === f1tv.ascendon)
          return;

        f1tv.ascendon = loginSession.data.subscriptionToken;

        if (loginWindow !== null)
          loginWindow.close();
      }
    }
  });

  createMainWindow();
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0)
    createMainWindow();
});

try {
  accessSync(APP_CONFIG_PATH, constants.F_OK | constants.R_OK);
} catch (e) { // eslint-disable-line @typescript-eslint/no-unused-vars
  writeFileSync(APP_CONFIG_PATH, JSON.stringify(DefaultAppConfig));
} finally {
  const config = JSON.parse(readFileSync(APP_CONFIG_PATH, { encoding: 'utf-8' })) as AppConfig;

  if (config.disableHardwareAcceleration) {
    console.log('Disabling hardware acceleration!');
    app.disableHardwareAcceleration();
  }

  if (config.enableSandbox) {
    console.log('Enabling sandbox!');
    app.enableSandbox();
  }
}

app
  .whenReady()
  .then(async () => await components.whenReady())
  .then(whenReady);

ipcMain.handle(IPCChannel.PLAYER_CONTENT_PLAY, async (e, contentId: number, channelId?: number) => {
  if (f1tv.ascendon === null)
    return;

  const apiRes = await f1tv.contentPlay(contentId, channelId);

  return apiRes.resultObj;
});

ipcMain.handle(IPCChannel.PLAYER_CONTEXT_MENU, async (e, cursorLocation: { x: number, y: number }) => {
  const senderWindow = BrowserWindow.fromWebContents(e.sender);

  if (senderWindow === null)
    throw new Error('senderWindow === null | Failed to get sender window!');

  playerCtxMenuPopup(senderWindow, cursorLocation);
});

ipcMain.handle(IPCChannel.MAIN_WINDOW_NEW_PLAYER, async (e, contentId: number) => {
  if (f1tv.ascendon === null)
    return;

  const apiRes = await f1tv.contentVideo(contentId);

  createPlayerWindow(apiRes);
});

ipcMain.handle(IPCChannel.F1TV_LOGIN, async () => {
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

ipcMain.handle(IPCChannel.F1TV_LOGOUT, async () => {
  if (f1tv.ascendon === null)
    return;

  await session.defaultSession.cookies.remove('https://f1tv.formula1.com', 'login-session');
  f1tv.ascendon = null;
});
