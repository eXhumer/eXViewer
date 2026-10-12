import { useEffect, useState } from 'react';
import {
  type HomePage as HomeData,
  SERIES,
  type SeriesId,
} from '../../shared/catalog';
import { useSettings } from '../settings';
import { CalendarStrip } from './CalendarStrip';
import { ContentRow } from './ContentRow';
import { Hero } from './Hero';
import { loadHomePage, roundLabel } from './loadHome';
import { useRoundContent } from './useRoundContent';

interface HomePageProps {
  onPlay(contentId: number): void;
}

/**
 * The current season: what's live or next, the season calendar with the
 * chosen round's sessions and videos, and continue watching.
 */
export function HomePage({ onPlay }: HomePageProps) {
  const [home, setHome] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | undefined>();
  const round = home?.calendar.find(({ id }) => id === selectedRound);
  const roundContent = useRoundContent(round?.meetingKey);
  const { hiddenSeries } = useSettings();
  const [chosenSeries, setChosenSeries] = useState<SeriesId>('f1');
  const seriesList =
    roundContent.state === 'loaded'
      ? roundContent.content.series.filter(
          ({ series }) => !hiddenSeries.includes(series),
        )
      : [];
  // The chosen series, or the first one this round has.
  const seriesContent =
    seriesList.find(({ series }) => series === chosenSeries) ?? seriesList[0];

  useEffect(() => {
    let cancelled = false;
    loadHomePage().then(
      (home) => {
        if (!cancelled) {
          setHome(home);
          const latest = home.calendar.findLast(
            (round) => round.status !== 'upcoming',
          );
          setSelectedRound(latest?.id);
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
  }, []);

  if (error) {
    return (
      <p className="page-message" role="alert">
        Couldn't load the home page. {error}
      </p>
    );
  }
  if (!home) {
    return <p className="page-message">Loading…</p>;
  }

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>{home.season} season</h1>
      </header>
      {home.hero && <Hero hero={home.hero} onPlay={onPlay} />}
      <ContentRow
        title="Continue watching"
        items={home.continueWatching}
        onPlay={onPlay}
      />
      <section className="home-section">
        <h2 className="home-section-title">Calendar</h2>
        <CalendarStrip
          rounds={home.calendar}
          selected={selectedRound}
          onSelect={setSelectedRound}
        />
      </section>
      {round && (
        <>
          {seriesList.length > 1 && (
            <div className="series-tabs" role="tablist" aria-label="Series">
              {seriesList.map(({ series }) => (
                <button
                  key={series}
                  role="tab"
                  className="series-tab"
                  aria-selected={series === seriesContent?.series}
                  onClick={() => setChosenSeries(series)}
                >
                  {SERIES.find(({ id }) => id === series)?.name}
                </button>
              ))}
            </div>
          )}
          <ContentRow
            title={
              <>
                {round.name}{' '}
                <span className="home-section-detail">
                  {roundLabel(round)} · Sessions
                </span>
              </>
            }
            items={seriesContent?.sessions ?? []}
            onPlay={onPlay}
            empty={
              roundContent.state === 'loading'
                ? 'Loading…'
                : roundContent.state === 'error'
                  ? `Couldn't load this round. ${roundContent.message}`
                  : 'No sessions for this round yet.'
            }
          />
          {seriesContent && seriesContent.videos.length > 0 && (
            <ContentRow
              title={
                <>
                  {round.name}{' '}
                  <span className="home-section-detail">
                    {roundLabel(round)} · Highlights and shows
                  </span>
                </>
              }
              items={seriesContent.videos}
              onPlay={onPlay}
            />
          )}
        </>
      )}
    </div>
  );
}
