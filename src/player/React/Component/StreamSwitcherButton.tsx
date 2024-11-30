import { F1TV } from '@exhumer/f1tv-api';
import { useState } from 'react';
import { usePlayerSelector } from '../Hook';

type StreamType = F1TV.ContentVideoContainer['metadata']['additionalStreams'][number];

type StreamSwitcherButtonProps = {
  onClick: (stream: StreamType) => void;
  stream: StreamType;
};

const StreamSwitcherButton = ({ onClick, stream }: StreamSwitcherButtonProps) => {
  const currentPlayResult = usePlayerSelector(state => state.player.currentPlayResult);

  const [hovered, setHovered] = useState(false);

  return (
    <button
      style={{
        backgroundColor: stream.hex,
        opacity: currentPlayResult !== null && currentPlayResult.channelId === stream.channelId ?
          1 :
          hovered ?
            0.8 :
            0.5,
      }}
      onClick={() => onClick(stream)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {stream.reportingName}
    </button>
  );
};

export default StreamSwitcherButton;
