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

// Related to castlabs/electron-releases#144
// Reinstalls Castlabs' Electron
import {access, constants, rm} from 'fs/promises';
import child_process from 'child_process';

const electronDir = 'node_modules/electron';
const electronDistDir = `${electronDir}/dist`;
const electronInstallScript = `${electronDir}/install.js`;

const spawnElectronInstallScript = (stdio: child_process.StdioOptions = 'ignore') => {
  const child = child_process.spawn('node', [electronInstallScript],
                                    {stdio: stdio, detached: true});
  child.unref();
  return child;
};

access(electronDistDir, constants.F_OK)
  .then(async () => await rm(electronDistDir, {recursive: true, force: true}))
  .then(() => spawnElectronInstallScript())
  .then(() => { console.log(`redeployed ${electronDistDir} successful!`); });
