import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../Store';

export type AscendonState = {
  value: string | null;
};

const initialState: AscendonState = {
  value: null,
};

export const ascendonSlice = createSlice({
  name: 'ascendon',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<string | null>) => {
      state.value = action.payload;
    },
  },
});

export const { update } = ascendonSlice.actions;

export const selectAscendon = (state: RootState) => state.ascendon.value;

export default ascendonSlice.reducer;
