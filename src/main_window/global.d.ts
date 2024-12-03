import { DecodedAscendonToken, F1TV } from '@exhumer/f1tv-api';

declare interface F1TV {
  onAscendon: (cb: (e: IpcRendererEvent, ascendon: DecodedAscendonToken | null) => void) => void;
  offAscendon: (cb: (e: IpcRendererEvent, ascendon: DecodedAscendonToken | null) => void) => void;
  onConfig: (cb: (e: IpcRendererEvent, config: F1TV.Config) => void) => void;
  offConfig: (cb: (e: IpcRendererEvent, config: F1TV.Config) => void) => void;
  onEntitlement: (cb: (e: IpcRendererEvent, entitlement: string | null) => void) => void;
  offEntitlement: (cb: (e: IpcRendererEvent, entitlement: string | null) => void) => void;
  onLocation: (cb: (e: IpcRendererEvent, location: F1TV.LocationResult) => void) => void;
  offLocation: (cb: (e: IpcRendererEvent, location: F1TV.LocationResult) => void) => void;
  onReady: (cb: (e: IpcRendererEvent, config: F1TV.Config, location: F1TV.LocationResult) => void) => void;
  offReady: (cb: (e: IpcRendererEvent, config: F1TV.Config, location: F1TV.LocationResult) => void) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

declare interface MainWindow {
  newPlayer: (contentId: number, platform: string) => Promise<void>;
  onReadyToShow: (cb: (e: IpcRendererEvent, decodedAscendon: DecodedAscendonToken | null, entitlement: string | null, config: F1TV.Config | null, location: F1TV.LocationResult | null) => void) => void;
  offReadyToShow: (cb: (e: IpcRendererEvent, decodedAscendon: DecodedAscendonToken | null, entitlement: string | null, config: F1TV.Config | null, location: F1TV.LocationResult | null) => void) => void;
}

declare global {
  declare module '*.module.scss' {
    const classes: { [key: string]: string };
    export default classes;
    export = classes;
  }

  interface Window {
    f1tv: F1TV,
    mainWindow: MainWindow,
  }

  const f1tv: F1TV;
  const mainWindow: MainWindow;
}

export {}
