import { LocationResult } from "@exhumer/f1tv-api";

declare interface F1TV {
  location: () => Promise<LocationResult>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  onSubscriptionToken: (cb: (e: IpcRendererEvent, ascendon: string | null) => void) => void;
  whenLocationReady: () => Promise<void>;
}

declare interface ExViewer {
  newPlayer: (contentId: number) => Promise<void>;
}

declare global {
  interface Window {
    exviewer: ExViewer,
    f1tv: F1TV,
  }

  const exviewer: ExViewer;
  const f1tv: F1TV;
}

export {}
