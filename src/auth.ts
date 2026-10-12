import { BrowserWindow, dialog, ipcMain, session, type Cookie } from 'electron';
import { AuthChannel, type AuthState } from './shared/auth';

const LOGIN_URL = 'https://account.formula1.com/#/en/login';
const COOKIE_DOMAIN = '.formula1.com';
const LOGIN_SESSION_COOKIE = 'login-session';
const USER_METADATA_COOKIE = 'user-metadata';
/** Holds the id.formula1.com access token; the subscription token is a claim in it. */
const ACCESS_TOKEN_COOKIE = 'auth-session';
/** F1's sign-in provider (PingOne). The login page redirects here and back. */
const IDENTITY_ORIGIN = 'https://id.formula1.com';
// Persistent partition, so the F1 cookies survive app restarts.
const LOGIN_PARTITION = 'persist:f1-login';

/** Token issued by formula1.com on login. Empty while logged out. */
let ascendonToken = '';
/** Parsed value of the user-metadata cookie. Null while logged out. */
let userMetadata: unknown = null;
let loginWindow: BrowserWindow | null = null;
let pendingLogin: Promise<boolean> | null = null;

const getLoginSession = () => session.fromPartition(LOGIN_PARTITION);

const getState = (): AuthState => ({ loggedIn: ascendonToken !== '' });

export const getAscendonToken = () => ascendonToken;
export const getUserMetadata = () => userMetadata;

function broadcastState() {
  const state = getState();
  for (const window of BrowserWindow.getAllWindows()) {
    if (window !== loginWindow) {
      window.webContents.send(AuthChannel.StateChanged, state);
    }
  }
}

function setAscendonToken(token: string) {
  if (token === ascendonToken) {
    return;
  }
  ascendonToken = token;
  broadcastState();
}

/** Cookie values are JSON, either raw or URL-encoded. */
function parseCookieJson(value: string): unknown {
  for (const raw of [value, decodeURIComponent(value)]) {
    try {
      return JSON.parse(raw);
    } catch {
      // Try the next encoding.
    }
  }
  return null;
}

/** Reads `.data.subscriptionToken` from the login-session cookie value. */
function parseSubscriptionToken(value: string): string {
  const token = (
    parseCookieJson(value) as { data?: { subscriptionToken?: unknown } } | null
  )?.data?.subscriptionToken;
  return typeof token === 'string' ? token : '';
}

const isF1Cookie = (cookie: Cookie, name: string) =>
  cookie.name === name && cookie.domain === COOKIE_DOMAIN;

/** Updates state from a login-session or user-metadata cookie (null when removed). */
function applyCookie(name: string, cookie: Cookie | null) {
  if (name === LOGIN_SESSION_COOKIE) {
    const token = cookie ? parseSubscriptionToken(cookie.value) : '';
    if (cookie && !token) {
      console.warn('login-session cookie has no data.subscriptionToken');
    }
    setAscendonToken(token);
  } else if (name === USER_METADATA_COOKIE) {
    userMetadata = cookie ? parseCookieJson(cookie.value) : null;
  }
}

async function getF1Cookie(name: string): Promise<Cookie | null> {
  const cookies = await getLoginSession().cookies.get({ name });
  return cookies.find((cookie) => isF1Cookie(cookie, name)) ?? null;
}

/** Restores the logged-in state from the stored cookies. */
async function restoreFromCookies() {
  for (const name of [LOGIN_SESSION_COOKIE, USER_METADATA_COOKIE]) {
    applyCookie(name, await getF1Cookie(name));
  }
}

/** Keeps state in sync with the F1 cookies, including expiry. */
function watchCookies() {
  getLoginSession().cookies.on('changed', (_event, cookie, cause, removed) => {
    for (const name of [LOGIN_SESSION_COOKIE, USER_METADATA_COOKIE]) {
      // An overwrite is followed by an "added" event for the new value.
      if (isF1Cookie(cookie, name) && !(removed && cause === 'overwrite')) {
        applyCookie(name, removed ? null : cookie);
      }
    }
  });
}

