import { useState, type ReactNode } from 'react';
import type { PlayerContent, StreamChannel } from '../shared/player';

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const LiveIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </svg>
);

const GlobeIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
  </svg>
);

const TrackerIcon = () => (
  <svg {...iconProps}>
    <path d="M6 18c-2.2 0-3-1.6-3-3.5S4.5 10 7 10h5l3-5c1-1.5 3.5-1.2 4.2.5.6 1.4-.2 2.5-1.2 3.3L15 11c2 .3 4 1.7 4 4 0 2.4-1.8 3-3.5 3z" />
  </svg>
);

const DataIcon = () => (
  <svg {...iconProps}>
    <path d="M5 20V12M10 20V8M15 20v-6M20 20V4" />
  </svg>
);

const OnboardIcon = () => (
  <svg {...iconProps}>
    <path d="M3 13l2-5h14l2 5M3 13v4h3v-2h12v2h3v-4M3 13h18" />
    <circle cx="7.5" cy="15" r="0.5" fill="currentColor" />
    <circle cx="16.5" cy="15" r="0.5" fill="currentColor" />
  </svg>
);

const PopOutIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <rect x="12" y="12" width="7" height="5" fill="currentColor" />
  </svg>
);

const TvIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="12" rx="2" />
    <path d="M8 21h8" />
  </svg>
);

/** Picks an icon by F1TV's feed identifier (PRES, WIF, TRACKER, DATA). */
function feedIcon(channel: StreamChannel): ReactNode {
  switch (channel.identifier) {
    case 'PRES':
      return <LiveIcon />;
    case 'WIF':
      return <GlobeIcon />;
    case 'TRACKER':
      return <TrackerIcon />;
    case 'DATA':
      return <DataIcon />;
    default:
      return <TvIcon />;
  }
}

/** Names the playing feed: "44 Lewis Hamilton", "F1 LIVE", or "" if none. */
export function feedName(content: PlayerContent) {
  const feed = content.channels.find(
    (channel) => channel.channelId === content.channelId,
  );
  if (!feed) {
    return '';
  }
  return feed.driverName
    ? `${feed.racingNumber} ${feed.driverName}`
    : feed.title;
}

interface ChannelSwitcherProps {
  channels: StreamChannel[];
  channelId: number | undefined;
  onSelect(channelId: number): void;
  /** Opens a channel in its own window. Hides the pop-out buttons if unset. */
  onPopOut?(channelId: number): void;
}

/** F1TV-style switcher: a rail of feed icons and a pop-out driver list. */
export function ChannelSwitcher({
  channels,
  channelId,
  onSelect,
  onPopOut,
}: ChannelSwitcherProps) {
  const [showDrivers, setShowDrivers] = useState(false);
  const feeds = channels.filter((channel) => channel.type !== 'obc');
  const drivers = channels.filter((channel) => channel.type === 'obc');
  const onboardActive = drivers.some(
    (channel) => channel.channelId === channelId,
  );

  return (
    <div className="channel-switcher">
      {showDrivers && drivers.length > 0 && (
        <ul className="driver-list" aria-label="Onboard cameras">
          {drivers.map((driver) => (
            <li key={driver.channelId} className="driver-row">
              <button
                className="driver-button"
                aria-pressed={driver.channelId === channelId}
                title={driver.driverName}
                onClick={() => onSelect(driver.channelId)}
              >
                <span className="driver-number">{driver.racingNumber}</span>
                <span
                  className="driver-color"
                  style={{ backgroundColor: driver.color }}
                />
                {driver.title}
              </button>
              {onPopOut && (
                <button
                  className="driver-pop-out"
                  aria-label={`Open ${driver.driverName} in a new window`}
                  title="Open in a new window"
                  onClick={() => onPopOut(driver.channelId)}
                >
                  <PopOutIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="channel-rail" role="group" aria-label="Channels">
        {feeds.map((feed) => (
          <button
            key={feed.channelId}
            className="channel-rail-button"
            aria-pressed={feed.channelId === channelId}
            aria-label={feed.title}
            onClick={() => {
              setShowDrivers(false);
              onSelect(feed.channelId);
            }}
          >
            <span className="channel-rail-label">{feed.title}</span>
            {feedIcon(feed)}
          </button>
        ))}
        {drivers.length > 0 && (
          <button
            className="channel-rail-button"
            aria-pressed={onboardActive}
            aria-expanded={showDrivers}
            aria-label="Onboard cameras"
            onClick={() => setShowDrivers((shown) => !shown)}
          >
            <span className="channel-rail-label">Onboard</span>
            <OnboardIcon />
          </button>
        )}
        {onPopOut && channelId !== undefined && (
          <button
            className="channel-rail-button"
            aria-label="Open this feed in a new window"
            onClick={() => onPopOut(channelId)}
          >
            <span className="channel-rail-label">New window</span>
            <PopOutIcon />
          </button>
        )}
      </div>
    </div>
  );
}
