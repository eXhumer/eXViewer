import { app, BrowserWindow, session } from 'electron';
import path from 'node:path';
import { initAuth } from './auth';
import { initCatalog } from './catalog';
import { flushHistory } from './history';
import { readConfig } from './config';
import { initPlayer } from './f1tv';
import { closePopOuts, initPopOuts, loadRenderer } from './popout';
import { loadWidevine, warnWidevineUnavailable } from './widevine';

const config = readConfig();

// Must run before the app is ready.
if (config.disableHardwareAcceleration === true) {
  app.disableHardwareAcceleration();
}

// Keep in sync with --title-bar-height in main_window/index.css.
const TITLE_BAR_HEIGHT = 32;
/** The title bar strip and window background; keep in sync with index.css. */
const TITLE_BAR_COLOR = '#101018';
const APP_BACKGROUND = '#15151e';

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // Hide the title bar but keep the window controls. macOS keeps its traffic
    // lights; Windows and Linux draw the controls as an overlay.
    titleBarStyle: 'hidden',
    ...(process.platform !== 'darwin' && {
      titleBarOverlay: {
        height: TITLE_BAR_HEIGHT,
        // Matches .title-bar in index.css.
        color: TITLE_BAR_COLOR,
        symbolColor: '#ffffff',
      },
    }),
    // No white flash before the page paints.
    backgroundColor: APP_BACKGROUND,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // and load the index.html of the app.
  void loadRenderer(mainWindow);
  // Pop-out feeds belong to the main window's player.
  mainWindow.on('closed', closePopOuts);

  // Open the DevTools under `npm start`, not in the packaged app.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Load the Widevine CDM (needed for F1TV playback) before showing the app.
  const [widevineReady] = await Promise.all([loadWidevine(), initAuth()]);
  initPlayer(session.defaultSession);
  initCatalog();
  initPopOuts();
  createWindow();
  if (!widevineReady) {
    warnWidevineUnavailable();
  }

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// Saves the last watch position before the app goes.
app.on('will-quit', flushHistory);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
