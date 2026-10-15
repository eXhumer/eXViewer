import { DEFAULT_DEVICE_INFO, F1TVClient } from '@exhumer/f1tv-api';
import { ipcMain, type Session } from 'electron';
import { getAscendonToken } from './auth';
import { notePosition, noteVideo } from './history';
import { pictureUrl } from './pictures';
import {
  PlayerChannel,
  type PlayerContent,
  type StreamChannel,
} from './shared/player';

const OS_NAMES: Partial<Record<NodeJS.Platform, string>> = {
  darwin: 'macos',
  win32: 'windows',
  linux: 'linux',
};

/** Describes this app to F1TV the way the web app describes Chrome. */
const deviceInfo = () => ({
  ...DEFAULT_DEVICE_INFO,
  os: OS_NAMES[process.platform] ?? process.platform,
  osVersion: process.getSystemVersion(),
  browser: 'chrome',
  browserVersion: process.versions.chrome.split('.')[0],
});

let clientPromise: Promise<F1TVClient> | null = null;
/**
 * The login or logout in flight. F1TVClient rejects a login that a later
 * login() or logout() supersedes, so concurrent requests share this one.
 */
let pendingAuth: { token: string; promise: Promise<unknown> } | null = null;
/** Widevine license URLs from the play responses, by content ID. */
const licenseUrls = new Map<number, string>();
/** contentSubtype (REPLAY, HIGHLIGHTS, LIVE…) by content ID, for reporting. */
const contentSubtypes = new Map<number, string>();

/** Returns the F1TV client, logged in or out to match the F1 login. */
export async function getClient() {
  clientPromise ??= F1TVClient.create({ deviceInfo: deviceInfo() }).catch(
    (error: unknown) => {
      clientPromise = null;
      throw error;
    },
  );
  const client = await clientPromise;
  const token = getAscendonToken();
  if (client.ascendon !== (token || null)) {
    if (pendingAuth?.token !== token) {
      const auth: Promise<unknown> = token
        ? client.login(token)
        : client.logout();
      const promise = auth.finally(() => {
        if (pendingAuth?.promise === promise) {
          pendingAuth = null;
        }
      });
      pendingAuth = { token, promise };
    }
    await pendingAuth.promise;
  }
  return client;
}

type AdditionalStream = NonNullable<
  Awaited<
    ReturnType<F1TVClient['contentVideo']>
  >['metadata']['additionalStreams']
>[number];

/** Names a feed the way the F1TV web app lists it. */
function toChannel(stream: AdditionalStream): StreamChannel {
  const onboard = stream.type === 'obc';
  return {
    channelId: stream.channelId,
    type: stream.type,
    identifier: String(stream.identifier),
    title: stream.title,
    driverName: onboard
      ? [stream.driverFirstName, stream.driverLastName]
          .filter(Boolean)
          .join(' ')
      : undefined,
    racingNumber: onboard ? stream.racingNumber : undefined,
    color: stream.hex,
    default: stream.default,
  };
}

/** F1TV's saved position for VOD content, or undefined if it can't be read. */
async function getResumePosition(
  client: F1TVClient,
  contentId: number,
  duration: number,
) {
  try {
    const { resultObj } = await client.contentUserSelections([
      { contentId, duration },
    ]);
    return resultObj[contentId]?.user.resume.playHeadPosition;
  } catch (error) {
    console.warn('Could not read the F1TV resume position', error);
    return undefined;
  }
}

type PlayFeed = Awaited<
  ReturnType<typeof F1TVClient.prototype.contentPlay<'player_tm'>>
>['resultObj']['tme']['feeds'][number];

/** Everything about a content that doesn't depend on the chosen feed. */
interface PlaySession {
  content: Omit<PlayerContent, 'channelId' | 'streamUrl'>;
  /** The feed played when none is asked for. */
  defaultChannelId?: number;
  feeds: PlayFeed[];
}

/**
 * Open play sessions by content ID. One PLAY request (player_tm) returns
 * every feed of the content, so the page, its tiles, previews and pop-outs
 * all share it; endSession() drops it when the page closes.
 */
const sessions = new Map<number, Promise<PlaySession>>();
const SESSION_END_DELAY_MS = 2000;

