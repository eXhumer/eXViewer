import { forwardRef, useEffect, useImperativeHandle, useRef, useState, CSSProperties, ForwardRefRenderFunction } from 'react';

import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

const VideoPlayer: ForwardRefRenderFunction<{
  readonly player: shaka.Player;
  readonly ui: shaka.ui.Overlay;
  readonly videoElement: HTMLVideoElement;
}, {
  config?: RecursivePartial<shaka.extern.PlayerConfiguration>;
  src?: string;
  uiStyle?: CSSProperties;
}> = ({ config, src, uiStyle }, ref) => {
  const uiRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [player, setPlayer] = useState<shaka.Player | null>(null);
  const [uiOverlay, setUiOverlay] = useState<shaka.ui.Overlay | null>(null);

  useEffect(() => {
    const newPlayer = new shaka.Player();
    setPlayer(newPlayer);

    const newUiOverlay = new shaka.ui.Overlay(newPlayer, uiRef.current, videoRef.current);
    setUiOverlay(newUiOverlay);

    newPlayer.attach(videoRef.current);
  
    return () => {
      player.destroy();
      uiOverlay.destroy();
    };
  }, []);

  useEffect(() => {
    if (player && config)
      player.configure(config);
  }, [player, config]);

  useEffect(() => {
    if (player && src)
      player.load(src);
  }, [player, src]);

  useImperativeHandle(ref, () => ({
    get player() {
      return player;
    },
    get ui() {
      return uiOverlay;
    },
    get videoElement() {
      return videoRef.current;
    }
  }));

  return (
    <div ref={uiRef} style={uiStyle}>
      <video ref={videoRef}
      />
    </div>
  );
};

export default forwardRef(VideoPlayer);
