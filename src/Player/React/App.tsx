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

import { useEffect, useRef, useState } from 'react';
import BitmovinPlayer, { BitmovinPlayerRef } from './Component/BitmovinPlayer';
import type { SourceConfig } from 'bitmovin-player';
import { ContentVideoContainer } from '@exhumer/f1tv-api';
import Overlay from './Component/Overlay';
import styles from './App.module.css';

const App = () => {
  const [ascendon, setAscendon] = useState<string | null>(null);
  const [videoContainer, setVideoContainer] = useState<ContentVideoContainer | null>(null);
  const [playerKey, setPlayerKey] = useState<string | null>(null);
  const playerRef = useRef<BitmovinPlayerRef | null>(null);

  useEffect(() => {
    player.onPlayerData((e, newVideoContainer, ascendon) => {
      setAscendon(ascendon);
      setVideoContainer(newVideoContainer);
    });
  }, []);

  useEffect(() => {
    if (!videoContainer)
      return;

    player
      .contentPlay(videoContainer.contentId)
      .then(res => {
        if (playerKey !== res.config.bitmovin.bitmovinKeys.player)
          setPlayerKey(res.config.bitmovin.bitmovinKeys.player);

        return res.resultObj;
      })
      .then(playData => {
        const currentRef = playerRef.current;

        if (!currentRef)
          return;

        const source: SourceConfig = {
          title: videoContainer.metadata.title,
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
  }, [playerKey, videoContainer]);

  return <>
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
                  .then(res => {
                    if (playerKey !== res.config.bitmovin.bitmovinKeys.player)
                      setPlayerKey(res.config.bitmovin.bitmovinKeys.player);
            
                    return res.resultObj;
                  })
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
    {videoContainer && playerKey && <BitmovinPlayer
      playerKey={playerKey}
      config={{
        buffer: {
          audio: {
            forwardduration: 10,
            backwardduration: 10,
          },
          video: {
            forwardduration: 10,
            backwardduration: 10,
          },
        },
        playback: {
          autoplay: true,
          // audioLanguage: ''
        },
      }}
      ref={playerRef}
    />}
  </>;
};

export default App;
