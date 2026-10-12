import type { F1TVClient } from '@exhumer/f1tv-api';
import { ipcMain } from 'electron';
import {
  CatalogChannel,
  type CatalogItem,
  type Round,
  type RoundContent,
  type RoundStatus,
  SERIES,
  type SeriesContent,
  type SeriesId,
} from './shared/catalog';
import { getClient } from './f1tv';
import { continueWatching } from './history';
import { pictureUrl } from './pictures';

type SearchContainer = Awaited<
  ReturnType<F1TVClient['searchVod']>
>['resultObj']['containers'][number];
type Meeting = SearchContainer;

function roundStatus(start: number, end: number, now: number): RoundStatus {
  if (now > end) {
    return 'done';
  }
  return now >= start ? 'current' : 'upcoming';
}

function toRound(meeting: Meeting, now: number): Round {
  const { metadata } = meeting;
  const attributes = metadata.emfAttributes;
  const round = Number(attributes.Championship_Meeting_Ordinal);
  const testing = attributes.IsTestEvent === 'true';
  const start = Date.parse(attributes.Meeting_Start_Date);
  const end = Date.parse(attributes.Meeting_End_Date);
  return {
    id: metadata.contentId,
    meetingKey: attributes.MeetingKey,
    round: !testing && round > 0 ? round : undefined,
    name: attributes.Meeting_Name,
    place: attributes.Circuit_Short_Name || attributes.Meeting_Country_Name,
    startDate: attributes.Meeting_Start_Date,
    endDate: attributes.Meeting_End_Date,
    status: roundStatus(start, end, now),
    imageUrl: metadata.pictureUrl
      ? pictureUrl(metadata.pictureUrl, 1280, 720)
      : undefined,
    sessions: [],
  };
}

/** The season's meetings, as the F1TV web app's schedule lists them. */
async function getCalendar(season: number): Promise<Round[]> {
  const client = await getClient();
  const result = await client.searchVod({
    orderBy: 'meeting_End_Date',
    sortOrder: 'asc',
    filter_objectSubtype: 'Meeting',
    filter_season: String(season),
    filter_orderByFom: 'Y',
    maxResults: '100',
  });
  const now = Date.now();
  return result.resultObj.containers
    .filter(
      (meeting) => meeting.metadata.emfAttributes.Diplay_In_Schedule !== false,
    )
    .map((meeting) => toRound(meeting, now));
}

/** "REPLAY" as "Replay", "SHOW" as "Show". */
function subtypeLabel(subtype: string) {
  return subtype
    ? subtype.charAt(0) + subtype.slice(1).toLowerCase().replaceAll('_', ' ')
    : undefined;
}

function toItem(container: SearchContainer, title: string): CatalogItem {
  const { metadata } = container;
  const live = metadata.contentSubtype === 'LIVE';
  return {
    contentId: metadata.contentId,
    title: title.trim(),
    subtitle: live ? undefined : subtypeLabel(metadata.contentSubtype),
    imageUrl: metadata.pictureUrl
      ? pictureUrl(metadata.pictureUrl, 640, 360)
      : undefined,
    durationSeconds: metadata.duration > 0 ? metadata.duration : undefined,
    live,
  };
}

/** F1TV's short series codes, as in metadata.uiSeries. */
const SERIES_CODES: Record<string, SeriesId> = {
  F1: 'f1',
  F2: 'f2',
  F3: 'f3',
  F1A: 'f1a',
  PSC: 'psc',
};

/** The longer names in emfAttributes.Series, upper-cased. */
const SERIES_NAMES: Record<string, SeriesId> = {
  'FORMULA 1': 'f1',
  'FORMULA 2': 'f2',
  'FORMULA 3': 'f3',
  'F1 ACADEMY': 'f1a',
  PORSCHE: 'psc',
};

/**
 * Which series a video belongs to. Videos with no series, such as a
 * weekend's round-up, count as Formula 1.
 */
function seriesOf({ metadata }: SearchContainer): SeriesId {
  return (
    SERIES_CODES[metadata.uiSeries?.toUpperCase()] ??
    SERIES_NAMES[metadata.emfAttributes.Series?.toUpperCase()] ??
    'f1'
  );
}

/**
 * True for the sessions themselves. Shows around them (wrap-ups and the
 * like) are also listed as meeting sessions, but sit in a shows package
 * (F1_Live_Shows, F1_FER_Shows) rather than a live one (F1_Live, F2_Live,
 * Academy_Live, PSC_Live…).
 */
function isSession({ metadata, platformVariants }: SearchContainer) {
  return (
    metadata.emfAttributes.VideoType === 'meetingSession' &&
    platformVariants.some((variant) =>
      variant.technicalPackages?.some((pack) =>
        pack.packageName.endsWith('_Live'),
      ),
    )
  );
}

const sessionTime = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function toSession(container: SearchContainer): CatalogItem {
  const { metadata } = container;
  const item = toItem(container, metadata.titleBrief || metadata.title);
  const start = metadata.emfAttributes.sessionStartDate;
  // When it ran, rather than "Replay" on every card.
  return start > 0 && !item.live
    ? { ...item, subtitle: sessionTime.format(start) }
    : item;
}

function toVideo(container: SearchContainer): CatalogItem {
  const { metadata } = container;
  const item = toItem(container, metadata.title || metadata.titleBrief);
  // Shows such as the wrap-up are filed as session replays.
  return metadata.contentSubtype === 'REPLAY'
    ? { ...item, subtitle: 'Show' }
    : item;
}

/** Everything F1TV has for a meeting, split by series. */
async function getRoundContent(meetingKey: string): Promise<RoundContent> {
  const client = await getClient();
  const result = await client.searchVod({
    orderBy: 'meeting_End_Date',
    sortOrder: 'asc',
    filter_MeetingKey: meetingKey,
    filter_orderByFom: 'Y',
    maxResults: '100',
  });
  const groups = new Map<SeriesId, SearchContainer[]>();
  for (const container of result.resultObj.containers) {
    // The meeting itself is listed too, as a bundle of the rest.
    if (container.metadata.contentType === 'BUNDLE') {
      continue;
    }
    const series = seriesOf(container);
    groups.set(series, [...(groups.get(series) ?? []), container]);
  }
  const series: SeriesContent[] = [];
  for (const { id } of SERIES) {
    const containers = groups.get(id);
    if (!containers) {
      continue;
    }
    series.push({
      series: id,
      sessions: containers
        .filter(isSession)
        .sort(
          (a, b) =>
            a.metadata.emfAttributes.sessionStartDate -
            b.metadata.emfAttributes.sessionStartDate,
        )
        .map(toSession),
      videos: containers
        .filter((container) => !isSession(container))
        .map(toVideo),
    });
  }
  return { series };
}

/** Registers the browse pages' IPC handlers. */
export function initCatalog() {
  ipcMain.handle(CatalogChannel.GetCalendar, (_event, season: number) =>
    getCalendar(season),
  );
  ipcMain.handle(CatalogChannel.GetContinueWatching, () =>
    continueWatching(),
  );
  ipcMain.handle(CatalogChannel.GetRoundContent, (_event, meetingKey: string) =>
    getRoundContent(meetingKey),
  );
}
