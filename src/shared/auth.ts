// Shared between main, preload and renderer. Keep this file type-only.

export interface AuthState {
  loggedIn: boolean;
}

export interface AuthApi {
  getState(): Promise<AuthState>;
  /** Opens the F1 login window. Resolves true once logged in, false if cancelled. */
  login(): Promise<boolean>;
  logout(): Promise<void>;
  /** Subscribes to state changes. Returns an unsubscribe function. */
  onStateChanged(listener: (state: AuthState) => void): () => void;
}

export const AuthChannel = {
  GetState: 'auth:get-state',
  Login: 'auth:login',
  Logout: 'auth:logout',
  StateChanged: 'auth:state-changed',
} as const;
