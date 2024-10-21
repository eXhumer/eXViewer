import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { F1TV } from '@exhumer/f1tv-api';

export type PlayerState = {
  ascendon: string | null;
  config: F1TV.Config | null;
  videoContainer: F1TV.ContentVideoContainer | null;
};

const initialState: PlayerState = {
  ascendon: null,
  config: null,
  videoContainer: null,
};

export const configSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    updateAscendon: (state, action: PayloadAction<string | null>) => {
      state.ascendon = action.payload;
    },
    updateConfig: (state, action: PayloadAction<F1TV.Config | null>) => {
      state.config = action.payload;
    },
    updateVideoContainer: (state, action: PayloadAction<F1TV.ContentVideoContainer | null>) => {
      state.videoContainer = action.payload;
    },
  },
});

export const { updateAscendon, updateConfig, updateVideoContainer } = configSlice.actions;

export default configSlice.reducer;
