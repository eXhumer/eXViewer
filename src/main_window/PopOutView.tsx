import { useEffect, useRef, useState, type ReactNode } from 'react';
import type {
  PlayerContent,
  PopOutRequest,
  StartPosition,
} from '../shared/player';
import { ChannelSwitcher, feedName } from './ChannelSwitcher';
import { VideoPlayer } from './VideoPlayer';

/** Reads a pop-out window's route (`#popout?contentId=…`), or null. */
export function readPopOutRoute(hash: string): PopOutRequest | null {
  const match = /^#popout\?(.*)$/.exec(hash);
  if (!match) {
    return null;
  }
  const params = new URLSearchParams(match[1]);
  const number = (name: string) => {
    const value = params.get(name);
    return value === null ? undefined : Number(value);
  };
  const contentId = number('contentId');
  if (!contentId) {
    return null;
  }
  const time = number('time');
  const behindLive = number('behindLive');
  return {
    contentId,
    channelId: number('channelId'),
    start:
      time !== undefined
        ? { time }
        : behindLive !== undefined
          ? { behindLive }
          : undefined,
  };
}

/** Title and close button; the bar also drags the frameless window. */
function PopOutBar({ children }: { children: ReactNode }) {
  return (
    <div className="pop-out-bar">
      <span className="pop-out-title">{children}</span>
      <button
        className="pop-out-close"
        aria-label="Close window"
        onClick={() => window.close()}
      >
        ×
      </button>
    </div>
  );
}

/**
 * One feed in its own window. It starts muted, so only the main window is
 * heard, and doesn't report the playhead, so it can't move F1TV's resume
 * position away from what the main window is watching.
 */
export function PopOutView({ request }: { request: PopOutRequest }) {
  const { contentId } = request;
  const [channelId, setChannelId] = useState(request.channelId);
  const [content, setContent] = useState<PlayerContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const position = useRef<StartPosition | undefined>(request.start);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    window.player.getContent(contentId, channelId).then(
      (content) => {
        if (!cancelled) {
          setContent({ ...content, reportIntervalMs: undefined });
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
    };
  }, [contentId, channelId]);

  const title = content
    ? [feedName(content), content.title].filter(Boolean).join(' · ')
    : 'eXViewer';
  useEffect(() => {
    document.title = title;
  }, [title]);

  if (!content || error) {
    return (
      <div className="pop-out">
        <PopOutBar>{title}</PopOutBar>
        <p className="pop-out-message" role={error ? 'alert' : undefined}>
          {error ? `Couldn't load this feed. ${error}` : 'Loading…'}
        </p>
      </div>
    );
  }

  return (
    <div className="pop-out">
      <VideoPlayer
        content={content}
        start={position.current}
        onPosition={(start) => {
          position.current = start;
        }}
        muted
      >
        <PopOutBar>{title}</PopOutBar>
        {content.channels.length > 1 && (
          <ChannelSwitcher
            channels={content.channels}
            channelId={content.channelId}
            onSelect={setChannelId}
            onPopOut={(popOutChannelId) =>
              void window.player.popOut({
                contentId,
                channelId: popOutChannelId,
                start: position.current,
              })
            }
          />
        )}
      </VideoPlayer>
    </div>
  );
}
