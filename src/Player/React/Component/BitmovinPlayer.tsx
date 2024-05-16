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

import { forwardRef, useEffect, useRef, useState, ForwardRefRenderFunction, useImperativeHandle } from 'react';

import { Player, PlayerAPI, PlayerConfig } from 'bitmovin-player/modules/bitmovinplayer-core';
import Abr from 'bitmovin-player/modules/bitmovinplayer-abr';
import ContainerMP4 from 'bitmovin-player/modules/bitmovinplayer-container-mp4';
import ContainerTS from 'bitmovin-player/modules/bitmovinplayer-container-ts';
import EngineBitmovin from 'bitmovin-player/modules/bitmovinplayer-engine-bitmovin';
import RendererMSE from 'bitmovin-player/modules/bitmovinplayer-mserenderer';
import Hls from 'bitmovin-player/modules/bitmovinplayer-hls';
import Dash from 'bitmovin-player/modules/bitmovinplayer-dash';
import Drm from 'bitmovin-player/modules/bitmovinplayer-drm';
import Thumbnail from 'bitmovin-player/modules/bitmovinplayer-thumbnail';
import Xml from 'bitmovin-player/modules/bitmovinplayer-xml';
import Crypto from 'bitmovin-player/modules/bitmovinplayer-crypto';
import Style from 'bitmovin-player/modules/bitmovinplayer-style';
import { UIManager } from 'bitmovin-player-ui';

import './BitmovinPlayer.scss'; // Import the custom UI style

import PlayerUI from './PlayerUI';

export type BitmovinPlayerConfig = Omit<PlayerConfig, 'key'>;

export type BitmovinPlayerProps = {
  playerKey: string;
  config?: BitmovinPlayerConfig;
};

export type BitmovinPlayerRef = {
  readonly api: PlayerAPI | null;
};

export type BitmovinPlayerFn = ForwardRefRenderFunction<BitmovinPlayerRef, BitmovinPlayerProps>;

const BitmovinPlayer: BitmovinPlayerFn = ({ playerKey, config }, ref) => {
  const [api, setAPI] = useState<PlayerAPI | null>(null);
  const playerDivRef = useRef<HTMLDivElement>();

  useEffect(() => {
    Player.addModule(EngineBitmovin); // Adaptive Streaming capabilities for a wide variety of platforms
    Player.addModule(Abr); // Adaptation logic
    Player.addModule(ContainerMP4); // Parsing and processing of specific container formats
    Player.addModule(ContainerTS); // Parsing and processing of specific container formats
    Player.addModule(RendererMSE); // Video rendering for DASH / HLS / Smooth using the browser's Media Source Extensions
    Player.addModule(Hls); // HLS support
    Player.addModule(Xml); // XML file handling (e.g. for DASH or VAST manifests)
    Player.addModule(Dash); // MPEG-DASH support
    Player.addModule(Drm); // Support for a variety of DRM systems (Widevine, PlayReady, PrimeTime, Fairplay)
    Player.addModule(Thumbnail); // DASH and WebVTT thumbnail support
    Player.addModule(Crypto); // Support for HLS AES-128 or DASH ClearKey streams
    Player.addModule(Style); // Provides styling of the player

    const playerCtx = new Player(playerDivRef.current, { key: playerKey, ...config });
    new UIManager(playerCtx, PlayerUI());
    setAPI(playerCtx);

    return () => {
      if (api !== null)
        api.destroy();

      setAPI(null);
    };
  }, [config]);

  useImperativeHandle(ref, () => ({
    get api() {
      return api;
    },
    get playerDiv() {
      return playerDivRef.current;
    }
  }));

  return (
    <div ref={playerDivRef} id='player' />
  );
};

export default forwardRef<BitmovinPlayerRef, BitmovinPlayerProps>(BitmovinPlayer);
