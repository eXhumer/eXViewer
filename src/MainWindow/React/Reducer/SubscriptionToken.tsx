import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../Store';

export type SubscriptionTokenState = {
  value: string | null;
};

const initialState: SubscriptionTokenState = {
  value: null,
};

export const subscriptionTokenSlice = createSlice({
  name: 'subscriptionToken',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<string | null>) => {
      state.value = action.payload;
    },
  },
});

export const { update } = subscriptionTokenSlice.actions;

export const selectSubscriptionToken = (state: RootState) => state.subscriptionToken.value;

export default subscriptionTokenSlice.reducer;
