import { configureStore } from '@reduxjs/toolkit';

import f1tvReducer from './Slice/F1TV';

const store = configureStore({
  reducer: {
    f1tv: f1tvReducer,
  },
});

export default store;
