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

import { useEffect, useState } from 'react';
import VideoPlayer from './Component/VideoPlayer';
import { ContentPlayResult, ContentVideoContainer } from '@exhumer/f1tv-api';
import Overlay from './Component/Overlay';

const App = () => {
  const [playData, setPlayData] = useState<ContentPlayResult | null>(null);
  const [videoContainer, setVideoContainer] = useState<ContentVideoContainer | null>(null);

  useEffect(() => {
    player.onContentVideo((e, newVideoContainer) => {
      setVideoContainer(newVideoContainer);

      if (!playData) {
        player.contentPlay(newVideoContainer.contentId)
          .then(newPlayData => {
            setPlayData(newPlayData);
          });
      }
    });
  }, []);

  return playData !== null ? <>
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
                player.contentPlay(videoContainer.contentId, stream.channelId)
                  .then(newPlayData => {
                    setPlayData(newPlayData);
                  });
              }}
            >
              {stream.title}
            </button>
          ))}
        </div>
      </Overlay>}
    <VideoPlayer
      src={playData.url}
      config={playData === null || playData.streamType !== 'DASHWV' || playData.laUrl === undefined ? undefined : {
        drm: {
          servers: {
            'com.widevine.alpha': playData.laUrl,
          }
        }
      }}
    />
  </>:
  <div>Loading...</div>;
};

export default App;
