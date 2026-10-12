// What the app's browse pages show. Shared between main and renderer; keep
// this file type-only.

/** Something to watch: a session, a replay, an episode or a documentary. */
export interface CatalogItem {
  /** The F1TV content ID; absent for things that can't be played yet. */
  contentId?: number;
  title: string;
  /** A second line, such as the event or the series. */
  subtitle?: string;
  imageUrl?: string;
  durationSeconds?: number;
  live?: boolean;
  /** How much has been watched, from 0 to 1. */
  progress?: number;
}

export type RoundStatus = 'done' | 'current' | 'upcoming';

/** A race weekend or test in the season calendar. */
export interface Round {
  /** The F1TV content ID of the meeting. */
  id: number;
  /** F1TV's key for the meeting, for fetching its sessions. */
  meetingKey: string;
  /** The championship round; absent for testing. */
  round?: number;
  /** Such as "Singapore Grand Prix". */
  name: string;
  /** Such as "Singapore"; shown under the round number. */
  place: string;
  /** ISO times of the weekend's start and end. */
  startDate: string;
  endDate: string;
  status: RoundStatus;
  imageUrl?: string;
  /** Empty until fetched with getRoundContent. */
  sessions: CatalogItem[];
}

/** The top of the home page: what's live, or the next session to watch. */
export interface Hero {
  item: CatalogItem;
  /** ISO time the session starts; the banner counts down to it. */
  startsAt?: string;
  /** Above the title when not live; "Next up" if absent. */
  label?: string;
}

/** Everything on the home page, for the current season. */
export interface HomePage {
  season: number;
  hero?: Hero;
  calendar: Round[];
  continueWatching: CatalogItem[];
}

/** The championships F1TV carries. */
export type SeriesId = 'f1' | 'f2' | 'f3' | 'f1a' | 'psc';

/** Every series, in the order the app shows them. */
export const SERIES: readonly { id: SeriesId; name: string }[] = [
  { id: 'f1', name: 'Formula 1' },
  { id: 'f2', name: 'Formula 2' },
  { id: 'f3', name: 'Formula 3' },
  { id: 'f1a', name: 'F1 Academy' },
  { id: 'psc', name: 'Porsche Supercup' },
];

/** One series' part of a meeting. */
export interface SeriesContent {
  series: SeriesId;
  /** Practice, sprint, qualifying, race or testing days, in running order. */
  sessions: CatalogItem[];
  /** Highlights, analysis, shows and the rest, as F1TV orders them. */
  videos: CatalogItem[];
}

export interface RoundContent {
  /** The series with anything at this meeting, in SERIES order. */
  series: SeriesContent[];
}

export interface CatalogApi {
  /** The season's meetings, testing included, in date order. */
  getCalendar(season: number): Promise<Round[]>;
  /** A meeting's sessions and other videos (highlights, shows…), by series. */
  getRoundContent(meetingKey: string): Promise<RoundContent>;
  /** Videos started in the app and not finished, most recent first. */
  getContinueWatching(): Promise<CatalogItem[]>;
}

export const CatalogChannel = {
  GetCalendar: 'catalog:get-calendar',
  GetRoundContent: 'catalog:get-round-content',
  GetContinueWatching: 'catalog:get-continue-watching',
} as const;
