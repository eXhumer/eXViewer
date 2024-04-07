/*
  eXViewer - Unofficial live timing and content streaming client for F1TV
  Copyright (C) 2024  eXhumer

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, ForwardRefRenderFunction } from 'react';

import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';
import './VideoPlayer.css';

export type VideoPlayerRef = {
  readonly player: shaka.Player;
  readonly ui: shaka.ui.Overlay;
  readonly videoElement: HTMLVideoElement;
};

export type VideoPlayerProps = {
  autoPlay?: boolean;
};

export type VideoPlayerFn = ForwardRefRenderFunction<VideoPlayerRef, VideoPlayerProps>;

const VideoPlayer: VideoPlayerFn = ({ autoPlay }, ref) => {
  const uiRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [player, setPlayer] = useState<shaka.Player | null>(null);
  const [ui, setUi] = useState<shaka.ui.Overlay | null>(null);

  useEffect(() => {
    const newPlayer = new shaka.Player();
    setPlayer(newPlayer);

    const newUi = new shaka.ui.Overlay(newPlayer, uiRef.current, videoRef.current);
    setUi(newUi);

    newPlayer.attach(videoRef.current);
  
    return () => {
      player.destroy();
      ui.destroy();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    get player() {
      return player;
    },
    get ui() {
      return ui;
    },
    get videoElement() {
      return videoRef.current;
    }
  }));

  return (
    <div ref={uiRef} className={'all-available-space'}>
      <video ref={videoRef}
        autoPlay={autoPlay}
        className={'all-available-space'}
      />
    </div>
  );
};

export default forwardRef<VideoPlayerRef, VideoPlayerProps>(VideoPlayer);
