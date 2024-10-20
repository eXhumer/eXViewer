import { DecodedAscendonToken } from "@exhumer/f1tv-api";

declare interface F1TV {
  onLoginSession: (cb: (e: IpcRendererEvent, ascendon: DecodedAscendonToken | null) => void) => void;
  offLoginSession: (cb: (e: IpcRendererEvent, ascendon: DecodedAscendonToken | null) => void) => void;
  login: () => Promise<void>;
  loginSession: () => Promise<DecodedAscendonToken | null>;
  logout: () => Promise<void>;
}

declare global {
  interface Window {
    f1tv: F1TV,
  }

  const f1tv: F1TV;
}

export {}
