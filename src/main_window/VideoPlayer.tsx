import { useEffect, useRef, useState, type ReactNode } from 'react';
import 'shaka-player/dist/controls.css';
import type { PlayerContent, StartPosition } from '../shared/player';
import { trackPlayback } from './playReporting';
import {
  configureDrm,
  describeError,
  describeMedia,
  isLoadInterrupted,
  shaka,
} from './playerSetup';

/** How long the mouse can rest before the overlay controls hide. */
const IDLE_MS = 3000;
/** Closer than this to the live edge counts as watching live. */
const LIVE_EDGE_SECONDS = 10;

export type { StartPosition };

interface VideoPlayerProps {
  content: PlayerContent;
  /** Where to start each stream loaded into the player. */
  start?: StartPosition;
  /** Reports the playback position as it changes. */
  onPosition?(position: StartPosition): void;
  /** Starts with the sound off, for extra windows next to the main one. */
  muted?: boolean;
  /** Extra controls shown over the video while the mouse moves. */
  children?: ReactNode;
}

export function VideoPlayer({
  content,
  start,
  onPosition,
  muted = false,
  children,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Read at load time only, so a new position doesn't reload the stream.
  const startRef = useRef(start);
  startRef.current = start;
  const contentRef = useRef(content);
  contentRef.current = content;
  const onPositionRef = useRef(onPosition);
  onPositionRef.current = onPosition;

  const wake = () => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  };
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  // One player for the life of the component. Destroying it and making a new
  // one on the same <video> races: the old player's async teardown detaches
  // the video (and its MediaKeys) from under the new one, so playback stops
  // without an error.
  const playerRef = useRef<{
    player: shaka.Player;
    attached: Promise<void>;
  } | null>(null);
  // Teardown of the previous player (React's StrictMode remounts once in
  // development), so the next one attaches only after it lets go.
  const teardownRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) {
      return;
    }

    const player = new shaka.Player();
    const overlay = new shaka.ui.Overlay(player, container, video);
    // Shaka prefers Document Picture-in-Picture, which Electron doesn't
    // support: the window never opens. Use the <video> element's own
    // picture-in-picture instead.
    overlay.configure({ documentPictureInPicture: { enabled: false } });
    // The session title and feed are set below instead of Shaka's metadata.
    overlay.configure({ mediaSession: { handleMetadata: false } });
    player.addEventListener('error', (event) => {
      const { detail } = event as Event & { detail?: unknown };
      console.error(detail);
      setError(describeError(detail));
    });
    const reportPosition = () =>
      onPositionRef.current?.(
        player.isLive()
          ? {
              behindLive: Math.max(
                0,
                player.seekRange().end - video.currentTime,
              ),
            }
          : { time: video.currentTime },
      );
    video.addEventListener('timeupdate', reportPosition);
    const stopTracking = trackPlayback(
      player,
      video,
      () => contentRef.current,
    );
    playerRef.current = {
      player,
      attached: teardownRef.current.then(() => player.attach(video)),
    };

    return () => {
      playerRef.current = null;
      video.removeEventListener('timeupdate', reportPosition);
      stopTracking();
      navigator.mediaSession.metadata = null;
      teardownRef.current = overlay.destroy().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const current = playerRef.current;
    const video = videoRef.current;
    if (!current || !video) {
      return;
    }
    const { player, attached } = current;

    let cancelled = false;
    setError(null);
    navigator.mediaSession.metadata = describeMedia(content);
    configureDrm(player, content);
    void (async () => {
      try {
        await attached;
        const start = startRef.current;
        if (!cancelled) {
          await player.load(
            content.streamUrl,
            start && 'time' in start && !content.live ? start.time : undefined,
          );
        }
        if (
          !cancelled &&
          start &&
          'behindLive' in start &&
          start.behindLive > LIVE_EDGE_SECONDS &&
          player.isLive()
        ) {
          const range = player.seekRange();
          video.currentTime = Math.max(
            range.start,
            range.end - start.behindLive,
          );
        }
      } catch (error) {
        // A newer load() interrupts this one; that isn't an error to show.
        if (!cancelled && !isLoadInterrupted(error)) {
          console.error(error);
          setError(describeError(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [content]);

  return (
    <div
      className={idle ? 'video-player idle' : 'video-player'}
      ref={containerRef}
      onMouseMove={wake}
      onMouseLeave={() => setIdle(true)}
    >
      <video ref={videoRef} autoPlay muted={muted} />
      {children}
      {error && (
        <p className="video-player-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
