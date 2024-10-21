import { F1TV } from '@exhumer/f1tv-api';

declare interface Player {
  contentPlay: (contentId: number, channelId?: number) => Promise<F1TV.ContentPlayResult>;
  contextMenu: (cursor_location: { x: number, y: number }) => Promise<void>;
  onReadyToShow: (cb: (e: IpcRendererEvent, videoContainer: F1TV.ContentVideoContainer, ascendon: string, config: F1TV.Config | null) => void) => void;
  offReadyToShow: (cb: (e: IpcRendererEvent, videoContainer: F1TV.ContentVideoContainer, ascendon: string, config: F1TV.Config | null) => void) => void;
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
