import { SERIES, type SeriesId } from '../shared/catalog';
import { updateSettings, useSettings } from './settings';

/** App settings: for now, which series the browse pages show. */
export function SettingsPage() {
  const { hiddenSeries } = useSettings();
  const shownCount = SERIES.length - hiddenSeries.length;

  const setShown = (id: SeriesId, shown: boolean) =>
    updateSettings({
      hiddenSeries: shown
        ? hiddenSeries.filter((hidden) => hidden !== id)
        : [...hiddenSeries, id],
    });

  return (
    <div className="settings-page">
      <header className="page-header">
        <h1>Settings</h1>
      </header>
      <section className="settings-section">
        <h2>Series</h2>
        <p className="settings-hint">
          Choose which championships appear on the browse pages. At least
          one stays on.
        </p>
        <ul className="settings-list">
          {SERIES.map(({ id, name }) => {
            const shown = !hiddenSeries.includes(id);
            return (
              <li key={id}>
                <label className="settings-toggle">
                  <span>{name}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={shown}
                    // Hiding every series would leave nothing to browse.
                    disabled={shown && shownCount === 1}
                    onChange={(event) => setShown(id, event.target.checked)}
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
