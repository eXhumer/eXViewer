// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { AuthChannel, type AuthApi, type AuthState } from './shared/auth';
import { CatalogChannel, type CatalogApi } from './shared/catalog';
import { PlayerChannel, type PlayerApi } from './shared/player';

const auth: AuthApi = {
  getState: () => ipcRenderer.invoke(AuthChannel.GetState),
  login: () => ipcRenderer.invoke(AuthChannel.Login),
  logout: () => ipcRenderer.invoke(AuthChannel.Logout),
  onStateChanged: (listener) => {
    const handler = (_event: IpcRendererEvent, state: AuthState) =>
      listener(state);
    ipcRenderer.on(AuthChannel.StateChanged, handler);
    return () => {
      ipcRenderer.removeListener(AuthChannel.StateChanged, handler);
    };
  },
};

const player: PlayerApi = {
  getContent: (contentId, channelId) =>
    ipcRenderer.invoke(PlayerChannel.GetContent, contentId, channelId),
  requestLicense: (contentId, channelId, challenge) =>
    ipcRenderer.invoke(
      PlayerChannel.RequestLicense,
      contentId,
      channelId,
      challenge,
    ),
  reportPosition: (contentId, seconds) =>
    ipcRenderer.invoke(PlayerChannel.ReportPosition, contentId, seconds),
  popOut: (request) => ipcRenderer.invoke(PlayerChannel.PopOut, request),
  endSession: (contentId) =>
    ipcRenderer.invoke(PlayerChannel.EndSession, contentId),
};

const catalog: CatalogApi = {
  getCalendar: (season) =>
    ipcRenderer.invoke(CatalogChannel.GetCalendar, season),
  getRoundContent: (meetingKey) =>
    ipcRenderer.invoke(CatalogChannel.GetRoundContent, meetingKey),
  getContinueWatching: () =>
    ipcRenderer.invoke(CatalogChannel.GetContinueWatching),
};

contextBridge.exposeInMainWorld('auth', auth);
contextBridge.exposeInMainWorld('catalog', catalog);
contextBridge.exposeInMainWorld('player', player);
