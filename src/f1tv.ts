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
/** Widevine license URLs from the play responses, by licenseKey(). */
const licenseUrls = new Map<string, string>();

const licenseKey = (contentId: number, channelId?: number) =>
  `${contentId}/${channelId ?? ''}`;
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

async function getContent(
  contentId: number,
  channelId?: number,
): Promise<PlayerContent> {
  const client = await getClient();
  const { metadata } = await client.contentVideo(contentId);
  const channels = (metadata.additionalStreams ?? []).map(toChannel);
  // Ask for the default feed by ID, as the F1TV web app does. Without a
  // channel ID, F1 LIVE played with the international feed's audio.
  const playingChannelId =
    channelId ??
    (channels.find((channel) => channel.default) ?? channels[0])?.channelId;
  const live = metadata.contentSubtype === 'LIVE';
  contentSubtypes.set(contentId, metadata.contentSubtype);
  const [{ resultObj }, savedPosition] = await Promise.all([
    client.contentPlay(contentId, 'player_bm', playingChannelId),
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

  const key = licenseKey(contentId, playingChannelId);
  if (resultObj.laURL) {
    licenseUrls.set(key, resultObj.laURL);
  } else {
    licenseUrls.delete(key);
  }

  return {
    contentId,
    channelId: playingChannelId,
    channels,
    title: metadata.title,
    description: metadata.longDescription || metadata.shortDescription,
    streamUrl: resultObj.url,
    drm: Boolean(resultObj.laURL),
    live,
    resumePosition,
    reportIntervalMs: capture.enabled && !live ? capture.interval : undefined,
  };
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

async function requestLicense(
  contentId: number,
  channelId: number | undefined,
  challenge: Uint8Array,
) {
  const licenseUrl = licenseUrls.get(licenseKey(contentId, channelId));
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

const isVideoHost = (url: string) =>
  /^ott-video[\w-]*\.formula1\.com$/.test(new URL(url).hostname);

/**
 * The F1TV video CDN only allows the f1tv.formula1.com origin, so let the app
 * fetch manifests and segments from its own origin.
 */
function allowVideoCors(session: Session) {
  session.webRequest.onHeadersReceived(
    { urls: ['https://*.formula1.com/*'] },
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
      channelId: number | undefined,
      challenge: Uint8Array,
    ) => requestLicense(contentId, channelId, challenge),
  );

  ipcMain.handle(
    PlayerChannel.ReportPosition,
    (_event, contentId: number, seconds: number) =>
      reportPosition(contentId, seconds),
  );
}
