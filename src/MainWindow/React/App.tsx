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
import Info from "./Components/Info";
import { AppPage } from "../../Type";
import Sidebar from "./Components/Sidebar";

export default () => {
  const [appPage, setAppPage] = useState(AppPage.DEFAULT);

  return (
    <>
      <Sidebar
        appPage={appPage}
        currentSeason={(new Date(Date.now())).getFullYear()}
        setAppPage={setAppPage}
      />
      <div style={{height: "100%", width: "100%"}}>
        {appPage === AppPage.INFO ?
          <Info /> :
          appPage === AppPage.CURRENT_SEASON ?
          <div>Current Season</div> :
          appPage === AppPage.SETTINGS ?
          <div>Settings</div> : null}
      </div>
    </>
  );
};
