import { useSyncExternalStore } from 'react';
import type { SeriesId } from '../shared/catalog';

/** Choices made on the Settings page. */
export interface Settings {
  /** Series left out of the browse pages. */
  hiddenSeries: SeriesId[];
}

const STORAGE_KEY = 'settings';
const DEFAULTS: Settings = { hiddenSeries: [] };

function load(): Settings {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? 'null',
    );
    if (stored && typeof stored === 'object') {
      return { ...DEFAULTS, ...(stored as Partial<Settings>) };
    }
  } catch {
    // Unreadable settings fall back to the defaults.
  }
  return DEFAULTS;
}

let settings = load();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Changes some settings and saves them. */
export function updateSettings(changes: Partial<Settings>) {
  settings = { ...settings, ...changes };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Could not save settings:', error);
  }
  for (const listener of listeners) {
    listener();
  }
}

/** The current settings; re-renders when they change. */
export function useSettings() {
  return useSyncExternalStore(subscribe, () => settings);
}
