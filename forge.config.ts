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

import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
// import { FusesPlugin } from '@electron-forge/plugin-fuses';
// import { FuseVersion, FuseV1Options } from '@electron/fuses';

import { mainConfig } from './webpack/main.config';
import { rendererConfig } from './webpack/renderer.config';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

const vmpSignPkg = async (pkgPath: string, username: string, password: string) => {
  await execPromise(`python -m pip install --upgrade castlabs-evs`);
  await execPromise(`python -m castlabs_evs.account reauth --account-name '${username}' --passwd '${password}'`);
  await execPromise(`python -m castlabs_evs.vmp sign-pkg "${pkgPath}"`);
};

const config: ForgeConfig = {
  hooks: {
    postPackage: async (config, pkgResult) => {
      // Linux doesn't support VMP signing
      if (pkgResult.platform == 'linux')
        return;

      if (!process.env.CASTLABS_EVS_USERNAME || !process.env.CASTLABS_EVS_PASSWORD)
        throw new Error(`Missing CASTLABS_EVS_USERNAME or CASTLABS_EVS_PASSWORD environment variables required for signing!`);

      for (const path of pkgResult.outputPaths)
        await vmpSignPkg(path, process.env.CASTLABS_EVS_USERNAME, process.env.CASTLABS_EVS_PASSWORD);
    },
  },
  packagerConfig: {
    asar: true,
    download: {
      mirrorOptions: {
        mirror: 'https://github.com/castlabs/electron-releases/releases/download/'
      }
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ['darwin', 'win32', 'linux']),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: 'media-src * blob:; font-src https://fonts.gstatic.com;',
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/Player/Index.html',
            js: './src/Player/Renderer.ts',
            name: 'player',
            preload: {
              js: './src/Player/Preload.ts',
            },
          },
          {
            html: './src/MainWindow/Index.html',
            js: './src/MainWindow/Renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/MainWindow/Preload.ts',
            },
          },
        ],
      },
    }),
    // https://github.com/castlabs/electron-releases/issues/152
    // new FusesPlugin({
    //   version: FuseVersion.V1,
    //   [FuseV1Options.RunAsNode]: false,
    //   [FuseV1Options.EnableCookieEncryption]: true,
    //   [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    //   [FuseV1Options.EnableNodeCliInspectArguments]: false,
    //   [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    //   [FuseV1Options.OnlyLoadAppFromAsar]: true
    // }),
  ],
};

export default config;
