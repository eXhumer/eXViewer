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
import { Client as SignalRClient, HubEvent } from "node-signalr";
import TypedEventEmitter from "typed-emitter";
import { deepMerge } from "./Utils";

type LiveTimingEvents = {
  connected: () => void;
  feed: (topic: string, data: unknown, timestamp: string) => void;
  subscribed: (topics: string[]) => void;
};

type LiveTimingEventEmitter = new () => TypedEventEmitter<LiveTimingEvents>;

export class F1LiveTimingClient extends (EventEmitter as LiveTimingEventEmitter) {
  public readonly current: Record<string, unknown>;
  private readonly signalrClient: SignalRClient;
  private readonly streamingHub: string;

  constructor(urL = "https://livetiming.formula1.com/signalr", streamingHub = "streaming") {
    super();
    this.current = {};
    this.streamingHub = streamingHub;
    this.signalrClient = new SignalRClient(urL, [this.streamingHub]);

    this.signalrClient.on("connected", () => {
      this.emit("connected");

      this.signalrClient
      .connection
      .hub
      .on(this.streamingHub, "feed",
          ((topic: string, data: unknown, timestamp: string) => {
            this.current[topic] = (topic === "Position.z" || topic === "CarData.z") ?
              data :
              deepMerge(this.current[topic], data);

            this.emit("feed", topic, data, timestamp);
          }) as HubEvent);
    });
  }

  public end = () => {
    this.signalrClient.end();
  }

  public start = () => {
    this.signalrClient.start();
  };

  public Subscribe = async (topics: string[]) => {
    const current = await this.signalrClient
      .connection
      .hub
      .call(this.streamingHub, "Subscribe", topics) as Record<string, unknown>;

    for (const key in current)
      this.current[key] = current[key];

    this.emit("subscribed", Object.keys(current));
  }

  public Unsubscribe = async (topics: string[]) => {
    const data = await this.signalrClient
      .connection
      .hub
      .call(this.streamingHub, "Unsubscribe", topics);
    return data;
  }
}
