import { configureStore } from '@reduxjs/toolkit';
import subscriptionTokenReducer from './Slice/SubscriptionToken';

const store = configureStore({
  reducer: {
    subscriptionToken: subscriptionTokenReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export default store;
