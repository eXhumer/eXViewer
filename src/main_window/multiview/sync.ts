import type { TileHandle } from './Tile';

/** Followers further than this (seconds) from the leader jump to it. */
const SEEK_DRIFT = 2;
/** Followers further than this catch up by playing a little faster or slower. */
const NUDGE_DRIFT = 0.15;
const NUDGE_RATE = 0.1;

/**
 * The follower's time that matches the leader's. Live streams carry a wall
 * clock, so feeds whose timelines start at different moments still line up;
 * without one, the feeds share a timeline.
 */
export function followerTarget(leader: TileHandle, follower: TileHandle) {
  let time = leader.video.currentTime;
  const leaderStart = leader.player.getPresentationStartTimeAsDate();
  const followerStart = follower.player.getPresentationStartTimeAsDate();
  if (leaderStart && followerStart) {
    time += (leaderStart.getTime() - followerStart.getTime()) / 1000;
  }
  const range = follower.player.seekRange();
  return Math.min(Math.max(time, range.start), range.end);
}

/** Keeps a follower playing, paused and positioned like the leader. */
export function syncFollower(leader: TileHandle, follower: TileHandle) {
  const { video } = follower;
  if (video.readyState < HTMLMediaElement.HAVE_METADATA || video.seeking) {
    return;
  }
  if (leader.video.paused !== video.paused) {
    if (leader.video.paused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }
  const target = followerTarget(leader, follower);
  const drift = video.currentTime - target;
  const rate = leader.video.playbackRate;
  if (Math.abs(drift) > SEEK_DRIFT || (leader.video.paused && drift !== 0)) {
    if (Math.abs(drift) > NUDGE_DRIFT) {
      video.currentTime = target;
    }
    video.playbackRate = rate;
  } else if (Math.abs(drift) > NUDGE_DRIFT) {
    video.playbackRate = rate * (drift > 0 ? 1 - NUDGE_RATE : 1 + NUDGE_RATE);
  } else {
    video.playbackRate = rate;
  }
}
