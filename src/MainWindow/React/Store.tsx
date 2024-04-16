import { configureStore } from '@reduxjs/toolkit';
import subscriptionTokenReducer from './Reducer/SubscriptionToken';

const store = configureStore({
  reducer: {
    subscriptionToken: subscriptionTokenReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export default store;
