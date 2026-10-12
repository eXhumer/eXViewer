import { useEffect, useRef, useState } from 'react';
import type {
  PlayerContent,
  StartPosition,
  StreamChannel,
} from '../../shared/player';
import { isLoadInterrupted, loadStream, shaka } from '../playerSetup';
import { PopOutIcon } from './icons';
import { syncFollower } from './sync';
import { CHANNEL_DRAG_TYPE, type TileHandle } from './Tile';

const PREVIEW_SYNC_MS = 1000;

/** Each channel's stream, fetched once per session for its preview. */
const previewContent = new Map<string, Promise<PlayerContent>>();

function getPreviewContent(contentId: number, channelId: number) {
  const key = `${contentId}/${channelId}`;
  let content = previewContent.get(key);
  if (!content) {
    content = window.player.getContent(contentId, channelId);
    content.catch(() => previewContent.delete(key));
    previewContent.set(key, content);
  }
  return content;
}

interface ChannelPreviewProps {
  contentId: number;
  channel: StreamChannel;
  /** False while the channel panel is closed; previews play only when open. */
  active: boolean;
  /** True if the channel is in a tile. */
  showing: boolean;
  /** The lead tile, whose clock the preview follows. */
  getLeader(): TileHandle | null;
  getStart(): StartPosition | undefined;
  onChoose(): void;
  onPopOut(): void;
}

/**
 * A channel's card in the channel panel: a small, muted, live preview that
 * plays while it's scrolled into view. Click it to put the channel in the
 * selected tile, or drag it onto any tile.
 */
export function ChannelPreview({
  contentId,
  channel,
  active,
  showing,
  getLeader,
  getStart,
  onChoose,
  onPopOut,
}: ChannelPreviewProps) {
  const cardRef = useRef<HTMLLIElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<PlayerContent | null>(null);
  const handleRef = useRef<{ player: shaka.Player; attached: Promise<void> }>(
    null,
  );
  const teardownRef = useRef<Promise<unknown>>(Promise.resolve());
  const latest = useRef({ getLeader, getStart });
  latest.current = { getLeader, getStart };

  const playing = active && visible;
  const { channelId } = channel;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || content) {
      return;
    }
    let cancelled = false;
    getPreviewContent(contentId, channelId).then(
      (content) => {
        if (!cancelled) {
          setContent(content);
        }
      },
      (error: unknown) => console.warn(`Preview of ${channel.title}:`, error),
    );
    return () => {
      cancelled = true;
    };
  }, [playing, content, contentId, channelId, channel.title]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const player = new shaka.Player();
    player.configure({
      abr: { restrictToElementSize: true },
      streaming: { bufferingGoal: 6, rebufferingGoal: 1, bufferBehind: 6 },
    });
    player.addEventListener('error', (event) => {
      const { detail } = event as Event & { detail?: unknown };
      console.warn(`Preview of ${channel.title}:`, detail);
    });
    const attached = teardownRef.current.then(() => player.attach(video));
    handleRef.current = { player, attached };
    return () => {
      handleRef.current = null;
      teardownRef.current = player.destroy().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const handle = handleRef.current;
    const video = videoRef.current;
    if (!handle || !video) {
      return;
    }
    if (!playing || !content) {
      void handle.attached.then(() => handle.player.unload()).catch(() => {});
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
          console.warn(`Preview of ${channel.title}:`, error);
        }
      }
    })();
    const timer = setInterval(() => {
      const leader = latest.current.getLeader();
      if (
        leader &&
        leader.video.readyState >= HTMLMediaElement.HAVE_METADATA
      ) {
        syncFollower(leader, { player: handle.player, video });
      }
    }, PREVIEW_SYNC_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [playing, content]);

  const name = channel.driverName ?? channel.title;
  return (
    <li ref={cardRef} className="channel-card">
      <button
        className="channel-card-button"
        aria-pressed={showing}
        title={name}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData(CHANNEL_DRAG_TYPE, String(channelId));
          event.dataTransfer.effectAllowed = 'copy';
        }}
        onClick={onChoose}
      >
        <video ref={videoRef} autoPlay muted playsInline />
        <span className="tile-label">
          <span
            className="tile-label-color"
            style={
              channel.color ? { backgroundColor: channel.color } : undefined
            }
          />
          {channel.title}
        </span>
      </button>
      <button
        className="channel-card-pop-out"
        aria-label={`Open ${name} in a new window`}
        title="Open in a new window"
        onClick={onPopOut}
      >
        <PopOutIcon />
      </button>
    </li>
  );
}
