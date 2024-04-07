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

import { useEffect, useRef, useState } from 'react';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import './App.css';

const App = () => {
  const [collapse, setCollapse] = useState<boolean>(true);
  const [subscriptionToken, setSubscriptionToken] = useState<string | null>(null);
  const contentIdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    f1tv.onSubscriptionToken((e, ascendon) => {
      setSubscriptionToken(ascendon);
    });
  }, []);

  return (
    <div className={['all-space', 'flexbox-horizontal'].join(' ')}>
      <Sidebar collapsed={collapse}>
        <Menu>
          <MenuItem onClick={() => setCollapse(!collapse)}> Expand / Collapse </MenuItem>
          {subscriptionToken ?
            <MenuItem onClick={f1tv.logout} > Logout </MenuItem> :
            <MenuItem onClick={f1tv.login}> Login </MenuItem>}
        </Menu>
      </Sidebar>
      {subscriptionToken && <div>
        <input ref={contentIdInputRef} type="number" placeholder="Content ID" />
        <button onClick={() => {
          if (contentIdInputRef.current && contentIdInputRef.current.value) {
            exviewer.newPlayer(parseInt(contentIdInputRef.current.value));
          }
        }}> Play </button>
      </div>}
    </div>
  );
};

export default App;
