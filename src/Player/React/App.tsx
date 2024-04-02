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