async function forgetCookies() {
  const loginSession = getLoginSession();
  const { cookies } = loginSession;
  for (const name of [
    LOGIN_SESSION_COOKIE,
    USER_METADATA_COOKIE,
    ACCESS_TOKEN_COOKIE,
  ]) {
    const cookie = await getF1Cookie(name);
    if (cookie) {
      const host = cookie.domain?.replace(/^\./, '') ?? 'formula1.com';
      await cookies.remove(`https://${host}${cookie.path ?? '/'}`, name);
    }
  }
  // Drop the sign-in provider's session too, or the next login signs straight
  // back in without asking.
  await loginSession.clearStorageData({
    origin: IDENTITY_ORIGIN,
    storages: ['cookies'],
  });
  await cookies.flushStore();
}

/**
 * The login page, its OAuth callback (`/?code=…&state=…#/en/login`), or the
 * id.formula1.com sign-in pages it redirects through.
 */
function isLoginPage(url: string) {
  try {
    const { origin, hash } = new URL(url);
    return (
      origin === IDENTITY_ORIGIN ||
      (origin === 'https://account.formula1.com' &&
        /^#\/[a-z-]*\/login\b/.test(hash))
    );
  } catch {
    return false;
  }
}

function openLoginWindow(parent?: BrowserWindow): Promise<boolean> {
  return new Promise((resolve) => {
    let allowClose = false;
    let warningOpen = false;

    const window = new BrowserWindow({
      parent,
      width: 520,
      height: 760,
      title: 'Log in to F1',
      webPreferences: { session: getLoginSession() },
    });
    loginWindow = window;

    // Close as soon as the login-session cookie gives us a token.
    const onLoggedIn = () => {
      if (ascendonToken !== '' && !window.isDestroyed()) {
        allowClose = true;
        window.close();
      }
    };
    const { cookies } = getLoginSession();
    const onCookieChanged = () => queueMicrotask(onLoggedIn);
    cookies.on('changed', onCookieChanged);

    const { webContents } = window;

    // Keep the user on the login page.
    webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    webContents.on('will-navigate', (event) => {
      if (ascendonToken === '' && !isLoginPage(event.url)) {
        event.preventDefault();
      }
    });
    webContents.on('did-navigate-in-page', (_event, url, isMainFrame) => {
      if (ascendonToken === '' && isMainFrame && !isLoginPage(url)) {
        void window.loadURL(LOGIN_URL);
      }
    });

    window.on('close', (event) => {
      if (allowClose || ascendonToken !== '') {
        return;
      }
      event.preventDefault();
      if (warningOpen) {
        return;
      }
      warningOpen = true;
      void dialog
        .showMessageBox(window, {
          type: 'warning',
          message: "You haven't logged in yet",
          detail: 'Closing this window will cancel logging in to F1.',
          buttons: ['Continue logging in', 'Cancel login'],
          defaultId: 0,
          cancelId: 0,
        })
        .then(({ response }) => {
          warningOpen = false;
          if (response === 1 && !window.isDestroyed()) {
            allowClose = true;
            window.close();
          }
        });
    });

    window.on('closed', () => {
      cookies.removeListener('changed', onCookieChanged);
      loginWindow = null;
      resolve(ascendonToken !== '');
    });

    void window.loadURL(LOGIN_URL);
  });
}

/** Restores the login state and registers the auth IPC handlers. */
export async function initAuth() {
  watchCookies();
  await restoreFromCookies();

  ipcMain.handle(AuthChannel.GetState, () => getState());

  ipcMain.handle(AuthChannel.Login, (event) => {
    if (ascendonToken !== '') {
      return true;
    }
    if (loginWindow) {
      loginWindow.focus();
    }
    pendingLogin ??= openLoginWindow(
      BrowserWindow.fromWebContents(event.sender) ?? undefined,
    ).finally(() => {
      pendingLogin = null;
    });
    return pendingLogin;
  });

  ipcMain.handle(AuthChannel.Logout, async () => {
    await forgetCookies();
    applyCookie(LOGIN_SESSION_COOKIE, null);
    applyCookie(USER_METADATA_COOKIE, null);
  });
}
