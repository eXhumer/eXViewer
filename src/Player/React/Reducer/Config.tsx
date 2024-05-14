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
