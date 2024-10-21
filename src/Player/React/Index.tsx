import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import './Index.scss';
import App from './App';
import store from './Store';

createRoot(document.getElementById('react-root') as HTMLDivElement)
  .render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  );
