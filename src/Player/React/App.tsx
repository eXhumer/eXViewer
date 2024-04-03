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
import VideoPlayer, { VideoPlayerRef } from './Component/VideoPlayer';
import { ContentVideoContainer } from '@exhumer/f1tv-api';
import Overlay from './Component/Overlay';

const App = () => {
  const [videoContainer, setVideoContainer] = useState<ContentVideoContainer | null>(null);
  const playerRef = useRef<VideoPlayerRef | null>(null);

  useEffect(() => {
    player.onContentVideo((e, newVideoContainer) => {
      setVideoContainer(newVideoContainer);

      player.contentPlay(newVideoContainer.contentId)
        .then(newPlayData => {
          const currentRef = playerRef.current;

          if (!currentRef)
            return;

          if (newPlayData.streamType === 'DASHWV' && newPlayData.drmType === 'DASHWV' && newPlayData.laUrl) {
            currentRef.player.configure({
              drm: {
                servers: {
                  'com.widevine.alpha': newPlayData.laUrl,
                },
              },
            });
          }

          currentRef.player.load(newPlayData.url);
        });
    });
  }, []);

  return <>
    {videoContainer && videoContainer.metadata.additionalStreams &&
      <Overlay>
        <div>
          {videoContainer.metadata.additionalStreams.map(stream => (
            <button
              style={{
                pointerEvents: 'auto', // This is needed to make the button clickable
              }}
              key={stream.channelId}
              onClick={() => {
                const currentRef = playerRef.current;

                if (!currentRef)
                  return;

                const currentTime = currentRef.videoElement.currentTime;

                player.contentPlay(videoContainer.contentId, stream.identifier !== "WIF" ? stream.channelId : undefined)
                  .then(newPlayData => {
                    if (newPlayData.streamType === 'DASHWV' && newPlayData.drmType === 'DASHWV' && newPlayData.laUrl) {
                      currentRef.player.configure({
                        drm: {
                          servers: {
                            'com.widevine.alpha': newPlayData.laUrl,
                          },
                        },
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
    <VideoPlayer ref={playerRef} />
  </>;
};

export default App;
