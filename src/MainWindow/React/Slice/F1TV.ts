import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DecodedAscendonToken, F1TV } from '@exhumer/f1tv-api';

type F1TVState = {
  ascendon: DecodedAscendonToken | null;
  config: F1TV.Config | null;
  entitlement: string | null;
  location: F1TV.LocationResult | null;
};

const initialState: F1TVState = {
  ascendon: null,
  config: null,
  entitlement: null,
  location: null,
};

export const f1tvSlice = createSlice({
  name: 'f1tv',
  initialState: initialState,
  reducers: {
    updateAscendon: (state, action: PayloadAction<DecodedAscendonToken | null>) => {
      state.ascendon = action.payload;
    },
    updateConfig: (state, action: PayloadAction<F1TV.Config | null>) => {
      state.config = action.payload;
    },
    updateEntitlement: (state, action: PayloadAction<string | null>) => {
      state.entitlement = action.payload;
    },
    updateLocation: (state, action: PayloadAction<F1TV.LocationResult | null>) => {
      state.location = action.payload;
    },
  },
})

export const {
  updateAscendon,
  updateConfig,
  updateEntitlement,
  updateLocation,
} = f1tvSlice.actions;

export default f1tvSlice.reducer;
