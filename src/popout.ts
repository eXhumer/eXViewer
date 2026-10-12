import { BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import { PlayerChannel, type PopOutRequest } from './shared/player';

const POP_OUT_WIDTH = 480;
const POP_OUT_HEIGHT = Math.round((POP_OUT_WIDTH * 9) / 16);
/** Gap from the screen edge, and the step between successive windows. */
const MARGIN = 24;
const CASCADE_STEP = 32;

const popOuts = new Set<BrowserWindow>();

/** Loads the renderer page into a window, at the given hash route. */
export function loadRenderer(window: BrowserWindow, hash = '') {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    return window.loadURL(
      hash
        ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}#${hash}`
        : MAIN_WINDOW_VITE_DEV_SERVER_URL,
    );
  }
  return window.loadFile(
    path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    { hash },
  );
}

/** The hash route PopOutView reads (see main_window/PopOutView.tsx). */
function popOutRoute({ contentId, channelId, start }: PopOutRequest) {
  const params = new URLSearchParams({ contentId: String(contentId) });
  if (channelId !== undefined) {
    params.set('channelId', String(channelId));
  }
  if (start && 'time' in start) {
    params.set('time', String(start.time));
  } else if (start) {
    params.set('behindLive', String(start.behindLive));
  }
  return `popout?${params}`;
}

/**
 * Opens a feed in a frameless 16:9 window that floats above other apps, like
 * picture-in-picture but as many as wanted. New windows start in the
 * bottom-right corner, each a step up and left from the last open one.
 */
function openPopOut(request: PopOutRequest) {
  const { workArea } = screen.getPrimaryDisplay();
  const step = (popOuts.size % 8) * CASCADE_STEP;
  const window = new BrowserWindow({
    x: workArea.x + workArea.width - POP_OUT_WIDTH - MARGIN - step,
    y: workArea.y + workArea.height - POP_OUT_HEIGHT - MARGIN - step,
    width: POP_OUT_WIDTH,
    height: POP_OUT_HEIGHT,
    minWidth: 240,
    minHeight: 135,
    frame: false,
    fullscreenable: false,
    backgroundColor: '#000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  window.setAspectRatio(16 / 9);
  window.setAlwaysOnTop(true, 'floating');

  popOuts.add(window);
  window.on('closed', () => popOuts.delete(window));
  void loadRenderer(window, popOutRoute(request));
}

/** Closes every pop-out window. */
export function closePopOuts() {
  for (const window of popOuts) {
    window.close();
  }
}

/** Registers the pop-out IPC handler. */
export function initPopOuts() {
  ipcMain.handle(PlayerChannel.PopOut, (_event, request: PopOutRequest) =>
    openPopOut(request),
  );
}
