declare interface F1TV {
  onLoginSession: (cb: (e: IpcRendererEvent, ascendon: string | null) => void) => void;
  offLoginSession: (cb: (e: IpcRendererEvent, ascendon: string | null) => void) => void;
  login: () => Promise<void>;
  loginSession: () => Promise<string | null>;
  logout: () => Promise<void>;
}

declare global {
  interface Window {
    f1tv: F1TV,
  }

  const f1tv: F1TV;
}

export {}
