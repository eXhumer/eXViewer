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
import VideoPlayer, { VideoPlayerRef } from './Component/ShakaPlayer';
import { ContentVideoContainer } from '@exhumer/f1tv-api';
import shaka from 'shaka-player';
import Overlay from './Component/Overlay';
import styles from './App.module.css';

const App = () => {
  const [ascendon, setAscendon] = useState<string | null>(null);
  const [videoContainer, setVideoContainer] = useState<ContentVideoContainer | null>(null);
  const playerRef = useRef<VideoPlayerRef | null>(null);

  const setPlayerRef = useCallback((ref?: VideoPlayerRef) => {
    if (ref && ref.player) {
      ref.player.configure({
        streaming: {
          bufferingGoal: 1,
          rebufferingGoal: 1,
          bufferBehind: 30,
        },
        manifest: {
          dash: {
            ignoreMinBufferTime: true,
          },
        },
      });
    }

    playerRef.current = ref;
  }, []);

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
      .then(playData => {
        const currentRef = playerRef.current;

        if (!currentRef)
          return;

        if (playData.streamType === 'DASHWV' && playData.drmType === 'widevine' && playData.laURL) {
          currentRef.player.configure({
            drm: {
              servers: {
                'com.widevine.alpha': playData.laURL,
              },
              advanced: {
                'com.widevine.alpha': {
                  // 'sessionType': 'persistent-license',
                  'videoRobustness': 'SW_SECURE_CRYPTO',
                  'audioRobustness': 'SW_SECURE_CRYPTO',
                },
              },
            },
          });

          currentRef.player.getNetworkingEngine().registerRequestFilter((type, request) => {
            if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
              request.headers['Ascendontoken'] = ascendon;
              request.headers['Entitlementtoken'] = playData.entitlementToken;

              if (playData.drmToken)
                request.headers['Customdata'] = playData.drmToken;
            }
          });
        }

        currentRef.player.load(playData.url);
      });
  }, [videoContainer]);

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

                const currentTime = currentRef.videoElement.currentTime;

                player
                  .contentPlay(videoContainer.contentId, stream.identifier !== 'WIF' ? stream.channelId : undefined)
                  .then(newPlayData => {
                    if (newPlayData.streamType === 'DASHWV' && newPlayData.drmType === 'widevine' && newPlayData.laURL) {
                      currentRef.player.configure({
                        drm: {
                          servers: {
                            'com.widevine.alpha': newPlayData.laURL,
                          },
                          advanced: {
                            'com.widevine.alpha': {
                              // 'sessionType': 'persistent-license',
                              'videoRobustness': 'SW_SECURE_CRYPTO',
                              'audioRobustness': 'SW_SECURE_CRYPTO',
                            },
                          },
                        },
                      });
                      currentRef.player.getNetworkingEngine().registerRequestFilter((type, request) => {
                        if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
                          request.headers['Ascendontoken'] = ascendon;
                          request.headers['Entitlementtoken'] = newPlayData.entitlementToken;

                          if (newPlayData.drmToken)
                            request.headers['Customdata'] = newPlayData.drmToken;
                        }
                      });
                    }
          
                    currentRef.player.load(newPlayData.url, currentTime);
                  });
              }}
            >
              {stream.title}
            </button>
          ))}
        </div>
      </Overlay>}
    <VideoPlayer autoPlay={true} ref={setPlayerRef} />
  </>;
};

export default App;
