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

import { useRef } from 'react';
import { selectSubscriptionToken } from '../Reducer/SubscriptionToken';
import { useAppSelector } from '../Hook';

const Home = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const subscriptionToken = useAppSelector(selectSubscriptionToken);

  return (
    <div>
      {subscriptionToken !== null ? <>
        <input ref={inputRef} type="number" placeholder="Enter Content ID to view" />
        <button
          onClick={() => {
            if (inputRef.current) {
              const contentId = parseInt(inputRef.current.value);

              if (!isNaN(contentId)) {
                inputRef.current.value = '';
                exviewer.newPlayer(contentId);
              }
            }
          }}
        > Play Content </button>
        <button onClick={() => f1tv.logout()}>Logout</button>
      </> : <>
        <p> Please login to start watching content. </p>
        <button onClick={() => f1tv.login()}> Login </button>
      </>}
    </div>
  );
};

export default Home;
