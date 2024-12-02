import { createRoot } from 'react-dom/client';

import { Provider } from 'react-redux';

import './Index.scss';

import App from './App';
import store from './Store';
import { StrictMode } from 'react';

createRoot(document.getElementById('react-root') as HTMLDivElement)
  .render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  );
