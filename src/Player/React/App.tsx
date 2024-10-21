import { useEffect, useRef } from 'react';
import { type SourceConfig, PlayerEvent } from 'bitmovin-player';
import type { IpcRendererEvent } from 'electron';
import { F1TV } from '@exhumer/f1tv-api';

import styles from './App.module.scss';
import BitmovinPlayer, { BitmovinPlayerRef } from './Component/BitmovinPlayer';
import Overlay from './Component/Overlay';

import { updateAscendon, updateConfig, updateVideoContainer } from './Slice/Player';
import { usePlayerDispatch, usePlayerSelector } from './Hook';

import { author, productName } from '../../../package.json';

const App = () => {
  const ascendon = usePlayerSelector(state => state.player.ascendon);
  const config = usePlayerSelector(state => state.player.config);
  const videoContainer = usePlayerSelector(state => state.player.videoContainer);
  const dispatch = usePlayerDispatch();

  const playerReadyToShowCB = (e: IpcRendererEvent, videoContainer: F1TV.ContentVideoContainer, ascendon: string, config: F1TV.Config) => {
    dispatch(updateAscendon(ascendon));
    dispatch(updateConfig(config));
    dispatch(updateVideoContainer(videoContainer));
  };

  const playerRef = useRef<BitmovinPlayerRef | null>(null);

  const switchChannel = (channelId?: number) => {
    if (videoContainer === null || !playerRef.current)
      return;

    const stream = videoContainer.metadata.additionalStreams ?
      videoContainer.metadata.additionalStreams.find(stream => stream.channelId === channelId) :
      null;

    player
      .contentPlay(videoContainer.contentId, stream && stream.identifier !== 'WIF' ? channelId : undefined)
      .then(playData => {
        const currentRef = playerRef.current;


        const source: SourceConfig = {
          title: `${videoContainer.metadata.title}${stream && stream.type === 'obc' ?
            ` - ${stream.driverFirstName} ${stream.driverLastName}` :
            stream ? ` - ${stream.title}` : ''}`,
        };

        if (playData.streamType === 'DASHWV' && playData.drmType === 'widevine' && playData.laURL) {
          source.drm = {
            widevine: {
              audioRobustness: 'SW_SECURE_CRYPTO', // Widevine L3
              videoRobustness: 'SW_SECURE_CRYPTO', // Widevine L3
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

        if (currentRef.api.getSource() === null)
          currentRef.api.load(source);

        else {
          if (currentRef.api.isLive()) {
            const timeShift = currentRef.api.getTimeShift();
            currentRef.api.load(source)
              .then(() => currentRef.api.timeShift(timeShift));
          } else {
            const seekTime = currentRef.api.getCurrentTime();
            currentRef.api.load(source)
              .then(() => currentRef.api.seek(seekTime));
          }
        }
      });
  };

  useEffect(() => {
    player.onReadyToShow(playerReadyToShowCB);

    return () => {
      player.offReadyToShow(playerReadyToShowCB);
    };
  }, []);

  useEffect(() => {
    if (!videoContainer)
      return;

    if (videoContainer.metadata.additionalStreams) {
      const defaultStream = videoContainer.metadata.additionalStreams.find(stream => stream.default === true);
      switchChannel(defaultStream.channelId);
    } else
      switchChannel();
  }, [videoContainer]);

  return ascendon !== null && config !== null ? <>
    {videoContainer && videoContainer.metadata.additionalStreams &&
      <Overlay>
        <div className={styles['additional-streams-overlay']}>
          {videoContainer.metadata.additionalStreams.map(stream => (
            <button
              key={stream.channelId}
              onClick={() => {
                switchChannel(stream.channelId);
              }}
            >
              {stream.title}
            </button>
          ))}
        </div>
      </Overlay>}
    {videoContainer && config && <BitmovinPlayer
      playerKey={config.bitmovin.bitmovinKeys.player}
      config={{
        buffer: {
          audio: {
            forwardduration: config.bitmovin.buffer.audio.forwardduration,
            backwardduration: config.bitmovin.buffer.audio.backwardduration,
          },
          video: {
            forwardduration: config.bitmovin.buffer.video.forwardduration,
            backwardduration: config.bitmovin.buffer.video.backwardduration,
          },
        },
        events: {
          [PlayerEvent.Ready]: event => {
            console.log('onReady', event);
          },
          [PlayerEvent.SourceLoaded]: event => {
            console.log('onSourceLoaded', event);
          },
          [PlayerEvent.Play]: event => {
            console.log('onPlay', event);
          },
          [PlayerEvent.Playing]: event => {
            console.log('onPlaying', event);
          },
          [PlayerEvent.Paused]: event => {
            console.log('onPaused', event);
          },
          [PlayerEvent.PlaybackFinished]: event => {
            console.log('onPlaybackFinished', event);
          },
          [PlayerEvent.Destroy]: event => {
            console.log('onDestroy', event);
          },
          [PlayerEvent.AdBreakStarted]: event => {
            console.log('onAdBreakStarted', event);
          },
          [PlayerEvent.AdBreakFinished]: event => {
            console.log('onAdBreakFinished', event);
          },
          [PlayerEvent.Error]: event => {
            console.log('onError', event);
          },
          [PlayerEvent.ViewModeChanged]: event => {
            console.log('onViewModeChanged', event);
          },
          [PlayerEvent.VolumeChanged]: event => {
            console.log('onVolumeChanged', event);
          },
          [PlayerEvent.CastStart]: event => {
            console.log('onCastStart', event);
          },
          [PlayerEvent.CastStarted]: event => {
            console.log('onCastStarted', event);
          },
          [PlayerEvent.CastStopped]: event => {
            console.log('onCastStopped', event);
          },
          [PlayerEvent.Seek]: event => {
            console.log('onSeek', event);
          },
          [PlayerEvent.Seeked]: event => {
            console.log('onSeeked', event);
          },
          [PlayerEvent.TimeShifted]: event => {
            console.log('onTimeShifted', event);
          },
          [PlayerEvent.DownloadFinished]: event => {
            console.log('onDownloadFinished', event);
          },
          [PlayerEvent.Metadata]: event => {
            console.log('onMetadata', event);
          },
          [PlayerEvent.Muted]: event => {
            console.log('onMuted', event);
          },
          [PlayerEvent.Unmuted]: event => {
            console.log('onUnmuted', event);
          },
          [PlayerEvent.AudioChanged]: event => {
            console.log('onAudioChanged', event);
          },
          [PlayerEvent.VideoQualityChanged]: event => {
            console.log('onVideoQualityChanged', event);
          },
          [PlayerEvent.SubtitleEnabled]: event => {
            console.log('onSubtitleEnabled', event);
          },
          [PlayerEvent.SubtitleDisabled]: event => {
            console.log('onSubtitleDisabled', event);
          },
          [PlayerEvent.AudioAdded]: event => {
            console.log('onAudioAdded', event);
          },
          [PlayerEvent.TimeChanged]: event => {
            console.log('onTimeChanged', event);
          },
        },
        playback: {
          autoplay: true,
        },
        tweaks: {
          file_protocol: true,
          app_id: `com.${author.name}.${productName}`.toLowerCase(),
        },
      }}
      ref={playerRef}
    />}
  </> : <>
    <h1>Loading...</h1>
  </>;
};

export default App;
