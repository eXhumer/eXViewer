import { app, BrowserWindow } from 'electron';

declare const PLAYER_WEBPACK_ENTRY: string;
declare const PLAYER_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup'))
  app.quit();

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: PLAYER_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(PLAYER_WEBPACK_ENTRY);

  mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
