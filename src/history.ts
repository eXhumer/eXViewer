import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { CatalogItem } from './shared/catalog';

// What's been watched in the app and where it stopped, for the home page's
// Continue watching row. Kept in <userData>/watch-history.json.

interface Video {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  durationSeconds: number;
}

interface Entry extends Video {
  contentId: number;
  /** Seconds watched. */
  position: number;
  /** When it was last watched (ms since the epoch). */
  watchedAt: number;
}

const MAX_ENTRIES = 50;
/** Shown in Continue watching. */
const MAX_SHOWN = 20;
/** Past this share of the video, it counts as finished. */
const FINISHED = 0.95;
const SAVE_DELAY_MS = 2000;

/** Details of videos opened this run, until they're watched. */
const videos = new Map<number, Video>();
let entries: Map<number, Entry> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

const historyFile = () =>
  path.join(app.getPath('userData'), 'watch-history.json');

function load() {
  if (!entries) {
    entries = new Map();
    try {
      const saved = JSON.parse(fs.readFileSync(historyFile(), 'utf8'));
      if (Array.isArray(saved)) {
        for (const entry of saved as Entry[]) {
          if (typeof entry?.contentId === 'number') {
            entries.set(entry.contentId, entry);
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Could not read the watch history', error);
      }
    }
  }
  return entries;
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const list = [...load().values()]
      .sort((a, b) => b.watchedAt - a.watchedAt)
      .slice(0, MAX_ENTRIES);
    fs.promises
      .writeFile(historyFile(), JSON.stringify(list))
      .catch((error: unknown) =>
        console.warn('Could not save the watch history', error),
      );
  }, SAVE_DELAY_MS);
}

/** Remembers a video's details when it's opened. */
export function noteVideo(contentId: number, video: Video) {
  videos.set(contentId, video);
  const entry = load().get(contentId);
  if (entry) {
    Object.assign(entry, video);
    save();
  }
}

/** Records where a video stopped. */
export function notePosition(contentId: number, position: number) {
  const video = videos.get(contentId) ?? load().get(contentId);
  if (!video || video.durationSeconds <= 0) {
    return;
  }
  const { title, subtitle, imageUrl, durationSeconds } = video;
  load().set(contentId, {
    contentId,
    title,
    subtitle,
    imageUrl,
    durationSeconds,
    position,
    watchedAt: Date.now(),
  });
  save();
}

/** Started but unfinished videos, most recently watched first. */
export function continueWatching(): CatalogItem[] {
  return [...load().values()]
    .filter((entry) => entry.position < entry.durationSeconds * FINISHED)
    .sort((a, b) => b.watchedAt - a.watchedAt)
    .slice(0, MAX_SHOWN)
    .map((entry) => ({
      contentId: entry.contentId,
      title: entry.title,
      subtitle: entry.subtitle,
      imageUrl: entry.imageUrl,
      durationSeconds: entry.durationSeconds,
      progress: entry.position / entry.durationSeconds,
    }));
}

/** Writes any pending change before the app quits. */
export function flushHistory() {
  if (saveTimer === undefined || !entries) {
    return;
  }
  clearTimeout(saveTimer);
  saveTimer = undefined;
  const list = [...entries.values()]
    .sort((a, b) => b.watchedAt - a.watchedAt)
    .slice(0, MAX_ENTRIES);
  try {
    fs.writeFileSync(historyFile(), JSON.stringify(list));
  } catch (error) {
    console.warn('Could not save the watch history', error);
  }
}
