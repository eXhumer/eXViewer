import type { StartPosition, StreamChannel } from '../../shared/player';
import { ChannelPreview } from './ChannelPreview';
import type { TileHandle } from './Tile';

interface ChannelListProps {
  /** The panel is open; its previews play only then. */
  open: boolean;
  contentId: number;
  channels: StreamChannel[];
  /** Channels on screen, by tile; their cards are marked. */
  showing: (number | undefined)[];
  getLeader(): TileHandle | null;
  getStart(): StartPosition | undefined;
  onChoose(channelId: number): void;
  onPopOut(channelId: number): void;
}

/**
 * The channel panel, like F1TV's: a live preview of every feed, then the
 * driver onboards. Click a channel to put it in the selected tile, or drag
 * it onto any tile.
 */
export function ChannelList({
  open,
  contentId,
  channels,
  showing,
  getLeader,
  getStart,
  onChoose,
  onPopOut,
}: ChannelListProps) {
  const feeds = channels.filter((channel) => channel.type !== 'obc');
  const drivers = channels.filter((channel) => channel.type === 'obc');
  const card = (channel: StreamChannel) => (
    <ChannelPreview
      key={channel.channelId}
      contentId={contentId}
      channel={channel}
      active={open}
      showing={showing.includes(channel.channelId)}
      getLeader={getLeader}
      getStart={getStart}
      onChoose={() => onChoose(channel.channelId)}
      onPopOut={() => onPopOut(channel.channelId)}
    />
  );
  return (
    <aside className="channel-panel" aria-label="Channels" inert={!open}>
      <div className="channel-panel-scroll">
        <ul className="channel-cards">{feeds.map(card)}</ul>
        {drivers.length > 0 && (
          <>
            <h2 className="channel-panel-heading">Onboards</h2>
            <ul className="channel-cards">{drivers.map(card)}</ul>
          </>
        )}
      </div>
    </aside>
  );
}
