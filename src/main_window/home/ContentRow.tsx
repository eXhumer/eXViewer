import type { ReactNode } from 'react';
import type { CatalogItem } from '../../shared/catalog';

function duration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m`;
}

interface ContentCardProps {
  item: CatalogItem;
  onPlay(contentId: number): void;
}

export function ContentCard({ item, onPlay }: ContentCardProps) {
  const { contentId } = item;
  return (
    <li className="content-card">
      <button
        className="content-card-button"
        disabled={contentId === undefined}
        title={contentId === undefined ? 'Not available yet' : undefined}
        onClick={() => contentId !== undefined && onPlay(contentId)}
      >
        <span
          className="content-card-image"
          style={
            item.imageUrl
              ? { backgroundImage: `url(${JSON.stringify(item.imageUrl)})` }
              : undefined
          }
        >
          {item.live && <span className="live-badge">Live</span>}
          {item.durationSeconds !== undefined && !item.live && (
            <span className="content-card-duration">
              {duration(item.durationSeconds)}
            </span>
          )}
          {item.progress !== undefined && (
            <span className="content-card-progress">
              <span style={{ width: `${item.progress * 100}%` }} />
            </span>
          )}
        </span>
        <span className="content-card-title">{item.title}</span>
        {item.subtitle && (
          <span className="content-card-subtitle">{item.subtitle}</span>
        )}
      </button>
    </li>
  );
}

interface ContentRowProps {
  title: ReactNode;
  items: CatalogItem[];
  onPlay(contentId: number): void;
  /** Shown instead of the row when it has nothing in it. */
  empty?: ReactNode;
}

/** A titled row of cards that scrolls sideways. */
export function ContentRow({ title, items, onPlay, empty }: ContentRowProps) {
  if (items.length === 0 && !empty) {
    return null;
  }
  return (
    <section className="home-section">
      <h2 className="home-section-title">{title}</h2>
      {items.length === 0 ? (
        <p className="home-empty">{empty}</p>
      ) : (
        <ul className="content-row">
          {items.map((item, index) => (
            <ContentCard
              key={item.contentId ?? `${item.title}/${index}`}
              item={item}
              onPlay={onPlay}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
