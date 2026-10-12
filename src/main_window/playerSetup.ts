import shaka from 'shaka-player/dist/shaka-player.ui';
import type { PlayerContent, StartPosition } from '../shared/player';
import { feedName } from './ChannelSwitcher';

// License requests go through the main process, which holds the F1TV tokens.
// Shaka sees them as requests to f1tv-license:<contentId>/<channelId>, with
// an empty channel ID for content with a single feed.
const LICENSE_SCHEME = 'f1tv-license';

const licensePlugin: shaka.extern.SchemePlugin = (uri, request) => {
  const [contentId, channelId = ''] = uri
    .slice(LICENSE_SCHEME.length + 1)
    .split('/');
  const { body } = request;
  const challenge = !body
    ? new Uint8Array()
    : ArrayBuffer.isView(body)
      ? new Uint8Array(body.buffer, body.byteOffset, body.byteLength).slice()
      : new Uint8Array(body);

  const license = window.player.requestLicense(
    Number(contentId),
    channelId ? Number(channelId) : undefined,
    challenge,
  );

  return shaka.util.AbortableOperation.notAbortable(
    license.then(
      (data): shaka.extern.Response => ({
        uri,
        originalUri: uri,
        originalRequest: request,
        data,
        headers: {},
      }),
      (error: unknown) => {
        throw new shaka.util.Error(
          shaka.util.Error.Severity.CRITICAL,
          shaka.util.Error.Category.NETWORK,
          shaka.util.Error.Code.HTTP_ERROR,
          uri,
          error,
        );
      },
    ),
  );
};

shaka.polyfill.installAll();
shaka.net.NetworkingEngine.registerScheme(LICENSE_SCHEME, licensePlugin);

export { shaka };

/** Points the player's Widevine license requests at the content's feed. */
export function configureDrm(player: shaka.Player, content: PlayerContent) {
  player.configure(
    'drm.servers.com\\.widevine\\.alpha',
    content.drm
      ? `${LICENSE_SCHEME}:${content.contentId}/${content.channelId ?? ''}`
      : '',
  );
}

export function describeError(error: unknown) {
  if (error instanceof shaka.util.Error) {
    return `Playback error ${error.code}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/** True for the error a newer load() gives the one it interrupts. */
export const isLoadInterrupted = (error: unknown) =>
  error instanceof shaka.util.Error &&
  error.code === shaka.util.Error.Code.LOAD_INTERRUPTED;

/**
 * What macOS shows for the playing video (Now Playing, media keys): the
 * session title, and the feed or driver as the artist line.
 */
export function describeMedia(content: PlayerContent) {
  return new MediaMetadata({
    title: content.title,
    artist: feedName(content),
    album: 'F1 TV',
  });
}

/** Closer than this to the live edge counts as watching live. */
const LIVE_EDGE_SECONDS = 10;

/** Where a player is: its time for VOD, or how far behind live. */
export function positionOf(
  player: shaka.Player,
  video: HTMLVideoElement,
): StartPosition {
  return player.isLive()
    ? { behindLive: Math.max(0, player.seekRange().end - video.currentTime) }
    : { time: video.currentTime };
}

/** Loads a feed's stream and moves to the start position. */
export async function loadStream(
  player: shaka.Player,
  video: HTMLVideoElement,
  content: PlayerContent,
  start: StartPosition | undefined,
) {
  configureDrm(player, content);
  await player.load(
    content.streamUrl,
    start && 'time' in start && !content.live ? start.time : undefined,
  );
  if (
    start &&
    'behindLive' in start &&
    start.behindLive > LIVE_EDGE_SECONDS &&
    player.isLive()
  ) {
    const range = player.seekRange();
    video.currentTime = Math.max(range.start, range.end - start.behindLive);
  }
}
