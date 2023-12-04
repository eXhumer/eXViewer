/*
  eXViewer - Live timing and content streaming client for F1TV
  Copyright © 2023 eXhumer

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

export type ConnectionState = "Connected" | "Reconnecting" | "Disconnected";
export type DisconnectionReason = "failed" | "unauthorized" | "end";
export type CurrentData = {
  ArchiveStatus?: ArchiveStatusType;
  SessionInfo?: SessionInfoType;
  WeatherData?: WeatherDataType;
};
export type ArchiveStatusType = {
  Status: "Complete" | "Generating";
};
export type MeetingCircuit = {
  Key: number;
  ShortName: string;
};
export type MeetingCountry = {
  Key: number;
  Code: string;
  Name: string;
};
export type MeetingType = {
  Key: number;
  Name: string;
  OfficialName: string;
  Location: string;
  Country: MeetingCountry;
  Circuit: MeetingCircuit;
};
export type SessionInfoType = {
  Meeting: MeetingType;
  ArchiveStatus: ArchiveStatusType;
  Key: number;
  Type: string;
  Name: string;
  Number?: number;
  StartDate: string;
  EndDate: string;
  GmtOffset: string;
  Path: string;
};
export type WeatherDataType = {
  AirTemp: string;
  Humidity: string;
  Pressure: string;
  Rainfall: string;
  TrackTemp: string;
  WindDirection: string;
  WindSpeed: string;
};
export type LoginSession = {
  data: LoginSessionData;
};

export type LoginSessionData = {
  subscriptionToken: string;
};
export type F1TVPlatform = "MOBILE_HLS" | "BIG_SCREEN_HLS" | "WEB_DASH" | "BIG_SCREEN_DASH" | "TABLET_DASH" | "TABLET_HLS" | "WEB_HLS" | "MOBILE_DASH";
export type F1TVSubscriptionType = "F1 TV VIP Annual" | "F1 TV VIP Monthly" | "F1 TV Pro Annual" | "F1 TV Pro Monthly" | "F1 TV Access Annual" | "F1 TV Access Monthly";
