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

import type { IpcRendererEvent } from 'electron';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Menu, MenuItem, sidebarClasses } from 'react-pro-sidebar';
import { selectSubscriptionToken, update as updateSubscriptionToken } from './Reducer/SubscriptionToken';
import { useAppDispatch, useAppSelector } from './Hook';
import styles from './App.module.css';

const App = () => {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const subscriptionToken = useAppSelector(selectSubscriptionToken);
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const subscriptionTokenCb = useCallback((e: IpcRendererEvent, ascendon: string | null) => {
    dispatch(updateSubscriptionToken(ascendon));
    setInitialLoad(false);
  }, []);

  useEffect(() => {
    f1tv.onSubscriptionToken(subscriptionTokenCb);

    return () => {
      f1tv.offSubscriptionToken(subscriptionTokenCb);
    };
  }, []);

  return initialLoad === false ? (
    <div className={[styles['all-space'], styles['flexbox-horizontal']].join(' ')}>
      <Sidebar collapsed={collapsed} rootStyles={{
        [`.${sidebarClasses.container}`]: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}>
        <Menu
          menuItemStyles={{
            button: ({ active }) => {
              return {
                backgroundColor: active ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
              };
            },
          }}
        >
          <MenuItem
            onClick={() => setCollapsed(!collapsed)}
          > Expand / Collapse </MenuItem>
          <MenuItem active={true}> Home </MenuItem>
        </Menu>
        <Menu>
          {subscriptionToken ?
            <MenuItem onClick={() => f1tv.logout()} > Logout </MenuItem> :
            <MenuItem onClick={() => f1tv.login()} > Login </MenuItem>}
        </Menu>
      </Sidebar>
      <div className={styles["all-space"]}>
        <div>
          {subscriptionToken ? <>
          <input ref={inputRef} type='number' placeholder='Content ID' />
          <button onClick={() => {
            if (inputRef.current && inputRef.current.value) {
              const contentId = parseInt(inputRef.current.value);
              inputRef.current.value = '';
              exviewer.newPlayer(contentId);
            }
          }}> Play </button>
          </> :
          <h1>Not Logged In!</h1>}
        </div>
      </div>
    </div>
  ) : (
    <div className={styles['all-space']}>
      <h1>Loading...</h1>
    </div>
  );
};

export default App;
