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

import { PlayerAPI, PlayerEvent } from 'bitmovin-player';
import {
  AudioTrackSelectBox,
  BufferingOverlay,
  Button,
  Container,
  ControlBar,
  ErrorMessageOverlay,
  FullscreenToggleButton,
  PlaybackSpeedSelectBox,
  PlaybackTimeLabel,
  PlaybackTimeLabelMode,
  PlaybackToggleButton,
  PlaybackToggleOverlay,
  PlayerUtils,
  SeekBar,
  SeekBarLabel,
  SettingsPanel,
  SettingsPanelItem,
  SettingsPanelPage,
  SettingsToggleButton,
  Spacer,
  TitleBar,
  ToggleButton,
  UIContainer,
  UIInstanceManager,
  VideoQualitySelectBox,
  VolumeSlider,
  VolumeToggleButton,
  i18n,
} from 'bitmovin-player-ui';
import { ButtonConfig } from 'bitmovin-player-ui/dist/js/framework/components/button';
import { ToggleButtonConfig } from 'bitmovin-player-ui/dist/js/framework/components/togglebutton';

class FastForwardButton extends Button<ButtonConfig> {
  private interval: number;

  constructor(interval: number = 15) {
    super({ cssClasses: ['ui-forwardbutton', 'bmpui-ui-button'] });
    this.interval = interval;
  }

  configure(player: PlayerAPI, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager);

    this.onClick.subscribe(() => {
      if (player.isLive())
        player.timeShift(Math.min(0, this.interval + player.getTimeShift()));

      else
        player.seek(Math.min(player.getDuration(), player.getCurrentTime() + this.interval));
    });
  }
}

class RewindButton extends Button<ButtonConfig> {
  private interval: number;

  constructor(interval: number = 15) {
    super({ cssClasses: ['ui-rewindbutton', 'bmpui-ui-button'] });
    this.interval = interval;
  }

  configure(player: PlayerAPI, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager);

    this.onClick.subscribe(() => {
      if (player.isLive())
        player.timeShift(Math.max(player.getTimeShift() - this.interval, player.getMaxTimeShift()));

      else
        player.seek(Math.max(0, player.getCurrentTime() - this.interval));
    });
  }
}

class PIPButton extends ToggleButton<ToggleButtonConfig> {
  constructor() {
    super({ cssClass: 'ui-piptogglebutton' });
  }

  configure(player: PlayerAPI, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager);

    const isPictureInPictureAvailable = () => {
      return document.pictureInPictureEnabled;
    };

    const pictureInPictureStateHandler = () => {
      if (document.pictureInPictureElement)
        this.on();

      else
        this.off();
    };

    const pictureInPictureAvailabilityChangedHandler = () => {
      if (isPictureInPictureAvailable())
        this.show();

      else
        this.hide();
    };

    const playerReadyHandler = () => {
      player.getVideoElement().addEventListener('enterpictureinpicture', pictureInPictureStateHandler);
      player.getVideoElement().addEventListener('leavepictureinpicture', pictureInPictureStateHandler);
    };

    player.on(PlayerEvent.Ready, playerReadyHandler);

    uimanager.getConfig().events.onUpdated.subscribe(pictureInPictureAvailabilityChangedHandler);

    this.onClick.subscribe(() => {
      if (document.pictureInPictureElement)
        document.exitPictureInPicture();

      else
        player.getVideoElement().requestPictureInPicture();
    });

    pictureInPictureAvailabilityChangedHandler();
    pictureInPictureStateHandler();
  }
}

const PlayerUI = () => {
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
          new RewindButton(),
          new PlaybackToggleButton(),
          new FastForwardButton(),
          new VolumeToggleButton(),
          new VolumeSlider(),
          new Spacer(),
          new PIPButton(),
          new SettingsToggleButton({ settingsPanel: settingsPanel }),
          new FullscreenToggleButton(),
        ],
        cssClasses: ['controlbar-bottom'],
      }),
    ],
  });

  return new UIContainer({
    components: [
      new BufferingOverlay(),
      new PlaybackToggleOverlay(),
      controlBar,
      new TitleBar(),
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
