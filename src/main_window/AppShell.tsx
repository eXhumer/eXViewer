import { useState, type FormEvent, type ReactNode } from 'react';
import { HomePage } from './home/HomePage';
import { SettingsPage } from './SettingsPage';

export type PageId =
  | 'home'
  | 'archive'
  | 'shows'
  | 'documentaries'
  | 'settings';

const PAGES: { id: PageId; label: string; icon: ReactNode }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: (
      <path d="M4 5h16v4H4zM5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" />
    ),
  },
  {
    id: 'shows',
    label: 'Shows',
    icon: (
      <path d="M4 7h16v12H4zM8 3l4 4 4-4M10.5 10.5v5l4-2.5z" />
    ),
  },
  {
    id: 'documentaries',
    label: 'Documentaries',
    icon: (
      <path d="M4 5h16v14H4zM4 9h16M4 15h16M8 5v4M12 5v4M16 5v4M8 15v4M12 15v4M16 15v4" />
    ),
  },
];

const SETTINGS_ICON = (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </>
);

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Opens any F1TV content by ID, until every page has real data. */
function PlayById({ onPlay }: { onPlay(contentId: number): void }) {
  const [value, setValue] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const id = Number(value.trim());
    if (Number.isSafeInteger(id) && id > 0) {
      onPlay(id);
    }
  };
  return (
    <form className="play-by-id" onSubmit={submit}>
      <input
        inputMode="numeric"
        placeholder="Content ID"
        aria-label="F1TV content ID"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit">Play</button>
    </form>
  );
}

interface AppShellProps {
  page: PageId;
  /** Shown in place of the page, such as a video's page. */
  children?: ReactNode;
  onNavigate(page: PageId): void;
  onPlay(contentId: number): void;
}

/** The browse pages: a sidebar to move between them, and the page itself. */
export function AppShell({
  page,
  children,
  onNavigate,
  onPlay,
}: AppShellProps) {
  const current = PAGES.find(({ id }) => id === page) ?? PAGES[0];
  return (
    <div className="app-shell">
      <nav className="sidebar" aria-label="Pages">
        <p className="sidebar-brand">eXViewer</p>
        <ul>
          {PAGES.map(({ id, label, icon }) => (
            <li key={id}>
              <button
                className="sidebar-link"
                aria-current={id === page ? 'page' : undefined}
                onClick={() => onNavigate(id)}
              >
                <NavIcon>{icon}</NavIcon>
                {label}
              </button>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <PlayById onPlay={onPlay} />
          <button
            className="sidebar-link"
            aria-current={page === 'settings' ? 'page' : undefined}
            onClick={() => onNavigate('settings')}
          >
            <NavIcon>{SETTINGS_ICON}</NavIcon>
            Settings
          </button>
          <button
            className="sidebar-link"
            onClick={() => void window.auth.logout()}
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="page">
        {children ? (
          children
        ) : page === 'home' ? (
          <HomePage onPlay={onPlay} />
        ) : page === 'settings' ? (
          <SettingsPage />
        ) : (
          <div className="page-message">
            <h1>{current.label}</h1>
            <p>Coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}
