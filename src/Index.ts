import { app, session, BrowserWindow, ipcMain } from 'electron';
import { F1TVLoginSession } from './Type';
import { F1TVClient } from '@exhumer/f1tv-api';

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
// declare const PLAYER_PRELOAD_WEBPACK_ENTRY: string;
// declare const PLAYER_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup'))
  app.quit();

let loginWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
const f1tv = new F1TVClient();

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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('ready-to-show', () => {
    session.defaultSession.cookies
      .get({ url: 'https://f1tv.formula1.com', name: 'login-session' })
      .then((cookies) => {
        if (cookies.length > 0) {
          const loginSession = JSON.parse(decodeURIComponent(cookies[0].value)) as F1TVLoginSession;
          f1tv.ascendon = loginSession.data.subscriptionToken;
        }

        if (mainWindow !== null)
          mainWindow.webContents.send('F1TV:Subscription-Token', f1tv.ascendon);
      });
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.webContents.openDevTools();
};

// const createPlayerWindow = (): void => {
//   const mainWindow = new BrowserWindow({
//     height: 600,
//     width: 800,
//     webPreferences: {
//       preload: PLAYER_PRELOAD_WEBPACK_ENTRY,
//     },
//   });

//   mainWindow.loadURL(PLAYER_WEBPACK_ENTRY);

//   mainWindow.webContents.openDevTools();
// };

app.on('ready', () => {
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
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
  });

  loginWindow.on('closed', () => {
    loginWindow = null;
  });

  loginWindow.loadURL("https://account.formula1.com/#/en/login");
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
