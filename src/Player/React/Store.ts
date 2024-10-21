import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './Slice/Player';

const store = configureStore({
  reducer: {
    player: playerReducer,
  },
});

export default store;
