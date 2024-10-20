import { createRoot } from 'react-dom/client';

import { Provider } from 'react-redux';

import App from './App';
import store from './Store';

createRoot(document.getElementById('react-root') as HTMLDivElement)
  .render(
    <Provider store={store}>
      <App />
    </Provider>
  );
