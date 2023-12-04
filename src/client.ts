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

import { EventEmitter } from "node:events";
import { Client as SignalRClient, SignalRError, HubEvent } from "node-signalr";
import TypedEventEmitter from "typed-emitter";
import { deepMerge } from "./utils";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

type LiveTimingEvents = {
  connected: () => void;
  disconnected: (reason: "failed" | "unauthorized" | "end") => void;
  error: (err: SignalRError) => void;
  feed: (topic: string, data: unknown, timestamp: string) => void;
  reconnecting: (count: number) => void;
};

type LiveTimingEventEmitter = new () => TypedEventEmitter<LiveTimingEvents>;

export class F1LiveTimingClient extends (EventEmitter as LiveTimingEventEmitter) {
  public readonly Current: Record<string, unknown>;
  private readonly signalrClient: SignalRClient;
  private readonly streamingHub: string;

  constructor(urL = "https://livetiming.formula1.com/signalr", streamingHub = "streaming") {
    super();
    this.Current = {};
    this.streamingHub = streamingHub;
    this.signalrClient = new SignalRClient(urL, [this.streamingHub]);

    this.signalrClient.on("connected", () => {
      this.emit("connected");

      this.signalrClient
      .connection
      .hub
      .on(this.streamingHub, "feed",
          ((topic: string, data: unknown, timestamp: string) => {
            this.Current[topic] = (topic === "Position.z" || topic === "CarData.z") ?
              data :
              deepMerge(this.Current[topic], data);

            this.emit("feed", topic, data, timestamp);
          }) as HubEvent);
    });

    this.signalrClient.on("disconnected", reason => {
      this.emit("disconnected", reason);
    });

    this.signalrClient.on("error", err => {
      this.emit("error", err);
    });

    this.signalrClient.on("reconnecting", count => {
      this.emit("reconnecting", count);
    });
  }

  public ConnectionState = () => {
    return this.signalrClient.connection.state;
  };

  public End = () => {
    this.signalrClient.end();
  }

  public Start = () => {
    this.signalrClient.start();
  };

  public Subscribe = async (topics: string[]) => {
    const current = await this.signalrClient
      .connection
      .hub
      .call(this.streamingHub, "Subscribe", topics) as Record<string, unknown>;

    for (const key in current)
      this.Current[key] = current[key];

    return current;
  }

  public Unsubscribe = async (topics: string[]) => {
    const data = await this.signalrClient
      .connection
      .hub
      .call(this.streamingHub, "Unsubscribe", topics);
    return data;
  }
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
  SubscriptionStatus: string;
  SessionId: string;
  SubscribedProduct: string;
};

export enum F1TVLanguage {
  ENGLISH = "ENG",
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

export class F1TVClient {
  public ascendon: string | null;
  public baseUrl = "https://f1tv.formula1.com";
  public currentLocation: F1TVLocation | null = null;
  public groupIdVip = 1;
  public http = axios.create();
  public language: F1TVLanguage;
  public platform: F1TVPlatform;

  constructor(ascendon?: string,
              language = F1TVLanguage.ENGLISH,
              platform = F1TVPlatform.DEFAULT) {
    this.ascendon = ascendon ? ascendon : null;

    console.log(`[F1TVClient.ascendon] ${this.ascendon}`);

    if (this.ascendon !== null)
      console.log(`[F1TVClient.decodedAscendon] ${JSON.stringify(this.decodedAscendon())}`);

    this.language = language;
    this.platform = platform;
    console.log(`[F1TVClient.language] ${this.language}`);
    console.log(`[F1TVClient.platform] ${this.platform}`);

    // Initial client location refresh
    // Maybe look into refreshing this every 30 minutes or p?
    this.refreshLocation()
      .then(() => { console.log("[F1TVClient] location refreshed!"); })
      .then(() => { console.log(`[F1TVClient.currentLocation] ${JSON.stringify(this.currentLocation)}`); })
      .catch(console.error);
  }

  public readonly decodedAscendon = () => {
    return jwtDecode<F1TVAscendonPayload>(this.ascendon);
  };

  public readonly loginStatus = () => {
    return this.ascendon ? "R" : "A";
  };

  public refreshLocation = async () => {
    let params: F1TVLocationParams | undefined = undefined;

    if (this.ascendon !== null)
      params = {
        homeCountry: this.decodedAscendon().ExternalAuthorizationsContextData,
      };

    const res = await this.http.get<F1TVLocation>(
      [
        this.baseUrl,
        "1.0",
        this.loginStatus(),
        this.language,
        this.platform,
        "ALL/USER/LOCATION"
      ].join("/"),
      { params: params });
    const location = res.data;
    this.currentLocation = location;
  }
}
