import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  BackTenIcon,
  ForwardTenIcon,
  FullscreenIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  VolumeIcon,
} from './icons';
import type { TileHandle } from './Tile';

/** Formats seconds as h:mm:ss, or m:ss under an hour. */
export function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, '0');
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}`
    : `${minutes}:${secs}`;
}

/** Within this many seconds of the live edge counts as live. */
const AT_LIVE_SECONDS = 10;
const SKIP_SECONDS = 10;

/** Re-renders when the leading video's playback state changes. */
function usePlaybackState(video: HTMLVideoElement | undefined) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!video) {
      return;
    }
    const update = () => setTick((tick) => tick + 1);
    const events = ['timeupdate', 'play', 'pause', 'durationchange'];
    for (const name of events) {
      video.addEventListener(name, update);
    }
    return () => {
      for (const name of events) {
        video.removeEventListener(name, update);
      }
    };
  }, [video]);
}

function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(
    () => document.fullscreenElement !== null,
  );
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  return fullscreen;
}

/** A range input's filled share, for the CSS track. */
function fill(value: number, min: number, max: number) {
  const share = max > min ? (value - min) / (max - min) : 0;
  return {
    '--fill': `${Math.min(Math.max(share, 0), 1) * 100}%`,
  } as CSSProperties;
}

interface ControlsProps {
  /** The first tile, whose clock every tile follows. */
  leader: TileHandle | null;
  /** The selected tile, for picture in picture. */
  focused: TileHandle | null;
  /** The audio picker, shown after the volume. */
  audioMenu?: ReactNode;
  volume: number;
  muted: boolean;
  onVolume(volume: number): void;
  onMuted(muted: boolean): void;
  onPlay(play: boolean): void;
  /** Moves every tile to this time on the leader's clock. */
  onSeek(time: number): void;
  onToggleFullscreen(): void;
}

/** One set of controls for every tile, laid out like F1TV's player. */
export function Controls({
  leader,
  focused,
  audioMenu,
  volume,
  muted,
  onVolume,
  onMuted,
  onPlay,
  onSeek,
  onToggleFullscreen,
}: ControlsProps) {
  usePlaybackState(leader?.video);
  const fullscreen = useFullscreen();
  if (!leader) {
    return <div className="mv-controls" />;
  }

  const { player, video } = leader;
  const live = player.isLive();
  const range = player.seekRange();
  const end = Math.max(range.start, range.end);
  const behindLive = range.end - video.currentTime;
  const atLive = live && behindLive < AT_LIVE_SECONDS;
  const shownVolume = muted ? 0 : volume;

  return (
    <div className="mv-controls">
      <div className="mv-timeline">
        {!live && (
          <span className="mv-time">
            {formatTime(video.currentTime - range.start)}
          </span>
        )}
        <input
          className="mv-range mv-seek"
          type="range"
          aria-label="Seek"
          min={range.start}
          max={end}
          step={1}
          value={video.currentTime}
          style={fill(video.currentTime, range.start, end)}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        {!live && (
          <span className="mv-time">{formatTime(range.end - range.start)}</span>
        )}
      </div>
      <div className="mv-controls-row">
        <button
          className="mv-icon-button"
          aria-label={`Back ${SKIP_SECONDS} seconds`}
          title={`Back ${SKIP_SECONDS} seconds`}
          onClick={() => onSeek(video.currentTime - SKIP_SECONDS)}
        >
          <BackTenIcon />
        </button>
        <button
          className="mv-icon-button"
          aria-label={video.paused ? 'Play' : 'Pause'}
          onClick={() => onPlay(video.paused)}
        >
          {video.paused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <button
          className="mv-icon-button"
          aria-label={`Forward ${SKIP_SECONDS} seconds`}
          title={`Forward ${SKIP_SECONDS} seconds`}
          onClick={() => onSeek(video.currentTime + SKIP_SECONDS)}
        >
          <ForwardTenIcon />
        </button>
        <button
          className="mv-icon-button"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onClick={() => onMuted(!muted)}
        >
          <VolumeIcon muted={shownVolume === 0} />
        </button>
        <input
          className="mv-range mv-volume"
          type="range"
          aria-label="Volume"
          min={0}
          max={1}
          step={0.05}
          value={shownVolume}
          style={fill(shownVolume, 0, 1)}
          onChange={(event) => {
            onVolume(Number(event.target.value));
            onMuted(false);
          }}
        />
        {audioMenu}
        {live && (
          <button
            className={atLive ? 'mv-live mv-live-on' : 'mv-live'}
            onClick={() => onSeek(range.end)}
          >
            {atLive ? 'LIVE' : `-${formatTime(behindLive)} · Go live`}
          </button>
        )}
        <span className="mv-spacer" />
        <button
          className="mv-icon-button"
          aria-label="Picture in picture"
          title="Picture in picture"
          disabled={!focused}
          onClick={() => void focused?.video.requestPictureInPicture()}
        >
          <PictureInPictureIcon />
        </button>
        <button
          className="mv-icon-button"
          aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
          title={fullscreen ? 'Exit full screen' : 'Full screen'}
          onClick={onToggleFullscreen}
        >
          <FullscreenIcon exit={fullscreen} />
        </button>
      </div>
    </div>
  );
}
