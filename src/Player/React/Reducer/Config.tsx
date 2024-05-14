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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../Store';
import { Config } from '@exhumer/f1tv-api';

export type ConfigState = {
  value: Config | null;
};

const initialState: ConfigState = {
  value: null,
};

export const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<Config | null>) => {
      state.value = action.payload;
    },
  },
});

export const { update } = configSlice.actions;

export const selectConfig = (state: RootState) => state.config.value;

export default configSlice.reducer;
