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

import { useCallback, useEffect, useRef, useState } from 'react';
import BitmovinPlayer, { BitmovinPlayerRef } from './Component/BitmovinPlayer';
import type { SourceConfig } from 'bitmovin-player';
import { ContentVideoContainer, Config } from '@exhumer/f1tv-api';
import { selectAscendon, update as updateAscendon } from './Reducer/Ascendon';
import { selectConfig, update as updateConfig } from './Reducer/Config';
import { useAppDispatch, useAppSelector } from './Hook';
import Overlay from './Component/Overlay';
import styles from './App.module.css';
import type { IpcRendererEvent } from 'electron';

import { author, productName } from '../../../package.json';

const App = () => {
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  const ascendon = useAppSelector(selectAscendon);
  const config = useAppSelector(selectConfig);
  const dispatch = useAppDispatch();
  const playerDataCb = useCallback((e: IpcRendererEvent, vidContainer: ContentVideoContainer, ascendon: string, config: Config) => {
    dispatch(updateAscendon(ascendon));
    dispatch(updateConfig(config));
    setVideoContainer(vidContainer);
    setInitialLoad(false);
  }, []);

  const [videoContainer, setVideoContainer] = useState<ContentVideoContainer | null>(null);
  const playerRef = useRef<BitmovinPlayerRef | null>(null);

  const switchChannel = (channelId?: number) => {
    if (!videoContainer || !playerRef.current)
      return;

    player
      .contentPlay(videoContainer.contentId, channelId)
      .then(playData => {
        const currentRef = playerRef.current;

        const stream = videoContainer.metadata.additionalStreams ? videoContainer.metadata.additionalStreams.find(stream => stream.identifier === 'WIF') : null;

        const source: SourceConfig = {
          title: `${videoContainer.metadata.title}${stream && stream.type === 'obc' ? ` - ${stream.driverFirstName} ${stream.driverLastName}` : ''}`,
        };

        if (playData.streamType === 'DASHWV' && playData.drmType === 'widevine' && playData.laURL) {
          source.drm = {
            widevine: {
              audioRobustness: 'SW_SECURE_CRYPTO', // Widevine L3
              videoRobustness: 'SW_SECURE_CRYPTO', // Widevine L3
              LA_URL: playData.laURL,
              headers: {
                'Ascendontoken': ascendon,
                'Entitlementtoken': playData.entitlementToken,
              },
            }
          };

          if (playData.drmToken)
            source.drm.widevine.headers['Customdata'] = playData.drmToken;
        }

        if (playData.streamType === 'HLS') {
          source.hls = playData.url;
        } else if (playData.streamType === 'DASH' || playData.streamType === 'DASHWV') {
          source.dash = playData.url;
        }

        currentRef.api.load(source);
      });
  };

  useEffect(() => {
    player.onPlayerData(playerDataCb);

    return () => {
      player.offPlayerData(playerDataCb);
    };
  }, []);

  useEffect(() => {
    if (!videoContainer)
      return;

    if (videoContainer.metadata.additionalStreams) {
      const defaultStream = videoContainer.metadata.additionalStreams.find(stream => stream.default === true);
      switchChannel(defaultStream.identifier !== 'WIF' ? defaultStream.channelId : undefined);
    } else
      switchChannel();
  }, [videoContainer]);

  return ascendon && config && initialLoad === false ? <>
    {videoContainer && videoContainer.metadata.additionalStreams &&
      <Overlay>
        <div className={styles['additional-streams-overlay']}>
          {videoContainer.metadata.additionalStreams.map(stream => (
            <button
              key={stream.channelId}
              onClick={() => {
                switchChannel(stream.identifier !== 'WIF' ? stream.channelId : undefined);
              }}
            >
              {stream.title}
            </button>
          ))}
        </div>
      </Overlay>}
    {videoContainer && config && <BitmovinPlayer
      playerKey={config.bitmovin.bitmovinKeys.player}
      config={{
        buffer: {
          audio: {
            forwardduration: config.bitmovin.buffer.audio.forwardduration,
            backwardduration: config.bitmovin.buffer.audio.backwardduration,
          },
          video: {
            forwardduration: config.bitmovin.buffer.video.forwardduration,
            backwardduration: config.bitmovin.buffer.video.backwardduration,
          },
        },
        playback: {
          autoplay: true,
        },
        tweaks: {
          file_protocol: true,
          app_id: `com.${author.name}.${productName}`.toLowerCase(),
        },
      }}
      ref={playerRef}
    />}
  </> : <>
    <h1>Loading...</h1>
  </>;
};

export default App;
