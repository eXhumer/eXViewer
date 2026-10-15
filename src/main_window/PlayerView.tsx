import { useEffect, useRef, useState } from 'react';
import type { PlayerContent, StartPosition } from '../shared/player';
import { formatTime } from './multiview/Controls';
import { BackIcon } from './multiview/icons';
import { MultiView } from './multiview/MultiView';

interface PlayerViewProps {
  contentId: number;
  onBack(): void;
}

/** "5 feeds · 20 onboards", for content with more than one channel. */
function channelSummary({ channels }: PlayerContent) {
  if (channels.length < 2) {
    return undefined;
  }
  const onboards = channels.filter((channel) => channel.type === 'obc').length;
  const feeds = channels.length - onboards;
  const parts = [`${feeds} ${feeds === 1 ? 'feed' : 'feeds'}`];
  if (onboards > 0) {
    parts.push(`${onboards} onboards`);
  }
  return parts.join(' · ');
}

interface StartChoicesProps {
  content: PlayerContent;
  onChoose(start: StartPosition | undefined): void;
}

/** Where to start: live or the start, or resume or start over. */
function StartChoices({ content, onChoose }: StartChoicesProps) {
  if (content.live) {
    return (
      <div className="hero-actions">
        <button
          className="button-primary"
          autoFocus
          onClick={() => onChoose(undefined)}
        >
          Watch live
        </button>
        <button
          className="button-secondary"
          onClick={() => onChoose({ behindLive: Infinity })}
        >
          From the start
        </button>
      </div>
    );
  }
  const resumeAt = content.resumePosition ?? 0;
  return (
    <div className="hero-actions">
      <button
        className="button-primary"
        autoFocus
        onClick={() => onChoose({ time: resumeAt })}
      >
        Resume from {formatTime(resumeAt)}
      </button>
      <button
        className="button-secondary"
        onClick={() => onChoose({ time: 0 })}
      >
        Start from the beginning
      </button>
    </div>
  );
}

/**
 * A video's page: its title and where to start, in the browse pages' style,
 * then the full-window player once playback starts.
 */
export function PlayerView({ contentId, onBack }: PlayerViewProps) {
  const [content, setContent] = useState<PlayerContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startChosen, setStartChosen] = useState(false);
  // Where to start (the choice made here), then where the leading tile is.
  const position = useRef<StartPosition | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    window.player.getContent(contentId).then(
      (content) => {
        if (!cancelled) {
          setContent(content);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : String(error));
        }
      },
    );
    return () => {
      cancelled = true;
      // Tiles, previews and pop-outs of this page share one play response.
      void window.player.endSession(contentId);
    };
  }, [contentId]);

  const chooseStart = (start: StartPosition | undefined) => {
    position.current = start;
    setStartChosen(true);
  };

  const askForStart =
    content !== null &&
    !startChosen &&
    (content.live || content.resumePosition !== undefined);

  if (content && !askForStart) {
    return (
      <MultiView
        content={content}
        start={position.current}
        onPosition={(start) => {
          position.current = start;
        }}
        onBack={onBack}
      />
    );
  }

  const summary = content && channelSummary(content);

  return (
    <div className="watch-page">
      <button className="watch-back" onClick={onBack}>
        <BackIcon />
        Back
      </button>
      {error ? (
        <section className="hero watch-hero">
          <div className="hero-body">
            <p className="hero-kicker">Couldn't load this video</p>
            <p className="watch-error" role="alert">
              {error}
            </p>
            <div className="hero-actions">
              <button className="button-secondary" onClick={onBack}>
                Go back
              </button>
            </div>
          </div>
        </section>
      ) : !content ? (
        <section className="hero watch-hero watch-loading" aria-busy="true">
          <div className="hero-body">
            <span className="skeleton skeleton-kicker" />
            <span className="skeleton skeleton-title" />
            <span className="skeleton skeleton-button" />
          </div>
        </section>
      ) : (
        <>
          <section
            className={content.live ? 'hero watch-hero hero-live' : 'hero watch-hero'}
          >
            <div className="hero-body">
              <p className="hero-kicker">
                {content.live ? (
                  <>
                    <span className="live-dot" /> Live now
                  </>
                ) : (
                  'Continue watching'
                )}
              </p>
              <h1 className="hero-title">{content.title}</h1>
              {summary && <p className="hero-subtitle">{summary}</p>}
              <StartChoices content={content} onChoose={chooseStart} />
            </div>
          </section>
          {content.description && (
            <section className="home-section watch-about">
              <h2 className="home-section-title">About</h2>
              <p>{content.description}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
