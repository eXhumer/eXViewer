import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { F1TV } from '@exhumer/f1tv-api';

export type PlayerState = {
  ascendon: string | null;
  config: F1TV.Config | null;
  currentPlayResult: F1TV.ContentPlayResult | null;
  videoContainer: F1TV.ContentVideoContainer | null;
  platform: string | null;
};

const initialState: PlayerState = {
  ascendon: null,
  config: null,
  currentPlayResult: null,
  videoContainer: null,
  platform: null,
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
    updateCurrentPlayResult: (state, action: PayloadAction<F1TV.ContentPlayResult | null>) => {
      state.currentPlayResult = action.payload;
    },
    updatePlatform: (state, action: PayloadAction<string | null>) => {
      state.platform = action.payload;
    },
    updateVideoContainer: (state, action: PayloadAction<F1TV.ContentVideoContainer | null>) => {
      state.videoContainer = action.payload;
    },
  },
});

export const { updateAscendon, updateConfig, updateCurrentPlayResult, updatePlatform, updateVideoContainer } = configSlice.actions;

export default configSlice.reducer;
