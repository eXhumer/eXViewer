import type { HomePage, Round } from '../../shared/catalog';

/** The next meeting, for the banner: the weekend in progress, or the next. */
function nextMeeting(calendar: Round[]) {
  return (
    calendar.find((round) => round.status === 'current') ??
    calendar.find((round) => round.status === 'upcoming')
  );
}

/** "Round 18 · Austin", or "Testing · Sakhir". */
export function roundLabel(round: Round) {
  return round.round === undefined ? 'Testing' : `Round ${round.round}`;
}

export async function loadHomePage(): Promise<HomePage> {
  const season = new Date().getFullYear();
  const [calendar, continueWatching] = await Promise.all([
    window.catalog.getCalendar(season),
    window.catalog.getContinueWatching(),
  ]);
  const next = nextMeeting(calendar);
  return {
    season,
    hero: next && {
      item: {
        title: `${roundLabel(next)} · ${next.place}`,
        subtitle: next.name,
        imageUrl: next.imageUrl,
      },
      // The weekend in progress has no countdown.
      startsAt: next.status === 'upcoming' ? next.startDate : undefined,
      label: next.status === 'current' ? 'This weekend' : undefined,
    },
    calendar,
    continueWatching,
  };
}
