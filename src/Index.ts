import { accessSync, constants, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { app, components, globalShortcut, ipcMain, session, BrowserWindow } from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const APP_CONFIG_PATH = join(app.getPath('userData'), 'config.json');

let ascendon: string | null = null;
let loginWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;

type F1TVLoginSessionData = {
  subscriptionToken: string;
};

type F1TVLoginSession = {
  data: F1TVLoginSessionData;
};

type AppConfig = {
  disableHardwareAcceleration?: boolean;
  enableSandbox?: boolean;
};

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

          if (ascendon !== loginSession.data.subscriptionToken)
            ascendon = loginSession.data.subscriptionToken;
        }

        if (mainWindow !== null)
          mainWindow.webContents.send('F1TV:Login-Session', ascendon);
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
    if (cookie.name === 'login-session' && cookie.domain.endsWith('.formula1.com')) {
      if (removed) {
        ascendon = null;
      } else {
        const loginSession = JSON.parse(decodeURIComponent(cookie.value)) as F1TVLoginSession;
        ascendon = loginSession.data.subscriptionToken;

        if (loginWindow !== null)
          loginWindow.close();
      }

      if (mainWindow !== null)
        mainWindow.webContents.send('F1TV:Login-Session', ascendon);
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

ipcMain.handle('F1TV:Login', async () => {
  if (ascendon !== null)
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
    if (ascendon === null)
      console.warn('F1TV:Login | Login window closed without login!');

    loginWindow = null;
  });

  loginWindow.loadURL('https://account.formula1.com/#/en/login');

  if (!app.isPackaged)
    loginWindow.webContents.openDevTools();
});

ipcMain.handle('F1TV:Login-Session', () => ascendon);

ipcMain.handle('F1TV:Logout', async () => {
  if (ascendon === null)
    return;

  await session.defaultSession.cookies.remove('https://f1tv.formula1.com', 'login-session');
  ascendon = null;
  mainWindow?.webContents.send('F1TV:Login-Session', ascendon);
});
