import { F1TV } from '@exhumer/f1tv-api';
import { F1TVPlatform } from '../main_window/React/Type';

declare interface Player {
  contentPlay: (contentId: number, channelId?: number, platform: F1TVPlatform) => Promise<F1TV.ContentPlayResult>;
  contextMenu: (cursor_location: { x: number, y: number }) => Promise<void>;
  onReadyToShow: (cb: (e: IpcRendererEvent, videoContainer: F1TV.ContentVideoContainer, ascendon: string, config: F1TV.Config | null, platform: F1TVPlatform) => void) => void;
  offReadyToShow: (cb: (e: IpcRendererEvent, videoContainer: F1TV.ContentVideoContainer, ascendon: string, config: F1TV.Config | null, platform: F1TVPlatform) => void) => void;
  updateWindowTitle: (title: string) => Promise<void>;
}

declare global {
  declare module '*.module.scss' {
    const classes: { [key: string]: string };
    export default classes;
    export = classes;
  }

  interface Window {
    player: Player,
  }

  const player: Player;
}

export {}
