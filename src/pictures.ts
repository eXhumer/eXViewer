import { F1TVClient } from '@exhumer/f1tv-api';

/** An F1TV picture as a URL, from metadata like "{id}/landscape_web". */
export function pictureUrl(picture: string, width: number, height: number) {
  const params = new URLSearchParams({
    w: String(width),
    h: String(height),
    q: 'HI',
    o: 'L',
  });
  return `${F1TVClient.IMAGE_RESIZER_URL}/${picture}?${params}`;
}
