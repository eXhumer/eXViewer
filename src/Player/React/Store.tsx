import { configureStore } from '@reduxjs/toolkit';
import ascendonReducer from './Reducer/Ascendon';
import configReducer from './Reducer/Config';

const store = configureStore({
  reducer: {
    ascendon: ascendonReducer,
    config: configReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export default store;
