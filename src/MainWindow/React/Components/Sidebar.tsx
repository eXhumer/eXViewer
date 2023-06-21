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
import CrossIcon from "../Assets/Cross.svg";
import GithubBlackIcon from "../Assets/GithubBlack.svg";
import InfoIcon from "../Assets/Info.svg";
import MenuIcon from "../Assets/Menu.svg";

export default () => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Sidebar
      collapsed={collapsed}
      collapsedWidth="50px"
      width="200px"
    >
      <Menu
        menuItemStyles={{
          button: ({ active }) => {
            return {
              backgroundColor: active ? "#CCCCCC" : undefined,
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
            paddingLeft: 0
          }
        }}
      >
        <MenuItem
          icon={<img src={collapsed ? MenuIcon : CrossIcon} style={{width: "20px", height: "20px"}} />}
          onClick={() => { setCollapsed(prev => !prev); }}
        />
        <MenuItem
          active={true}
          icon={<img src={InfoIcon} style={{width: "20px", height: "20px"}}/>}
        >Info</MenuItem>
        <MenuItem
          icon={<img src={GithubBlackIcon} style={{width: "20px", height: "20px"}}/>}
          onClick={window.exviewer.openGitHubProject}
        >Open on GitHub</MenuItem>
      </Menu>
    </Sidebar>
  );
};
