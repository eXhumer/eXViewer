// Shared between main, preload and renderer. Keep this file type-only.

/** A feed of a session, such as the main feed or a driver onboard. */
export interface StreamChannel {
  channelId: number;
  /** 'obc' for driver onboards, 'additional' for the other feeds. */
  type: 'additional' | 'obc';
  /** F1TV's feed identifier: PRES (F1 LIVE), WIF, TRACKER, DATA or OBC. */
  identifier: string;
  /** Feed name, such as F1 LIVE, or the driver's code (NOR) for onboards. */
  title: string;
  /** Full driver name, for onboards. */
  driverName?: string;
  racingNumber?: number;
  /** Team colour as #rrggbb, for onboards. */
  color?: string;
  default: boolean;
}

/**
 * Where to start a stream: a time in seconds for VOD, or how far behind the
 * live edge for live streams (Infinity for the start of the stream).
 * Undefined starts VOD at the beginning and live at the live edge.
 */
export type StartPosition = { time: number } | { behindLive: number };

/** A feed to open in its own floating window. */
export interface PopOutRequest {
  contentId: number;
  channelId?: number;
  /** Where to start, so the new window lines up with the one it came from. */
  start?: StartPosition;
}

export interface PlayerContent {
  contentId: number;
  /** The playing channel, or undefined for content with a single feed. */
  channelId?: number;
  /** Feeds to choose from. Empty for content with a single feed. */
  channels: StreamChannel[];
  title: string;
  description: string;
  /** DASH or HLS manifest URL. */
  streamUrl: string;
  /**
   * F1TV's names for each feed's audio tracks, by channel ID, then by the
   * track's name in the playlist (eng, deu, fx, tea…).
   */
  audioTrackNames: Record<number, Record<string, string>>;
  /** True when the stream needs a Widevine license (see PlayerApi.requestLicense). */
  drm: boolean;
  /** True for a live session (F1TV contentSubtype LIVE). */
  live: boolean;
  /** F1TV's saved position in seconds, when there's one worth resuming. */
  resumePosition?: number;
  /** How often to report the playhead while playing; undefined to not report. */
  reportIntervalMs?: number;
}

export interface PlayerApi {
  /**
   * Loads the title, description, channels and stream for an F1TV content ID,
   * playing the given channel or the default one.
   */
  getContent(contentId: number, channelId?: number): Promise<PlayerContent>;
  /**
   * Sends a Widevine license challenge for a stream loaded with getContent().
   * The F1TV tokens stay in the main process.
   */
  requestLicense(
    contentId: number,
    channelId: number | undefined,
    challenge: Uint8Array,
  ): Promise<ArrayBuffer>;
  /**
   * Ends a content's play session when its page closes. Until then every
   * getContent() for it reuses one F1TV play response, which has all feeds.
   */
  endSession(contentId: number): Promise<void>;
  /** Saves the playhead (seconds) as F1TV's resume position for VOD content. */
  reportPosition(contentId: number, seconds: number): Promise<void>;
  /** Opens a feed in a new always-on-top window the user can place freely. */
  popOut(request: PopOutRequest): Promise<void>;
}

export const PlayerChannel = {
  GetContent: 'player:get-content',
  RequestLicense: 'player:request-license',
  ReportPosition: 'player:report-position',
  PopOut: 'player:pop-out',
  EndSession: 'player:end-session',
} as const;
