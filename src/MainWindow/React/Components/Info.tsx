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

import { useEffect, useState } from "react";
import { author, description, productName, version } from "../../../../package.json";

export default () => {
  const [nodejsVersion, setNodeJSVersion] = useState(null);
  const [electronVersion, setElectronVersion] = useState(null);

  useEffect(() => {
    window.exviewer.electronVersion().then(version => { setElectronVersion(version); });
    window.exviewer.nodejsVersion().then(version => { setNodeJSVersion(version); });
  }, []);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h2 style={{margin: 0}}>{productName}</h2>
      <h3 style={{margin: 0}}>Version v{version}</h3>
      <table>
        <thead>
          <tr>
            <td>NodeJS</td>
            <td>{nodejsVersion}</td>
          </tr>
          <tr>
            <td>Electron</td>
            <td>{electronVersion}</td>
          </tr>
        </thead>
      </table>
      <div style={{margin: 20}}>
        <p>{productName} - {description}</p>
        <p>Copyright © 2023 {author.name}</p>

        <p>{productName} is an unofficial software and is not associated in anyway with Formula 1 or
        any of its companies.</p>

        <p>This program is free software: you can redistribute it and/or modify
        it under the terms of the GNU Affero General Public License as
        published by the Free Software Foundation, version 3 of the License.</p>

        <p>This program is distributed in the hope that it will be useful,
        but WITHOUT ANY WARRANTY; without even the implied warranty of
        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        GNU Affero General Public License for more details.</p>

        <p>You should have received a copy of the GNU Affero General Public License
        along with this program.  If not, see https://www.gnu.org/licenses/.</p>
      </div>
    </div>
  );
};
