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

import { ContentPlayResult, ContentVideoContainer } from '@exhumer/f1tv-api';

declare interface Player {
  contentPlay: (contentId: number, channelId?: number) => Promise<ContentPlayResult>;
  onContentVideo: (cb: (e: IpcRendererEvent, result: ContentVideoContainer) => void) => void;
}
declare global {
  interface Window {
    player: Player,
  }

  const player: Player;
}

export {}