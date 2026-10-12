import { useEffect, useState } from 'react';
import type { AuthState } from '../shared/auth';
import { AppShell, type PageId } from './AppShell';
import { PlayerView } from './PlayerView';

export function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [page, setPage] = useState<PageId>('home');
  const [contentId, setContentId] = useState<number | null>(null);

  useEffect(() => {
    void window.auth.getState().then(setAuth);
    return window.auth.onStateChanged(setAuth);
  }, []);

  const login = async () => {
    setLoggingIn(true);
    try {
      await window.auth.login();
    } finally {
      setLoggingIn(false);
    }
  };

  if (!auth) {
    return null;
  }

  if (!auth.loggedIn) {
    return (
      <main className="login-screen">
        <div className="login-card">
          <p className="login-brand">eXViewer</p>
          <h1>Watch F1 TV on your desktop</h1>
          <p className="login-text">
            Log in with your F1 account to watch live sessions, replays and
            onboards.
          </p>
          <button
            className="button-primary login-button"
            onClick={login}
            disabled={loggingIn}
          >
            {loggingIn && <span className="login-spinner" aria-hidden="true" />}
            {loggingIn ? 'Waiting for login…' : 'Log in with F1 account'}
          </button>
          <p className="login-note">
            Opens the official F1 login in a new window.
          </p>
        </div>
      </main>
    );
  }

  const navigate = (page: PageId) => {
    setPage(page);
    setContentId(null);
  };

  return (
    <AppShell page={page} onNavigate={navigate} onPlay={setContentId}>
      {contentId !== null && (
        // Keyed so another video starts from a fresh page.
        <PlayerView
          key={contentId}
          contentId={contentId}
          onBack={() => setContentId(null)}
        />
      )}
    </AppShell>
  );
}
