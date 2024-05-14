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

import { PlayerAPI } from 'bitmovin-player';
import {
  AudioTrackSelectBox,
  BufferingOverlay,
  Button,
  CastStatusOverlay,
  CastToggleButton,
  Container,
  ControlBar,
  ErrorMessageOverlay,
  FullscreenToggleButton,
  PictureInPictureToggleButton,
  PlaybackSpeedSelectBox,
  PlaybackTimeLabel,
  PlaybackTimeLabelMode,
  PlaybackToggleButton,
  PlaybackToggleOverlay,
  PlayerUtils,
  RecommendationOverlay,
  SeekBar,
  SeekBarLabel,
  SettingsPanel,
  SettingsPanelItem,
  SettingsPanelPage,
  SettingsPanelPageOpenButton,
  SettingsToggleButton,
  Spacer,
  SubtitleOverlay,
  SubtitleSelectBox,
  SubtitleSettingsLabel,
  SubtitleSettingsPanelPage,
  TitleBar,
  UIContainer,
  VideoQualitySelectBox,
  VolumeSlider,
  VolumeToggleButton,
  i18n,
} from 'bitmovin-player-ui';
import { ButtonConfig } from 'bitmovin-player-ui/dist/js/framework/components/button';

const interval = 15;

class FastForwardButton extends Button<ButtonConfig> {
  constructor(playerAPI: PlayerAPI) {
    super({ cssClasses: ['ui-forwardbutton', 'bmpui-ui-button'] });

    this.onClick.subscribe(() => {
      playerAPI.seek(Math.min(playerAPI.getDuration(), playerAPI.getCurrentTime() + interval));
    });
  }
}

class RewindButton extends Button<ButtonConfig> {
  constructor(playerAPI: PlayerAPI) {
    super({ cssClasses: ['ui-rewindbutton', 'bmpui-ui-button'] });

    this.onClick.subscribe(() => {
      playerAPI.seek(Math.max(0, playerAPI.getCurrentTime() - interval));
    });
  }
}

// playerAPI needed for the rewind and fast forward buttons
const PlayerUI = (playerAPI: PlayerAPI) => {
  const rewindButton = new RewindButton(playerAPI);
  const fastForwardButton = new FastForwardButton(playerAPI);

  const subtitleOverlay = new SubtitleOverlay();

  const mainSettingsPanelPage = new SettingsPanelPage({
    components: [
      new SettingsPanelItem(i18n.getLocalizer('settings.video.quality'), new VideoQualitySelectBox()),
      new SettingsPanelItem(i18n.getLocalizer('speed'), new PlaybackSpeedSelectBox()),
      new SettingsPanelItem(i18n.getLocalizer('settings.audio.track'), new AudioTrackSelectBox()),
    ],
  });

  const settingsPanel = new SettingsPanel({
    components: [
      mainSettingsPanelPage,
    ],
    hidden: true,
  });

  const subtitleSettingsPanelPage = new SubtitleSettingsPanelPage({
    settingsPanel: settingsPanel,
    overlay: subtitleOverlay,
  });

  const subtitleSelectBox = new SubtitleSelectBox();

  const subtitleSettingsOpenButton = new SettingsPanelPageOpenButton({
    targetPage: subtitleSettingsPanelPage,
    container: settingsPanel,
    ariaLabel: i18n.getLocalizer('settings.subtitles'),
    text: i18n.getLocalizer('open'),
  });

  mainSettingsPanelPage.addComponent(
    new SettingsPanelItem(
      new SubtitleSettingsLabel({
        text: i18n.getLocalizer('settings.subtitles'),
        opener: subtitleSettingsOpenButton,
      }),
      subtitleSelectBox,
      {
        role: 'menubar',
      },
    ));

  settingsPanel.addComponent(subtitleSettingsPanelPage);

  const controlBar = new ControlBar({
    components: [
      settingsPanel,
      new Container({
        components: [
          new PlaybackTimeLabel({ timeLabelMode: PlaybackTimeLabelMode.CurrentTime, hideInLivePlayback: true }),
          new SeekBar({ label: new SeekBarLabel() }),
          new PlaybackTimeLabel({ timeLabelMode: PlaybackTimeLabelMode.TotalTime, cssClasses: ['text-right'] }),
        ],
        cssClasses: ['controlbar-top'],
      }),
      new Container({
        components: [
          rewindButton,
          new PlaybackToggleButton(),
          fastForwardButton,
          new VolumeToggleButton(),
          new VolumeSlider(),
          new Spacer(),
          new PictureInPictureToggleButton(),
          new CastToggleButton(),
          new SettingsToggleButton({ settingsPanel: settingsPanel }),
          new FullscreenToggleButton(),
        ],
        cssClasses: ['controlbar-bottom'],
      }),
    ],
  });

  return new UIContainer({
    components: [
      subtitleOverlay,
      new BufferingOverlay(),
      new PlaybackToggleOverlay(),
      new CastStatusOverlay(),
      controlBar,
      new TitleBar(),
      new RecommendationOverlay(),
      new ErrorMessageOverlay(),
    ],
    hideDelay: 2000,
    hidePlayerStateExceptions: [
      PlayerUtils.PlayerState.Prepared,
      PlayerUtils.PlayerState.Paused,
      PlayerUtils.PlayerState.Finished,
    ],
  });
};

export default PlayerUI;
