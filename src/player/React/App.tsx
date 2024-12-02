import { useEffect, useRef } from 'react';
import { PlayerAPI, PlayerEvent, QualityMetadata, SourceConfig } from 'bitmovin-player';
import { BitmovinPlayer, CustomUi } from 'bitmovin-player-react';
import type { IpcRendererEvent } from 'electron';
import { F1TV } from '@exhumer/f1tv-api';

import Overlay from './Component/Overlay';
import PlayerUI from './Component/PlayerUI';
import StreamSwitcherButton from './Component/StreamSwitcherButton';

import { updateAscendon, updateConfig, updateCurrentPlayResult, updatePlatform, updateVideoContainer } from './Slice/Player';
import { usePlayerDispatch, usePlayerSelector } from './Hook';

import { author, productName } from '../../../package.json';
import { F1TVPlatform } from '../../main_window/React/Type';

import styles from './App.module.scss';
import './BitmovinPlayer.scss';

const uiContainerFactory = () => PlayerUI();

const customUi: CustomUi = {
  containerFactory: uiContainerFactory
};

const getQualityLabels = (quality: QualityMetadata) => {
  console.log('quality', quality);

  let fpsData = '';

  if (quality.frameRate)
    fpsData += `${quality.frameRate} fps / `;

  return `${quality.height}p (${fpsData}${Math.trunc(quality.bitrate / 1000)} kbps)`;
};

const App = () => {
  const ascendon = usePlayerSelector(state => state.player.ascendon);
  const config = usePlayerSelector(state => state.player.config);
  const platform = usePlayerSelector(state => state.player.platform);
  const videoContainer = usePlayerSelector(state => state.player.videoContainer);
  const dispatch = usePlayerDispatch();

  const playerReadyToShowCB = (e: IpcRendererEvent, videoContainer: F1TV.ContentVideoContainer, ascendon: string, config: F1TV.Config, platform: string) => {
    dispatch(updateAscendon(ascendon));
    dispatch(updateConfig(config));
    dispatch(updatePlatform(platform));
    dispatch(updateVideoContainer(videoContainer));
  };

  const playerRef = useRef<PlayerAPI | null>(null);
  const playerDivRef = useRef<HTMLDivElement | null>(null);

  const switchChannel = (channelId?: number) => {
    if (videoContainer === null || !playerRef.current)
      return;

    const stream = videoContainer.metadata.additionalStreams ?
      videoContainer.metadata.additionalStreams.find(stream => stream.channelId === channelId) :
      null;

    player
      .contentPlay(videoContainer.contentId, stream && stream.identifier !== 'WIF' ? channelId : undefined, platform as F1TVPlatform)
      .then(playData => {
        const currentRef = playerRef.current;

        dispatch(updateCurrentPlayResult(playData));

        const source: SourceConfig = {
          title: `${videoContainer.metadata.title}${stream && stream.type === 'obc' ?
            ` - ${stream.driverFirstName} ${stream.driverLastName}` :
            stream ? ` - ${stream.title}` : ''}`,
          labeling: {
            hls: {
              qualities: getQualityLabels,
            },
            dash: {
              qualities: getQualityLabels,
            },
          },
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

        if (currentRef.getSource() === null)
          currentRef.load(source);

        else {
          if (currentRef.isLive()) {
            const timeShift = currentRef.getTimeShift();
            currentRef.load(source)
              .then(() => currentRef.timeShift(timeShift));
          } else {
            const seekTime = currentRef.getCurrentTime();
            currentRef.load(source)
              .then(() => currentRef.seek(seekTime));
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
            <StreamSwitcherButton
              key={stream.channelId}
              onClick={() => switchChannel(stream.channelId)}
              stream={stream}
            />
          ))}
        </div>
      </Overlay>}
    {videoContainer && config && <BitmovinPlayer
      playerRef={playerRef}
      ref={playerDivRef}
      customUi={customUi}
      config={{
        key: config.bitmovin.bitmovinKeys.player,
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
    />}
  </> : <>
    <h1>Loading...</h1>
  </>;
};

export default App;