async function loadSession(contentId: number): Promise<PlaySession> {
  const client = await getClient();
  const { metadata } = await client.contentVideo(contentId);
  const channels = (metadata.additionalStreams ?? []).map(toChannel);
  // Ask with the default feed's ID, as the F1TV web app does. Without a
  // channel ID, F1 LIVE played with the international feed's audio.
  const defaultChannelId = (
    channels.find((channel) => channel.default) ?? channels[0]
  )?.channelId;
  const live = metadata.contentSubtype === 'LIVE';
  contentSubtypes.set(contentId, metadata.contentSubtype);
  const [{ resultObj }, savedPosition] = await Promise.all([
    client.contentPlay(contentId, 'player_tm', defaultChannelId),
    live ? undefined : getResumePosition(client, contentId, metadata.duration),
  ]);

  // The web player ignores positions in the first minResumeSeconds; skip the
  // same margin at the end, where there's nothing left to resume.
  const capture = client.config.bitmovin.playProgressCapture;
  const resumePosition =
    savedPosition !== undefined &&
    savedPosition > capture.minResumeSeconds &&
    savedPosition < metadata.duration - capture.minResumeSeconds
      ? savedPosition
      : undefined;

  if (!live) {
    noteVideo(contentId, {
      title: metadata.title,
      subtitle:
        metadata.emfAttributes.Global_Meeting_Name ||
        metadata.emfAttributes.Meeting_Name ||
        undefined,
      imageUrl: metadata.pictureUrl
        ? pictureUrl(metadata.pictureUrl, 640, 360)
        : undefined,
      durationSeconds: metadata.duration,
    });
    // Picks up progress made on F1TV elsewhere.
    if (resumePosition !== undefined) {
      notePosition(contentId, resumePosition);
    }
  }

  if (resultObj.laURL) {
    licenseUrls.set(contentId, resultObj.laURL);
  } else {
    licenseUrls.delete(contentId);
  }
  const { feeds } = resultObj.tme;
  for (const feed of feeds) {
    videoHosts.add(new URL(feed.url).hostname);
  }

  return {
    content: {
      contentId,
      channels,
      title: metadata.title,
      description: metadata.longDescription || metadata.shortDescription,
      drm: Boolean(resultObj.laURL),
      audioTrackNames: Object.fromEntries(
        feeds.map((feed) => [
          feed.metadata.channel_id,
          feed.audio_track_names ?? {},
        ]),
      ),
      live,
      resumePosition,
      reportIntervalMs: capture.enabled && !live ? capture.interval : undefined,
    },
    defaultChannelId,
    feeds,
  };
}

/** Sessions ending soon, by content ID; see endSession(). */
const endingSessions = new Map<number, NodeJS.Timeout>();

function getSession(contentId: number) {
  clearTimeout(endingSessions.get(contentId));
  endingSessions.delete(contentId);
  let session = sessions.get(contentId);
  if (!session) {
    session = loadSession(contentId);
    sessions.set(contentId, session);
    // A failed load is retried on the next request.
    session.catch(() => {
      if (sessions.get(contentId) === session) {
        sessions.delete(contentId);
      }
    });
  }
  return session;
}

/** A content's details and the stream of one of its feeds. */
async function getContent(
  contentId: number,
  channelId?: number,
): Promise<PlayerContent> {
  const { content, defaultChannelId, feeds } = await getSession(contentId);
  const playingChannelId = channelId ?? defaultChannelId;
  // Single-feed content has one feed, whatever its channel ID.
  const feed =
    feeds.find(({ metadata }) => metadata.channel_id === playingChannelId) ??
    (content.channels.length === 0 ? feeds[0] : undefined);
  if (!feed) {
    throw new Error(
      `F1TV returned no stream for channel ${playingChannelId} of content ${contentId}`,
    );
  }
  return {
    ...content,
    channelId: playingChannelId,
    streamUrl: feed.url,
  };
}

/**
 * Forgets a content's play session once its page is closed. It waits a
 * moment, so a page that mounts again right away (React's StrictMode does
 * in development) keeps its session instead of making a second request.
 */
function endSession(contentId: number) {
  clearTimeout(endingSessions.get(contentId));
  endingSessions.set(
    contentId,
    setTimeout(() => {
      endingSessions.delete(contentId);
      sessions.delete(contentId);
      certificates.delete(contentId);
    }, SESSION_END_DELAY_MS),
  );
}

