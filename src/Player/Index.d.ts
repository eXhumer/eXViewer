import { ContentPlayResult, ContentVideoContainer } from '@exhumer/f1tv-api';

declare interface Player {
  contentPlay: (contentId: number, channelId?: number) => Promise<ContentPlayResult>;
  onContentVideo: (cb: (e: IpcRendererEvent, result: ContentVideoContainer) => void) => void;
}
declare global {
  interface Window {
    player: Player,
  }

  const player: Player;
}

export {}
