/*
  eXViewer - Unofficial live timing and content streaming client for F1TV
  Copyright (C) 2024  eXhumer

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';

import store from './Store';

import './Index.css';
import './Custom.scss';
import App from './Route/App';
import Home from './Route/Home';

const router = createMemoryRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
]);

createRoot(document.getElementById('react-root') as HTMLDivElement)
  .render(
    <StrictMode>
      <ReduxProvider store={store}>
        <RouterProvider router={router} />
      </ReduxProvider>
    </StrictMode>
  );
