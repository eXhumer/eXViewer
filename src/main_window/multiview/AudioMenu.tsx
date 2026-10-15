import { useEffect, useRef, useState } from 'react';
import {
  audioLabel,
  trackKey,
  type AudioPick,
  type AudioSource,
} from './audio';
import { AudioIcon, CheckIcon } from './icons';

interface AudioMenuProps {
  /** Every tile's audio, in tile order. */
  sources: AudioSource[];
  playing: AudioPick | undefined;
  onChoose(source: AudioSource, key: string): void;
}

/**
 * The bottom bar's sound picker: the audio of every feed on screen in one
 * list, grouped by feed. One track plays at a time.
 */
export function AudioMenu({ sources, playing, onChoose }: AudioMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  if (sources.length === 0) {
    return null;
  }

  const source = sources.find(({ index }) => index === playing?.index);
  const track = source?.tracks.find((track) => trackKey(track) === playing?.key);
  const current =
    source && track
      ? sources.length > 1
        ? `${source.title} · ${audioLabel(track, source.names)}`
        : audioLabel(track, source.names)
      : 'Audio';

  return (
    <div
      ref={rootRef}
      className={open ? 'mv-audio mv-audio-open' : 'mv-audio'}
    >
      <button
        className="mv-audio-button"
        aria-label={`Audio: ${current}`}
        title="Audio"
        aria-expanded={open}
        onClick={() => setOpen((open) => !open)}
      >
        <AudioIcon />
        <span className="mv-audio-current">{current}</span>
      </button>
      {open && (
        <div className="mv-audio-menu" role="menu">
          {sources.map((source) => (
            <div key={source.index} role="group" aria-label={source.title}>
              <p className="mv-audio-heading">
                {source.channel?.color && (
                  <span
                    className="tile-label-color"
                    style={{ backgroundColor: source.channel.color }}
                  />
                )}
                {source.title}
              </p>
              {source.tracks.map((track) => {
                const key = trackKey(track);
                return (
                  <button
                    key={key}
                    role="menuitemradio"
                    aria-checked={
                      playing?.index === source.index && playing.key === key
                    }
                    onClick={() => {
                      onChoose(source, key);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon />
                    {audioLabel(track, source.names)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
