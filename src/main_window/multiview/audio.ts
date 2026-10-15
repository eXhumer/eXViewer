import type { StreamChannel } from '../../shared/player';
import type { shaka } from '../playerSetup';

type AudioTrack = shaka.extern.AudioTrack;

/** A tile's audio tracks, offered in the bottom bar's audio menu. */
export interface AudioSource {
  /** The tile playing it. */
  index: number;
  channelId?: number;
  /** The feed's name, such as F1 LIVE or NOR. */
  title: string;
  channel?: StreamChannel;
  tracks: AudioTrack[];
  /** F1TV's names for the feed's tracks, by trackKey(). */
  names: Record<string, string>;
}

/** The audio that plays: a track of one tile's feed. */
export interface AudioPick {
  index: number;
  key: string;
}

/** What the listener chose, kept while that feed is on screen. */
export interface AudioChoice {
  channelId?: number;
  key: string;
}

/** A track's name in the playlist (eng, deu, fx, tea…), F1TV's key for it. */
export const trackKey = (track: AudioTrack) => track.label || track.language;

const languageNames = new Intl.DisplayNames(undefined, { type: 'language' });

/** F1TV's name for a track, or its language when F1TV has none. */
export function audioLabel(track: AudioTrack, names: Record<string, string>) {
  const key = trackKey(track);
  // Onboards carry the driver's team radio, named after the driver.
  if (key === 'tea') {
    return 'Team radio';
  }
  const named = names[key] ?? names[track.language];
  if (named) {
    return named;
  }
  try {
    return languageNames.of(track.language) ?? key;
  } catch {
    return key;
  }
}

const isEnglish = (track: AudioTrack) =>
  trackKey(track) === 'eng' || track.language.startsWith('en');

/**
 * Feeds to take the default sound from, best first: F1 LIVE (as on F1TV),
 * then the international feed, the other main feeds, and the onboards.
 */
function defaultRank({ channel }: AudioSource) {
  switch (channel?.identifier) {
    case undefined:
    case 'PRES':
      return 0;
    case 'WIF':
      return 1;
    case 'OBC':
      return 3;
    default:
      return 2;
  }
}

/**
 * The track to play: the listener's choice while its feed is on screen,
 * otherwise F1 LIVE in English, or the best feed with sound.
 */
export function pickAudio(
  sources: AudioSource[],
  choice: AudioChoice | null,
): AudioPick | undefined {
  if (choice) {
    const source = sources.find(
      (source) =>
        source.channelId === choice.channelId &&
        source.tracks.some((track) => trackKey(track) === choice.key),
    );
    if (source) {
      return { index: source.index, key: choice.key };
    }
  }
  const [best] = [...sources].sort((a, b) => defaultRank(a) - defaultRank(b));
  const track = best && (best.tracks.find(isEnglish) ?? best.tracks[0]);
  return track && { index: best.index, key: trackKey(track) };
}
