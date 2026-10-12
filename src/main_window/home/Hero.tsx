import { useEffect, useState } from 'react';
import type { Hero as HeroData } from '../../shared/catalog';

/** "2d 4h", "3h 12m" or "8m 05s" until a time. */
function countdown(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

interface HeroProps {
  hero: HeroData;
  onPlay(contentId: number): void;
}

/** The banner at the top of the home page: live now, or a countdown. */
export function Hero({ hero, onPlay }: HeroProps) {
  const now = useNow(1000);
  const { item, startsAt } = hero;
  const startTime = startsAt ? Date.parse(startsAt) : undefined;
  const live = item.live || (startTime !== undefined && startTime <= now);
  const { contentId } = item;

  return (
    <section
      className={live ? 'hero hero-live' : 'hero'}
      style={
        item.imageUrl
          ? { backgroundImage: `url(${JSON.stringify(item.imageUrl)})` }
          : undefined
      }
    >
      <div className="hero-body">
        <p className="hero-kicker">
          {live ? (
            <>
              <span className="live-dot" /> Live now
            </>
          ) : (
            (hero.label ?? 'Next up')
          )}
        </p>
        <h2 className="hero-title">{item.subtitle ?? item.title}</h2>
        {item.subtitle && <p className="hero-subtitle">{item.title}</p>}
        <div className="hero-actions">
          <button
            className="button-primary"
            disabled={contentId === undefined}
            onClick={() => contentId !== undefined && onPlay(contentId)}
          >
            {live ? 'Watch live' : 'Watch'}
          </button>
          {!live && startTime !== undefined && (
            <span className="hero-countdown">
              Starts in{' '}
              <strong>{countdown(startTime - now)}</strong>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
