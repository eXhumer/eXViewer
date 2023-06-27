/*
  eXViewer - Live timing and content streaming client for F1TV
  Copyright © 2023 eXhumer

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

import { useState } from "react";
import { menuClasses, Menu, MenuItem, Sidebar } from "react-pro-sidebar";
import { AppPage, SetAppPageFn } from "../../../Type";

// assets
import CrossIcon from "../Assets/Cross.svg";
import GearIcon from "../Assets/Gear.svg";
import GithubBlackIcon from "../Assets/GithubBlack.svg";
import InfoIcon from "../Assets/Info.svg";
import MenuIcon from "../Assets/Menu.svg";

type SidebarProps = {
  appPage: AppPage;
  currentSeason?: number;
  setAppPage: SetAppPageFn;
};

export default ({ appPage, currentSeason, setAppPage }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Sidebar
      collapsed={collapsed}
      collapsedWidth="50px"
      width="200px"
    >
      <div style={{display: "flex", flexFlow: "column", height: "100%"}}>
        <Menu
          menuItemStyles={{
            button: ({ active }) => {
              return {
                backgroundColor: active ? "#CCCCCC" : undefined,
                "&:hover": {
                  backgroundColor: active ? "#BBBBBB" : undefined,
                },
              };
            },
          }}
          rootStyles={{
            [`.${menuClasses.icon}`]: {
              margin: 0,
              padding: "15px",
              width: "20px",
              minWidth: "20px",
              height: "20px",
              lineHeight: "20px",
            },
            [`.${menuClasses.button}`]: {
              paddingLeft: 0,
              paddingRight: 0,
            },
          }}
        >
          <MenuItem
            icon={<img src={collapsed ? MenuIcon : CrossIcon} style={{width: "20px", height: "20px"}} />}
            onClick={() => { setCollapsed(prev => !prev); }}
          />
          <MenuItem
            active={appPage === AppPage.CURRENT_SEASON}
            icon={<div>{currentSeason}</div>}
            onClick={() => { setAppPage(AppPage.CURRENT_SEASON); }}
          >Current Season</MenuItem>
        </Menu>
        <div style={{height: "100%"}}></div>
        <Menu
          menuItemStyles={{
            button: ({ active }) => {
              return {
                backgroundColor: active ? "#CCCCCC" : undefined,
                "&:hover": {
                  backgroundColor: active ? "#BBBBBB" : undefined,
                },
              };
            },
          }}
          rootStyles={{
            [`.${menuClasses.icon}`]: {
              margin: 0,
              padding: "15px",
              width: "20px",
              minWidth: "20px",
              height: "20px",
              lineHeight: "20px",
            },
            [`.${menuClasses.button}`]: {
              paddingLeft: 0,
              paddingRight: 0,
            },
          }}
        >
          <MenuItem
            icon={<img src={GithubBlackIcon} style={{width: "20px", height: "20px"}} />}
            onClick={window.exviewer.openGitHubProject}
          >Open on GitHub</MenuItem>
          <MenuItem
            active={appPage === AppPage.INFO}
            icon={<img src={InfoIcon} style={{width: "20px", height: "20px"}} />}
            onClick={() => { setAppPage(AppPage.INFO); }}
          >Info</MenuItem>
          <MenuItem
            active={appPage === AppPage.SETTINGS}
            icon={<img src={GearIcon} style={{width: "20px", height: "20px"}} />}
            onClick={() => { setAppPage(AppPage.SETTINGS); }}
          >Settings</MenuItem>
        </Menu>
      </div>
    </Sidebar>
  );
};
