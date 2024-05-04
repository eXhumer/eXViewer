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

export type AppConfig = {
  disableHardwareAcceleration?: boolean;
  enableSandbox?: boolean;
};

export const DefaultAppConfig: AppConfig = {
  disableHardwareAcceleration: false,
  enableSandbox: true,
};

export type F1TVLoginSessionData = {
  subscriptionToken: string;
};

export type F1TVLoginSession = {
  data: F1TVLoginSessionData;
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace IPCChannel {
  export enum eXViewer {
    NEW_PLAYER = 'eXViewer:New-Player',
  }

  export enum F1TV {
    LOCATION = 'F1TV:Location',
    LOGIN = 'F1TV:Login',
    LOGOUT = 'F1TV:Logout',
    SUBSCRIPTION_TOKEN = 'F1TV:Subscription-Token',
    WHEN_LOCATION_READY = 'F1TV:When-Location-Ready',
  }

  export enum Player {
    CONTENT_PLAY = 'Player:Content-Play',
    CONTEXT_MENU = 'Player:Context-Menu',
    PLAYER_DATA = 'Player:Player-Data',
  }
}
