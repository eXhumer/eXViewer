import { useEffect, useRef, useState } from 'react';
import type { PlayerContent, StartPosition } from '../../shared/player';
import { positionOf } from '../playerSetup';
import { ChannelList } from './ChannelList';
import { Controls } from './Controls';
import { BackIcon, ChannelsIcon, ChevronRightIcon } from './icons';
import { LAYOUTS, MAX_TILES, type LayoutId } from './layouts';
import { followerTarget, syncFollower } from './sync';
import { Tile, type TileHandle } from './Tile';

const SYNC_INTERVAL_MS = 500;
/** How long the mouse can rest before the controls hide. */
const IDLE_MS = 3000;

interface MultiViewProps {
  content: PlayerContent;
  /** Where the first feed starts. */
  start?: StartPosition;
  /** Reports the leading tile's position as it plays. */
  onPosition(position: StartPosition): void;
  onBack(): void;
}

/**
 * The full-window player, like F1TV's: up to four feeds of a session at once
 * with one set of controls. The channels button opens the layout picker and
 * a panel previewing every channel. The first tile leads; the others follow
 * its clock.
 */
export function MultiView({
  content,
  start,
  onPosition,
  onBack,
}: MultiViewProps) {
  const { contentId, channels } = content;
  const hasChannels = channels.length > 1;
  const [layoutId, setLayoutId] = useState<LayoutId>('single');
  const [tiles, setTiles] = useState<(number | undefined)[]>(() => [
    content.channelId,
    ...Array<undefined>(MAX_TILES - 1),
  ]);
  const [focused, setFocused] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [idle, setIdle] = useState(false);
  const [, setHandlesChanged] = useState(0);
  const handles = useRef<(TileHandle | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const layout = hasChannels
    ? (LAYOUTS.find(({ id }) => id === layoutId) ?? LAYOUTS[0])
    : LAYOUTS[0];
  const count = layout.tiles;
  const countRef = useRef(count);
  countRef.current = count;
  const startRef = useRef(start);
  startRef.current = start;

  const getLeader = () => handles.current[0] ?? null;

  const leaderPosition = () => {
    const leader = handles.current[0];
    return leader && leader.video.readyState >= HTMLMediaElement.HAVE_METADATA
      ? positionOf(leader.player, leader.video)
      : startRef.current;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const leader = handles.current[0];
      if (
        !leader ||
        leader.video.readyState < HTMLMediaElement.HAVE_METADATA
      ) {
        return;
      }
      for (let i = 1; i < countRef.current; i++) {
        const follower = handles.current[i];
        if (follower) {
          syncFollower(leader, follower);
        }
      }
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => clearTimeout(idleTimer.current), []);
  const wake = () => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  };

  const chooseLayout = (id: LayoutId) => {
    const tileCount = LAYOUTS.find((layout) => layout.id === id)?.tiles ?? 1;
    setLayoutId(id);
    // New tiles stay empty until a channel is chosen; select the first one
    // so a click in the channel panel fills it.
    const firstEmpty = tiles
      .slice(0, tileCount)
      .findIndex((channelId) => channelId === undefined);
    setFocused((focused) =>
      firstEmpty !== -1 ? firstEmpty : focused < tileCount ? focused : 0,
    );
  };

  /** Puts a channel in a tile; if it's already showing, the two swap. */
  const placeChannel = (index: number, channelId: number) => {
    setTiles((tiles) => {
      const next = [...tiles];
      const current = next.slice(0, count).indexOf(channelId);
      // The main tile leads the others, so it never moves into an empty tile.
      if (current === 0 && next[index] === undefined) {
        return tiles;
      }
      if (current !== -1) {
        next[current] = next[index];
      }
      next[index] = channelId;
      return next;
    });
    setFocused(index);
  };

  const chooseChannel = (channelId: number) => {
    const showing = tiles.slice(0, count).indexOf(channelId);
    if (showing !== -1) {
      setFocused(showing);
    } else {
      placeChannel(focused, channelId);
    }
  };

  const makeMain = (index: number) => {
    if (tiles[index] === undefined) {
      return;
    }
    setTiles((tiles) => {
      const next = [...tiles];
      [next[0], next[index]] = [next[index], next[0]];
      return next;
    });
    setFocused(0);
  };

  const play = (playing: boolean) => {
    for (const handle of handles.current.slice(0, count)) {
      if (!handle) {
        continue;
      }
      if (playing) {
        handle.video.play().catch(() => {});
      } else {
        handle.video.pause();
      }
    }
  };

  const seek = (time: number) => {
    const leader = handles.current[0];
    if (!leader) {
      return;
    }
    const range = leader.player.seekRange();
    leader.video.currentTime = Math.min(Math.max(time, range.start), range.end);
    for (const follower of handles.current.slice(1, count)) {
      if (follower) {
        follower.video.currentTime = followerTarget(leader, follower);
      }
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void rootRef.current?.requestFullscreen();
    }
  };

  const popOut = (channelId: number) =>
    void window.player.popOut({
      contentId,
      channelId,
      start: leaderPosition(),
    });

  const className = [
    'multiview',
    panelOpen && 'mv-open',
    idle && !panelOpen && 'idle',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={rootRef}
      className={className}
      onMouseMove={wake}
      onMouseLeave={() => setIdle(true)}
    >
      <div className="mv-main">
        <div className="mv-stage">
          <div className={`mv-grid layout-${layout.id}`}>
            {Array.from({ length: count }, (_, index) => {
              const channelId = hasChannels ? tiles[index] : undefined;
              return (
                <Tile
                  key={index}
                  contentId={contentId}
                  channel={channels.find(
                    (channel) => channel.channelId === channelId,
                  )}
                  filled={!hasChannels || channelId !== undefined}
                  focused={index === focused}
                  volume={volume}
                  muted={muted || index !== focused}
                  leader={index === 0}
                  getStart={leaderPosition}
                  onReady={(handle) => {
                    handles.current[index] = handle;
                    setHandlesChanged((changes) => changes + 1);
                  }}
                  onPosition={onPosition}
                  onSelect={() => setFocused(index)}
                  onDropChannel={(dropped) => placeChannel(index, dropped)}
                  onMakeMain={() => makeMain(index)}
                />
              );
            })}
          </div>
        </div>
        <header className="mv-topbar">
          <button
            className="mv-icon-button mv-back"
            aria-label="Back"
            title="Back"
            onClick={onBack}
          >
            <BackIcon />
          </button>
          <span className="mv-title">{content.title}</span>
          {hasChannels && (
            <div
              className="mv-layouts"
              role="radiogroup"
              aria-label="Layout"
              inert={!panelOpen}
            >
              {LAYOUTS.map(({ id, label, tiles: tileCount }) => (
                <button
                  key={id}
                  className="mv-layout-button"
                  role="radio"
                  aria-checked={id === layout.id}
                  aria-label={label}
                  title={label}
                  onClick={() => chooseLayout(id)}
                >
                  <span className={`layout-icon layout-${id}`}>
                    {Array.from({ length: tileCount }, (_, i) => (
                      <span key={i} />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </header>
        <Controls
          leader={handles.current[0] ?? null}
          focused={handles.current[focused] ?? null}
          volume={volume}
          muted={muted}
          onVolume={setVolume}
          onMuted={setMuted}
          onPlay={play}
          onSeek={seek}
          onToggleFullscreen={toggleFullscreen}
        />
        {hasChannels && (
          <button
            className="mv-panel-toggle"
            aria-expanded={panelOpen}
            aria-label={panelOpen ? 'Close channels' : 'Channels and layouts'}
            title={panelOpen ? 'Close channels' : 'Channels and layouts'}
            onClick={() => setPanelOpen((open) => !open)}
          >
            {panelOpen ? <ChevronRightIcon /> : <ChannelsIcon />}
          </button>
        )}
      </div>
      {hasChannels && (
        <ChannelList
          open={panelOpen}
          contentId={contentId}
          channels={channels}
          showing={tiles.slice(0, count)}
          getLeader={getLeader}
          getStart={leaderPosition}
          onChoose={chooseChannel}
          onPopOut={popOut}
        />
      )}
    </div>
  );
}
