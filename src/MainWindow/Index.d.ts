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

import { LocationResult } from "@exhumer/f1tv-api";

declare interface F1TV {
  location: () => Promise<LocationResult>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  onSubscriptionToken: (cb: (e: IpcRendererEvent, ascendon: string | null) => void) => void;
  whenLocationReady: () => Promise<void>;
}

declare interface ExViewer {
  newPlayer: (contentId: number) => Promise<void>;
}

declare global {
  interface Window {
    exviewer: ExViewer,
    f1tv: F1TV,
  }

  const exviewer: ExViewer;
  const f1tv: F1TV;
}

export {}
