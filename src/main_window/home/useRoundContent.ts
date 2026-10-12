import { useEffect, useState } from 'react';
import type { RoundContent as Content } from '../../shared/catalog';

type RoundContent =
  | { state: 'loading' }
  | { state: 'loaded'; content: Content }
  | { state: 'error'; message: string };

/** Each meeting's content, kept while the app runs. */
const cache = new Map<string, Promise<Content>>();

function fetchRoundContent(meetingKey: string) {
  let content = cache.get(meetingKey);
  if (!content) {
    content = window.catalog.getRoundContent(meetingKey);
    content.catch(() => cache.delete(meetingKey));
    cache.set(meetingKey, content);
  }
  return content;
}

/** A round's sessions and videos, fetched when the round is chosen. */
export function useRoundContent(meetingKey: string | undefined) {
  const [content, setContent] = useState<RoundContent>({ state: 'loading' });

  useEffect(() => {
    if (!meetingKey) {
      return;
    }
    let cancelled = false;
    setContent({ state: 'loading' });
    fetchRoundContent(meetingKey).then(
      (content) => {
        if (!cancelled) {
          setContent({ state: 'loaded', content });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setContent({
            state: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [meetingKey]);

  return content;
}
