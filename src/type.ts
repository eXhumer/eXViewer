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

import { SignalRError } from "node-signalr";
import TypedEventEmitter from "typed-emitter";

export type LiveTimingConnectionState = "Connected" | "Reconnecting" | "Disconnected";

export type LiveTimingDisconnectionReason = "failed" | "unauthorized" | "end";

export type LiveTimingCurrentData = {
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

type LiveTimingEvents = {
  connected: () => void;
  disconnected: (reason: "failed" | "unauthorized" | "end") => void;
  error: (err: SignalRError) => void;
  feed: (topic: string, data: unknown, timestamp: string) => void;
  reconnecting: (count: number) => void;
};

export type LiveTimingEventEmitter = new () => TypedEventEmitter<LiveTimingEvents>;

export type F1TVLoginSession = {
  data: F1TVLoginSessionData;
};

export type F1TVLoginSessionData = {
  subscriptionToken: string;
};

// look in ops/vip check (F1TVSubscribedProduct -> lower case -> contains "ops"/"vip" -> set location group id to groupIdVip[1])
export enum F1TVSubscribedProduct {
  None = "",
  VIP_Annual = "F1 TV VIP Annual",
  VIP_Monthly = "F1 TV VIP Monthly",
  Pro_Annual = "F1 TV Pro Annual",
  Pro_Monthly = "F1 TV Pro Monthly",
  Access_Annual = "F1 TV Access Annual",
  Access_Monthly = "F1 TV Access Monthly",
}

export type F1TVUserLocation = {
  detectedCountryIsoCode: string;
  registeredCountryIsoCode: string;
  groupId: number;
};

export type F1TVLocationResult = {
  userLocation: F1TVUserLocation[];
  countries: unknown[];
};

export type F1TVLocation = {
  resultCode: "OK";
  message: "";
  errorDescription: "";
  resultObj: F1TVLocationResult;
  systemTime: number;
};

export type F1TVLocationParams = {
  homeCountry: string;
};

export type F1TVAscendonPayload = {
  iat: number;
  exp: number;
  jti: string;
  ExternalAuthorizationsContextData: string;
  SubscriptionStatus: "active" | "inactive";
  SubscriberId: string;
  FirstName: string;
  LastName: string;
  SessionId: string;
  SubscribedProduct: F1TVSubscribedProduct | string;
};

export enum F1TVLanguage {
  ENGLISH = "ENG",
  GERMAN = "DEU",
  SPANISH = "SPA",
  FRENCH = "FRA",
  DUTCH = "NLD",
  PORTUGUESE = "POR",
}

export enum F1TVPlatform {
  WEB_DASH = "WEB_DASH",
  WEB_HLS = "WEB_HLS",
  BIG_SCREEN_DASH = "BIG_SCREEN_DASH",
  BIG_SCREEN_HLS = "BIG_SCREEN_HLS",
  MOBILE_DASH = "MOBILE_DASH",
  MOBILE_HLS = "MOBILE_HLS",
  TABLET_DASH = "TABLET_DASH",
  TABLET_HLS = "TABLET_HLS",
  DEFAULT = WEB_DASH,
}
