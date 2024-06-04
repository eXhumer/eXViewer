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

import { SignalRError } from "@exhumer/node-signalr";
import TypedEventEmitter from "typed-emitter";

export type ConnectionState = "Connected" | "Reconnecting" | "Disconnected";

export type DisconnectionReason = "failed" | "unauthorized" | "end";

type F1LiveTimingEvents = {
  connected: () => void;
  disconnected: (reason: "failed" | "unauthorized" | "end") => void;
  error: (err: SignalRError) => void;
  feed: (topic: keyof F1LiveTimingData.Current, data: unknown, timestamp: string) => void;
  reconnecting: (count: number) => void;
};

export type F1LiveTimingEventEmitter = new () => TypedEventEmitter<F1LiveTimingEvents>;  

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace F1LiveTimingData {
  export type CarData = {
    Entries: {
      Utc: string;
      Cars: {[key: string]: {
        Channels: {
          0: number;
          2: number;
          3: number;
          4: number;
          5: number;
          45: number;
        };
      }};
    }[];
  };

  export type Position = {
    Position: {
      Timestamp: string;
      Entries: {[key: string]: {
        Status: "OnTrack" | 0 | 1;
        X: number;
        Y: number;
        Z: number;
      }};
    }[];
  };

  export type SessionInfo = {
    Meeting: {
      Key: number;
      Name: string;
      OfficialName?: string;
      Location: string;
      Country: {
        Key: number;
        Code: string;
        Name: string;
      };
      Circuit: {
        Key: number;
        ShortName: string;
      };
    };
    ArchiveStatus: {
      Status: "Complete" | "Generating";
    };
    Key: number;
    Type: string;
    Number?: number;
    Name: string;
    StartDate: string;
    EndDate: string;
    GmtOffset: string;
    Path: string;
  };

  export type ArchiveStatus = {
    Status: "Complete" | "Generating";
  };

  export type ContentStreams = {
    Streams: {
      Type: string;
      Name: string;
      Language: string;
      Uri: string;
      Path?: string;
      Utc: string;
    }[];
  };

  export enum TrackStatusStatus {
    ALL_CLEAR = "1",
    YELLOW = "2",
    GREEN = "3",
    SC_DEPLOYED = "4",
    RED = "5",
    VSC_DEPLOYED = "6",
    VSC_ENDING = "7",
  }

  export enum TrackStatusMessage {
    ALL_CLEAR = "AllClear",
    YELLOW = "Yellow",
    GREEN = "Green",
    SC_DEPLOYED = "SCDeployed",
    RED = "Red",
    VSC_DEPLOYED = "VSCDeployed",
    VSC_ENDING = "VSCEnding",
  }

  export type TrackStatus = {
    Status: TrackStatusStatus;
    Message: TrackStatusMessage;
  };

  export type SessionData = {
    Series: {
      Utc: string;
      Lap?: number;
      QualifyingPart?: 0 | 1 | 2 | 3;
    }[];
    StatusSeries: {
      Utc: string;
      TrackStatus?: TrackStatusMessage;
      SessionStatus?: SessionStatusStatus;
    }[];
  };

  export enum SessionStatusStatus {
    STARTED = "Started",
    ABORTED = "Aborted",
    INACTIVE = "Inactive",
    FINISHED = "Finished",
    FINALISED = "Finalised",
    ENDS = "Ends",
  }

  export type AudioStreams = {
    Streams: {
      Name: string;
      Language: string;
      Uri: string;
      Path?: string;
      Utc: string;
    }[];
  };

  export enum TyreCompound {
    HYPERSOFT = "HYPERSOFT",
    ULTRASOFT = "ULTRASOFT",
    SUPERSOFT = "SUPERSOFT",
    SOFT = "SOFT",
    MEDIUM = "MEDIUM",
    HARD = "HARD",
    INTERMEDIATE = "INTERMEDIATE",
    WET = "WET",
    UNKNOWN = "UNKNOWN",
    TEST_UNKNOWN = "TEST_UNKNOWN",
  }

  export type TyreStintSeries = {
    Stints: {
      [key: string]: {
        Compound: TyreCompound;
        New: string;
        TyresNotChanged: string;
        TotalLaps: number;
        StartLaps: number;
      }[];
    };
  };

  export type ExtrapolatedClock = {
    Utc: string;
    Remaning: string;
    Extrapolating: boolean;
  };

  export type ChampionshipPrediction = {
    Drivers: {
      [key: string]: {
        RacingNumber: string;
        CurrentPosition: number;
        PredictedPosition: number;
        CurrentPoints: number;
        PredictedPoints: number;
      };
    };
    Teams: {
      [key: string]: {
        TeamName: string;
        CurrentPosition: number;
        PredictedPosition: number;
        CurrentPoints: number;
        PredictedPoints: number;
      };
    };
  };

  export type LapCount = {
    CurrentLap: number;
    TotalLaps: number;
  };

  export type DriverList = {
    [key: string]: {
      RacingNumber: string;
      BroadcastName: string;
      FullName: string;
      Tla: string;
      Line: number;
      TeamName: string;
      TeamColour: string;
      FirstName: string;
      LastName: string;
      Reference: string;
      HeadshotUrl: string;
      CountryCode: string;
    };
  };

  export type DriverRaceInfo = {
    [key: string]: {
      RacingNumber: string;
      Position: string;
      Gap: string;
      Interval: string;
      PitStops: number;
      Catching: number;
      OvertakeState: number;
      IsOut: boolean;
    };
  };

  export type TimingDataF1 = TimingData;

  export type LapSeries = {
    [key: string]: {
      RacingNumber: string;
      LapPosition: string[];
    };
  };

  export type TimingData = {
    Lines: {
      [key: string]: {
        GapToLeader: string;
        IntervalToPositionAhead: {
          Value: string;
          Catching: boolean;
        };
        Line: number;
        Position: string;
        ShowPosition: boolean;
        RacingNumber: string;
        Retired: boolean;
        InPit: boolean;
        PitOut: boolean;
        Stopped: boolean;
        Status: number;
        NumberOfLaps: number;
        NumberOfPitStops: number;
        Sectors: {
          Stopped: boolean;
          PreviousValue: string;
          Segments: {
            Status: number;
          }[];
          Value: string;
          Status: number;
          OverallFastest: boolean;
          PersonalFastest: boolean;
        }[];
        Speeds: {
          I1: {
            Value: string;
            Status: number;
            OverallFastest: boolean;
            PersonalFastest: boolean;
          };
          I2: {
            Value: string;
            Status: number;
            OverallFastest: boolean;
            PersonalFastest: boolean;
          };
          FL: {
            Value: string;
            Status: number;
            OverallFastest: boolean;
            PersonalFastest: boolean;
          };
          ST: {
            Value: string;
            Status: number;
            OverallFastest: boolean;
            PersonalFastest: boolean;
          };
        };
        BestLapTime: {
          Value: string;
          Lap: number;
        };
        LastLapTime: {
          Value: string;
          Status: number;
          OverallFastest: boolean;
          PersonalFastest: boolean;
        };
      };
    };
    Withheld: boolean;
  };

  export type TeamRadio = {
    Captures: {
      Utc: string;
      RacingNumber: string;
      Path: string;
    }[];
  };

  export type TopThree = {
    Withheld: boolean;
    Lines: {
      Position: string;
      ShowPosition: boolean;
      RacingNumber: string;
      Tla: string;
      BroadcastName: string;
      FullName: string;
      Team: string;
      TeamColour: string;
      LapTime: string;
      LapState: number;
      DiffToAhead: string;
      DiffToLeader: string;
      OverallFastest: boolean;
      PersonalFastest: boolean;
    }[];
  };

  export type TimingAppData = {
    Lines: {
      [key: string]: {
        RacingNumber: string;
        Line: number;
        GridPos: string;
        Stints: {
          LapTime: string;
          LapNumber: number;
          LapFlags: number;
          Compound: TyreCompound;
          New: string;
          TyresNotChanged: string;
          TotalLaps: number;
          StartLaps: number;
        }[];
      };
    };
  };

  export type TimingStats = {
    Withheld: boolean;
    Lines: {
      [key: string]: {
        Line: number;
        RacingNumber: string;
        PersonalBestLapTime: {
          Lap: number;
          Position: number;
          Value: string;
        };
        BestSectors: {
          Position: number;
          Value: string;
        }[];
        BestSpeeds: {
          I1: {
            Position: number;
            Value: string;
          };
          I2: {
            Position: number;
            Value: string;
          };
          FL: {
            Position: number;
            Value: string;
          };
          ST: {
            Position: number;
            Value: string;
          };
        };
      };
    };
    SessionType: string;
  };

  export type SessionStatus = {
    Status: SessionStatusStatus;
  };

  export type Heartbeat = {
    Utc: string;
  };

  export type WeatherData = {
    AirTemp: string;
    TrackTemp: string;
    Humidity: string;
    Pressure: string;
    Rainfall: string;
    WindDirection: string;
    WindSpeed: string;
  };

  export type WeatherDataSeries = {
    Series: {
      Timestamp: string;
      Weather: WeatherData;
    }[];
  };

  export type CurrentTyres = {
    Tyres: {
      [key: string]: {
        Compound: TyreCompound;
        New: boolean;
      };
    };
  };

  export type TlaRcm = {
    Timestamp: string;
    Message: string;
  };

  export enum FlagStatus {
    CLEAR = "CLEAR",
    GREEN = "GREEN",
    RED = "RED",
    YELLOW = "YELLOW",
    DOUBLE_YELLOW = "DOUBLE YELLOW",
    CHEQUERED = "CHEQUERED",
    BLUE = "BLUE",
    BLACK = "BLACK",
    BLACK_AND_WHITE = "BLACK AND WHITE",
    BLACK_AND_ORANGE = "BLACK AND ORANGE",
  }

  export type RaceControlMessages = {
    Messages: {
      Utc: string;
      Lap?: number;
      Category: "Flag" | "Other" | "SafetyCar" | "Drs" | "CarEvent";
      Flag?: FlagStatus;
      Message: string;
      Sector?: number;
      Scope?: "Track" | "Sector" | "Driver";
      Mode?: "SAFETY CAR" | "VIRTUAL SAFETY CAR";
      Status?: "DEPLOYED" | "IN THIS LAP" | "DISABLED" | "ENABLED";
      RacingNumber?: string;
    }[];
  };

  export type PitLaneTimeCollection = {
    PitTimes: {[key: string]: {
      RacingNumber: string;
      Duration: string;
      Lap: string;
    } | string[]};
  };

  export type Current = {
    SessionInfo?: SessionInfo;
    ArchiveStatus?: ArchiveStatus;
    ContentStreams?: ContentStreams;
    WeatherData?: WeatherData;
    CarData?: CarData;
    Position?: Position;
    TeamRadio?: TeamRadio;
    DriverList?: DriverList;
    TrackStatus?: TrackStatus;
    SessionData?: SessionData;
    AudioStreams?: AudioStreams;
    TyreStintSeries?: TyreStintSeries;
    ExtrapolatedClock?: ExtrapolatedClock;
    ChampionshipPrediction?: ChampionshipPrediction;
    LapCount?: LapCount;
    DriverRaceInfo?: DriverRaceInfo;
    TimingDataF1?: TimingDataF1;
    LapSeries?: LapSeries;
    TimingData?: TimingData;
    TopThree?: TopThree;
    TimingAppData?: TimingAppData;
    TimingStats?: TimingStats;
    SessionStatus?: SessionStatus;
    Heartbeat?: Heartbeat;
    WeatherDataSeries?: WeatherDataSeries;
    CurrentTyres?: CurrentTyres;
    TlaRcm?: TlaRcm;
    RaceControlMessages?: RaceControlMessages;
  };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ArchiveLiveTiming {
  export type YearIndex = {
    Year: number;
    Meetings: {
      Sessions: {
        Key: number;
        Type: "Practice" | "Qualifying" | "Race";
        Number?: 0 | 1 | 2 | 3;
        Name?: "Practice 1" | "Practice 2" | "Practice 3" | "Qualifying" | "Race" | "Sprint" | "Sprint Shootout";
        StartDate: string;
        EndDate: string;
        GmtOffset: string;
        Path?: string;
      }[];
      Key: number;
      Code: string;
      Number: number;
      Location: string;
      OfficialName: string;
      Name: string;
      Country: {
        Key: number;
        Code: string;
        Name: string;
      };
      Circuit: {
        Key: number;
        ShortName: string;
      };
    }[];
  };

  export type SessionIndex = {
    Feeds: Record<string, {
      KeyFramePath: string;
      StreamPath: string;
    }>;
  };
}

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
