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

  useEffect(() => {
    player.onPlayerData(playerDataCb);

    return () => {
      player.offPlayerData(playerDataCb);
    };
  }, []);

  useEffect(() => {
    if (!videoContainer)
      return;

    player
      .contentPlay(videoContainer.contentId)
      .then(playData => {
        const currentRef = playerRef.current;

        if (!currentRef)
          return;

        const stream = videoContainer.metadata.additionalStreams ? videoContainer.metadata.additionalStreams.find(stream => stream.identifier === 'WIF') : null;

        const source: SourceConfig = {
          title: `${videoContainer.metadata.title}${stream && stream.type === 'obc' ? ` - ${stream.driverFirstName} ${stream.driverLastName}` : ''}`,
        };

        if (playData.streamType === 'DASHWV' && playData.drmType === 'widevine' && playData.laURL) {
          source.drm = {
            widevine: {
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
  }, [videoContainer]);

  return ascendon && config && initialLoad === false ? <>
    {videoContainer && videoContainer.metadata.additionalStreams &&
      <Overlay>
        <div className={styles['additional-streams-overlay']}>
          {videoContainer.metadata.additionalStreams.map(stream => (
            <button
              key={stream.channelId}
              onClick={() => {
                const currentRef = playerRef.current;

                if (!currentRef)
                  return;

                player
                  .contentPlay(videoContainer.contentId, stream.identifier !== 'WIF' ? stream.channelId : undefined)
                  .then(newPlayData => {
                    const source: SourceConfig = {
                      title: `${videoContainer.metadata.title}${stream.type === 'obc' ? ` - ${stream.driverFirstName} ${stream.driverLastName}` : ''}`,
                    };

                    if (newPlayData.streamType === 'DASHWV' && newPlayData.drmType === 'widevine' && newPlayData.laURL) {
                      source.drm = {
                        widevine: {
                          LA_URL: newPlayData.laURL,
                          headers: {
                            'Ascendontoken': ascendon,
                            'Entitlementtoken': newPlayData.entitlementToken,
                          },
                        }
                      };
            
                      if (newPlayData.drmToken)
                        source.drm.widevine.headers['Customdata'] = newPlayData.drmToken;
            
                      source.dash = newPlayData.url;
                    } else if (newPlayData.streamType === 'HLS') {
                      source.hls = newPlayData.url;
                    } else {
                      throw new Error('Unsupported stream type');
                    }
                    currentRef.api.load(source);
                  });
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
        remotecontrol: {
          type: 'googlecast',
          receiverApplicationId: config.bitmovin.chromecast.receiverApplicationId,
          receiverVersion: 'v3',
          messageNamespace: config.bitmovin.chromecast.messageNamespace,
        },
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
