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

import { useEffect, useRef, useState } from "react";
import VideoPlayer, { VideoPlayerRef } from "./Component/VideoPlayer";
import { ContentPlayResult } from "@exhumer/f1tv-api";

const App = () => {
  const [playRes, setPlayRes] = useState<ContentPlayResult | null>(null);
  // const [videoRes, setVideoRes] = useState<ContentVideoResult | null>(null);
  const ref = useRef<VideoPlayerRef>(null);

  useEffect(() => {
    player.onContentVideo((e, result) => {
      player.contentPlay(result.contentId).then(res => {
        setPlayRes(res);
      });
    });
  }, []);

  return playRes !== null ?
    <VideoPlayer
      src={playRes.url}
      config={playRes === null || playRes.streamType !== "DASHWV" || playRes.laUrl === undefined ? undefined : {
        drm: {
          servers: {
            "com.widevine.alpha": playRes.laUrl,
          }
        }
      }}
      ref={ref}
    /> :
    <div>Loading...</div>;
};

export default App;
