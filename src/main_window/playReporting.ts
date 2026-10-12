import type shaka from 'shaka-player/dist/shaka-player.ui';
import type { PlayerContent } from '../shared/player';

/** Fractions of the video the web player reports on reaching. */
const MILESTONES = [0.25, 0.5, 0.75, 0.9];

/**
 * Reports the playhead to F1TV the way the web player does: on pause, seek,
 * end and errors, at 25/50/75/90%, every reportIntervalMs while playing, and
 * when playback stops. Live streams are never reported.
 *
 * Returns a function that stops tracking and sends a final report.
 */
export function trackPlayback(
  player: shaka.Player,
  video: HTMLVideoElement,
  getContent: () => PlayerContent | null,
) {
  const reached = new Set<number>();
  let primed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const report = () => {
    const content = getContent();
    if (
      !content ||
      content.reportIntervalMs === undefined ||
      player.isLive() ||
      !video.currentTime
    ) {
      return;
    }
    window.player
      .reportPosition(content.contentId, video.currentTime)
      .catch((error: unknown) => {
        console.warn('Could not save the F1TV position', error);
      });
  };

  const stopHeartbeat = () => {
    clearInterval(heartbeat);
    heartbeat = undefined;
  };

  const onPlaying = () => {
    const interval = getContent()?.reportIntervalMs;
    if (heartbeat === undefined && interval) {
      heartbeat = setInterval(report, interval);
    }
  };

  const onPausedOrEnded = () => {
    stopHeartbeat();
    report();
  };

  // A new stream starts wherever it was asked to; milestones before that
  // point don't count as reached.
  const onLoading = () => {
    primed = false;
    reached.clear();
  };

  const onTimeUpdate = () => {
    if (!video.duration || player.isLive()) {
      return;
    }
    const progress = video.currentTime / video.duration;
    let crossed = false;
    for (const milestone of MILESTONES) {
      if (progress >= milestone && !reached.has(milestone)) {
        reached.add(milestone);
        crossed = primed;
      }
    }
    primed = true;
    if (crossed) {
      report();
    }
  };

  video.addEventListener('playing', onPlaying);
  video.addEventListener('pause', onPausedOrEnded);
  video.addEventListener('ended', onPausedOrEnded);
  video.addEventListener('seeked', report);
  video.addEventListener('timeupdate', onTimeUpdate);
  player.addEventListener('loading', onLoading);
  player.addEventListener('error', report);

  return () => {
    stopHeartbeat();
    video.removeEventListener('playing', onPlaying);
    video.removeEventListener('pause', onPausedOrEnded);
    video.removeEventListener('ended', onPausedOrEnded);
    video.removeEventListener('seeked', report);
    video.removeEventListener('timeupdate', onTimeUpdate);
    player.removeEventListener('loading', onLoading);
    player.removeEventListener('error', report);
    report();
  };
}
