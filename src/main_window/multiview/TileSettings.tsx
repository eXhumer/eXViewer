import { useEffect, useRef, useState } from 'react';
import type { shaka } from '../playerSetup';
import { CheckIcon, SettingsIcon } from './icons';

type AudioTrack = shaka.extern.AudioTrack;

/** Events after which the track lists or the active tracks may differ. */
const TRACK_EVENTS = [
  'loaded',
  'trackschanged',
  'variantchanged',
  'adaptation',
  'abrstatuschanged',
];

/** Room (px) left between the menu and the tile's edge, and the gap above it. */
const MENU_MARGIN = 12;

const languageNames = new Intl.DisplayNames(undefined, { type: 'language' });

function audioLabel(track: AudioTrack) {
  if (track.label) {
    return track.label;
  }
  let name = track.language;
  try {
    name = languageNames.of(track.language) ?? track.language;
  } catch {
    // Not a language code F1TV uses consistently; show it as it is.
  }
  return track.roles.length > 0 ? `${name} (${track.roles.join(', ')})` : name;
}

/** The same audio track in another feed: same language and label. */
function sameAudio(a: AudioTrack, b: AudioTrack) {
  return a.language === b.language && a.label === b.label;
}

/** Video heights on offer, highest first. */
function qualities(player: shaka.Player) {
  const heights = new Set<number>();
  for (const track of player.getVideoTracks()) {
    if (track.height) {
      heights.add(track.height);
    }
  }
  return [...heights].sort((a, b) => b - a);
}

/** Plays the best track no taller than `height`, or the smallest if none is. */
function selectQuality(player: shaka.Player, height: number) {
  const tracks = player
    .getVideoTracks()
    .filter((track) => track.height)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0) || b.bandwidth - a.bandwidth);
  const track =
    tracks.find((track) => (track.height ?? 0) <= height) ?? tracks.at(-1);
  if (track) {
    player.configure('abr.enabled', false);
    player.selectVideoTrack(track, true);
  }
}

interface TileSettingsProps {
  player: shaka.Player | null;
}

/**
 * The gear in a tile's top-right corner: the feed's video quality and audio
 * track. The choice carries over when the tile switches channel.
 */
export function TileSettings({ player }: TileSettingsProps) {
  const [open, setOpen] = useState(false);
  /** The chosen height, or undefined for automatic. */
  const [quality, setQuality] = useState<number | undefined>(undefined);
  const [audio, setAudio] = useState<AudioTrack | undefined>(undefined);
  const [, setTick] = useState(0);
  const [menuHeight, setMenuHeight] = useState<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const choice = useRef({ quality, audio });
  choice.current = { quality, audio };

  useEffect(() => {
    if (!player) {
      return;
    }
    const update = () => setTick((tick) => tick + 1);
    // A newly loaded channel gets the tile's chosen quality and audio.
    const reapply = () => {
      const { quality, audio } = choice.current;
      if (quality !== undefined) {
        selectQuality(player, quality);
      }
      const track =
        audio && player.getAudioTracks().find((track) => sameAudio(track, audio));
      if (track && !track.active) {
        player.selectAudioTrack(track);
      }
    };
    for (const name of TRACK_EVENTS) {
      player.addEventListener(name, update);
    }
    player.addEventListener('loaded', reapply);
    return () => {
      for (const name of TRACK_EVENTS) {
        player.removeEventListener(name, update);
      }
      player.removeEventListener('loaded', reapply);
    };
  }, [player]);

  // The tile clips the menu, so it scrolls within the space below the gear.
  useEffect(() => {
    const root = rootRef.current;
    const tile = root?.closest('.tile');
    if (!open || !root || !tile) {
      return;
    }
    const fit = () => {
      const space =
        tile.getBoundingClientRect().bottom -
        root.getBoundingClientRect().bottom -
        MENU_MARGIN;
      setMenuHeight(Math.max(space, 0));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(tile);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  if (!player) {
    return null;
  }

  const heights = qualities(player);
  const activeHeight = player
    .getVideoTracks()
    .find((track) => track.active)?.height;
  const audioTracks = player.getAudioTracks();

  const chooseQuality = (height: number | undefined) => {
    setQuality(height);
    if (height === undefined) {
      player.configure('abr.enabled', true);
    } else {
      selectQuality(player, height);
    }
  };

  const chooseAudio = (track: AudioTrack) => {
    setAudio(track);
    player.selectAudioTrack(track);
  };

  return (
    <div
      ref={rootRef}
      className={open ? 'tile-settings tile-settings-open' : 'tile-settings'}
      // Clicks here shouldn't select the tile or make it the main one.
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <button
        className="tile-settings-button"
        aria-label="Quality and audio"
        title="Quality and audio"
        aria-expanded={open}
        onClick={() => setOpen((open) => !open)}
      >
        <SettingsIcon />
      </button>
      {open && (
        <div
          className="tile-settings-menu"
          role="menu"
          style={{ maxHeight: menuHeight }}
        >
          <p className="tile-settings-heading">Quality</p>
          <button
            role="menuitemradio"
            aria-checked={quality === undefined}
            onClick={() => chooseQuality(undefined)}
          >
            <CheckIcon />
            Auto
            {quality === undefined && activeHeight && (
              <span className="tile-settings-detail">{activeHeight}p</span>
            )}
          </button>
          {heights.map((height) => (
            <button
              key={height}
              role="menuitemradio"
              aria-checked={quality === height}
              onClick={() => chooseQuality(height)}
            >
              <CheckIcon />
              {height}p
            </button>
          ))}
          {audioTracks.length > 0 && (
            <>
              <p className="tile-settings-heading">Audio</p>
              {audioTracks.map((track, index) => (
                <button
                  key={`${track.language}/${track.label ?? ''}/${index}`}
                  role="menuitemradio"
                  aria-checked={track.active}
                  onClick={() => chooseAudio(track)}
                >
                  <CheckIcon />
                  {audioLabel(track)}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
