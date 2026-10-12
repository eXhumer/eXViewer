import { useEffect, useRef } from 'react';
import type { Round } from '../../shared/catalog';
import { roundLabel } from './loadHome';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
});

/** The weekend's dates, such as "Sep 13 – 15" or "Aug 29 – Sep 1". */
function weekend({ startDate, endDate }: Round) {
  return dateFormat.formatRange(new Date(startDate), new Date(endDate));
}

interface CalendarStripProps {
  rounds: Round[];
  /** The selected round's ID. */
  selected: number | undefined;
  onSelect(id: number): void;
}

/** The season's rounds in a sideways strip, scrolled to the selected one. */
export function CalendarStrip({
  rounds,
  selected,
  onSelect,
}: CalendarStripProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const button = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (list && button) {
      list.scrollTo({
        left: button.offsetLeft - list.clientWidth / 2 + button.clientWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [selected]);

  return (
    <ul ref={listRef} className="calendar-strip">
      {rounds.map((round) => (
        <li key={round.id}>
          <button
            className={`calendar-round calendar-round-${round.status}`}
            aria-pressed={round.id === selected}
            disabled={round.status === 'upcoming'}
            onClick={() => onSelect(round.id)}
          >
            <span className="calendar-round-number">
              {roundLabel(round)}
              {round.status === 'current' && (
                <span className="live-dot" aria-label="This weekend" />
              )}
            </span>
            <span className="calendar-round-place">{round.place}</span>
            <span className="calendar-round-dates">{weekend(round)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
