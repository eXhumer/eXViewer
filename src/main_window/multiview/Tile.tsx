import { useEffect, useRef, useState, type DragEvent } from 'react';
import type {
  PlayerContent,
  StartPosition,
  StreamChannel,
} from '../../shared/player';
import { trackPlayback } from '../playReporting';
import {
  describeError,
  describeMedia,
  isLoadInterrupted,
  loadStream,
  positionOf,
  shaka,
} from '../playerSetup';
import { TileSettings } from './TileSettings';

/** A tile's player, for the multiview to drive and keep in sync. */
export interface TileHandle {
  player: shaka.Player;
  video: HTMLVideoElement;
}

/** The drag data type for a channel dragged from the channel list. */
export const CHANNEL_DRAG_TYPE = 'application/x-exviewer-channel';

interface TileProps {
  contentId: number;
  /** The tile's feed; undefined for content with a single feed. */
  channel: StreamChannel | undefined;
  /** True if the tile has a channel or the content has no channels. */
  filled: boolean;
  /** The selected tile: it has the sound and takes the next channel. */
  focused: boolean;
  volume: number;
  muted: boolean;
  /**
   * The first tile leads: the others follow its clock, and only it saves
   * the playhead to F1TV.
   */
  leader: boolean;
  /** Where to start a newly loaded feed. */
  getStart(): StartPosition | undefined;
  onReady(handle: TileHandle | null): void;
  onPosition?(position: StartPosition): void;
  onSelect(): void;
  onDropChannel(channelId: number): void;
  onMakeMain(): void;
}

export function Tile({
  contentId,
  channel,
  filled,
  focused,
  volume,
  muted,
  leader,
  getStart,
  onReady,
  onPosition,
  onSelect,
  onDropChannel,
  onMakeMain,
}: TileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [content, setContent] = useState<PlayerContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [player, setPlayer] = useState<shaka.Player | null>(null);
  const handleRef = useRef<{ player: shaka.Player; attached: Promise<void> }>(
    null,
  );
  // StrictMode remounts once in development; attach only after the previous
  // player has let go of the <video>.
  const teardownRef = useRef<Promise<unknown>>(Promise.resolve());

  // Callbacks and flags read from long-lived listeners.
  const latest = useRef({ getStart, onReady, onPosition, leader, content });
  latest.current = { getStart, onReady, onPosition, leader, content };

  const channelId = channel?.channelId;

  useEffect(() => {
    if (!filled) {
      setContent(null);
      return;
    }
    let cancelled = false;
    setError(null);
    window.player.getContent(contentId, channelId).then(
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
    };
  }, [contentId, channelId, filled]);

  // One player per tile, kept across channel changes (see VideoPlayer).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const player = new shaka.Player();
    // Small tiles don't need full-size video.
    player.configure('abr.restrictToElementSize', true);
    player.addEventListener('error', (event) => {
      const { detail } = event as Event & { detail?: unknown };
      console.error(detail);
      setError(describeError(detail));
    });
    const attached = teardownRef.current.then(() => player.attach(video));
    handleRef.current = { player, attached };
    setPlayer(player);
    void attached.then(() => {
      if (handleRef.current?.player === player) {
        latest.current.onReady({ player, video });
      }
    });

    const reportPosition = () => {
      if (latest.current.leader) {
        latest.current.onPosition?.(positionOf(player, video));
      }
    };
    video.addEventListener('timeupdate', reportPosition);
    const stopTracking = trackPlayback(player, video, () =>
      latest.current.leader ? latest.current.content : null,
    );

    return () => {
      handleRef.current = null;
      setPlayer(null);
      latest.current.onReady(null);
      video.removeEventListener('timeupdate', reportPosition);
      stopTracking();
      teardownRef.current = player.destroy().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const handle = handleRef.current;
    const video = videoRef.current;
    if (!content || !handle || !video) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await handle.attached;
        if (!cancelled) {
          await loadStream(
            handle.player,
            video,
            content,
            latest.current.getStart(),
          );
        }
      } catch (error) {
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

  // A tile emptied by the multiview stops its old feed.
  useEffect(() => {
    const handle = handleRef.current;
    if (!filled && handle) {
      void handle.attached.then(() => handle.player.unload());
    }
  }, [filled]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => {
    if (focused && content) {
      navigator.mediaSession.metadata = describeMedia(content);
    }
  }, [focused, content]);

  const onDragOver = (event: DragEvent) => {
    if (event.dataTransfer.types.includes(CHANNEL_DRAG_TYPE)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setDragOver(true);
    }
  };

  const onDrop = (event: DragEvent) => {
    setDragOver(false);
    const data = event.dataTransfer.getData(CHANNEL_DRAG_TYPE);
    if (data) {
      event.preventDefault();
      onDropChannel(Number(data));
    }
  };

  const className = [
    'tile',
    focused && 'tile-focused',
    dragOver && 'tile-drag-over',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      onClick={onSelect}
      onDoubleClick={leader ? undefined : onMakeMain}
      onDragOver={onDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <video ref={videoRef} autoPlay muted={muted} />
      {channel && (
        <span className="tile-label">
          {channel.color && (
            <span
              className="tile-label-color"
              style={{ backgroundColor: channel.color }}
            />
          )}
          {channel.title}
          {focused && !muted && (
            <span className="tile-label-audio" aria-label="Sound on">
              ♪
            </span>
          )}
        </span>
      )}
      {filled && <TileSettings player={player} />}
      {!filled ? (
        <p className="tile-message">Choose a channel or drag one here</p>
      ) : error ? (
        <p className="tile-message" role="alert">
          {error}
        </p>
      ) : (
        !content && <p className="tile-message">Loading…</p>
      )}
    </div>
  );
}