/** Saves the playhead as F1TV's resume position, as the web player does. */
async function reportPosition(contentId: number, seconds: number) {
  const client = await getClient();
  const { enabled, minResumeSeconds } =
    client.config.bitmovin.playProgressCapture;
  const subtype = contentSubtypes.get(contentId);
  if (
    !enabled ||
    !subtype ||
    subtype === 'LIVE' ||
    seconds <= minResumeSeconds
  ) {
    return;
  }
  notePosition(contentId, seconds);
  await client.actionPlay(contentId, seconds, subtype);
}

/**
 * Widevine service certificates by content ID. The CDM asks for one with a
 * two-byte challenge (08 04) before each license; every feed shares it.
 */
const certificates = new Map<number, Promise<ArrayBuffer>>();

const isCertificateRequest = (challenge: Uint8Array) =>
  challenge.length === 2 && challenge[0] === 0x08 && challenge[1] === 0x04;

/**
 * Every feed of a content shares its play response's license URL, and one
 * key: F1TV's own player asks once for the certificate and once for the
 * license, whatever it shows. Each tile here has its own player, so each
 * still needs its own license, but the certificate is fetched once.
 */
async function requestLicense(contentId: number, challenge: Uint8Array) {
  if (!isCertificateRequest(challenge)) {
    return postLicense(contentId, challenge);
  }
  let certificate = certificates.get(contentId);
  if (!certificate) {
    certificate = postLicense(contentId, challenge);
    certificates.set(contentId, certificate);
    certificate.catch(() => certificates.delete(contentId));
  }
  return certificate;
}

async function postLicense(contentId: number, challenge: Uint8Array) {
  const licenseUrl = licenseUrls.get(contentId);
  if (!licenseUrl) {
    throw new Error(`No license URL for content ${contentId}`);
  }
  const client = await getClient();
  if (!client.ascendon || !client.entitlement) {
    throw new Error('Not logged in to F1TV');
  }
  const response = await fetch(licenseUrl, {
    method: 'POST',
    headers: {
      ascendontoken: client.ascendon,
      entitlementtoken: client.entitlement,
      'content-type': 'application/octet-stream',
    },
    // Copy into a plain ArrayBuffer-backed view for fetch.
    body: challenge.slice(),
  });
  if (!response.ok) {
    throw new Error(`License request failed (status ${response.status})`);
  }
  return response.arrayBuffer();
}

/** Hosts of the streams F1TV has handed out, wherever their CDN is. */
const videoHosts = new Set<string>();

const isVideoHost = (url: string) => {
  const { hostname } = new URL(url);
  return (
    /^ott-video[\w-]*\.formula1\.com$/.test(hostname) ||
    videoHosts.has(hostname)
  );
};

/**
 * The F1TV video CDN only allows the f1tv.formula1.com origin, so let the app
 * fetch manifests and segments from its own origin.
 */
function allowVideoCors(session: Session) {
  session.webRequest.onHeadersReceived(
    // Any host, since stream CDNs aren't always on formula1.com.
    { urls: ['https://*/*'] },
    ({ url, responseHeaders = {} }, callback) => {
      if (!isVideoHost(url)) {
        callback({});
        return;
      }
      for (const name of Object.keys(responseHeaders)) {
        if (name.toLowerCase().startsWith('access-control-allow-')) {
          delete responseHeaders[name];
        }
      }
      responseHeaders['Access-Control-Allow-Origin'] = ['*'];
      callback({ responseHeaders });
    },
  );
}

/** Registers the player IPC handlers. */
export function initPlayer(session: Session) {
  allowVideoCors(session);

  ipcMain.handle(
    PlayerChannel.GetContent,
    (_event, contentId: number, channelId?: number) =>
      getContent(contentId, channelId),
  );

  ipcMain.handle(
    PlayerChannel.RequestLicense,
    (
      _event,
      contentId: number,
      _channelId: number | undefined,
      challenge: Uint8Array,
    ) => requestLicense(contentId, challenge),
  );

  ipcMain.handle(PlayerChannel.EndSession, (_event, contentId: number) =>
    endSession(contentId),
  );

  ipcMain.handle(
    PlayerChannel.ReportPosition,
    (_event, contentId: number, seconds: number) =>
      reportPosition(contentId, seconds),
  );
}
