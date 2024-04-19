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
import { signAsync, PerFileSignOptions } from '@electron/osx-sign';
import { notarize } from '@electron/notarize';
// import { FusesPlugin } from '@electron-forge/plugin-fuses';
// import { FuseVersion, FuseV1Options } from '@electron/fuses';

import { mainConfig } from './webpack/main.config';
import { rendererConfig } from './webpack/renderer.config';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { config as dotenvConfig } from 'dotenv';
import { join, resolve } from 'path';

import { author, productName } from './package.json';

dotenvConfig();

const spawnPromise = (command: string, args?: string[], options?: SpawnOptionsWithoutStdio) => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, options);

    child.on('exit', code => {
      if (code === 0)
        resolve();
      else
        reject(new Error(`Command "${command} ${args ? args.join(' ') : ''}" exited with code ${code}`));
    });

    child.on('error', reject);
  });
};

const vmpSignPkg = async (pkgPath: string, username: string, password: string) => {
  await spawnPromise('python', ['-m', 'pip', 'install', '--upgrade', 'castlabs-evs']);
  await spawnPromise('python', ['-m', 'castlabs_evs.account', 'reauth', '--account-name', username, '--passwd', password]);
  await spawnPromise('python', ['-m', 'castlabs_evs.vmp', 'sign-pkg', pkgPath]);
};

const osxSignPkg = async (pkgPath: string, optionsForFile?: (path: string) => PerFileSignOptions) => {
  if (process.platform !== 'darwin')
    throw new Error(`OSX Code-Signing is only supported on macOS!`);

  await signAsync({
    app: `${pkgPath}/${productName}.app`,
    platform: 'darwin',
    optionsForFile: optionsForFile,
  });
};

const osxNotarizePkg = async (pkgPath: string, appleId: string, appleIdPassword: string, appleTeamId: string) => {
  if (process.platform !== 'darwin')
    throw new Error(`OSX Notarization is only supported on macOS!`);

  await notarize({
    tool: 'notarytool',
    appPath: `${pkgPath}/${productName}.app`,
    appleId: appleId,
    appleIdPassword: appleIdPassword,
    teamId: appleTeamId,
  });
};

const config: ForgeConfig = {
  hooks: {
    postPackage: async (config, pkgResult) => {
      // Linux doesn't support VMP signing
      if (pkgResult.platform === 'linux')
        return;

      if (!process.env.CASTLABS_EVS_USERNAME || !process.env.CASTLABS_EVS_PASSWORD)
        throw new Error(`Missing CASTLABS_EVS_USERNAME or CASTLABS_EVS_PASSWORD environment variables required for signing!`);

      for (const path of pkgResult.outputPaths) {
        await vmpSignPkg(path, process.env.CASTLABS_EVS_USERNAME, process.env.CASTLABS_EVS_PASSWORD);

        if (pkgResult.platform === 'darwin' && process.platform === 'darwin') {
          await osxSignPkg(path, fPath => {
            let entitlements = resolve(join(__dirname, 'entitlements', 'Default.plist'));
  
            if (fPath.endsWith('Helper.app')) // https://github.com/castlabs/electron-releases/issues/161#issuecomment-1609020079
              entitlements = resolve(join(__dirname, 'entitlements', 'Helper.plist'));
  
            else if (fPath.endsWith('(Plugin).app'))
              entitlements = resolve(join(__dirname, 'entitlements', 'Plugin.plist'));
  
            return {
              entitlements: entitlements,
              hardenedRuntime: true,
            };
          });
  
          if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.APPLE_TEAM_ID)
            throw new Error(`Missing APPLE_ID, APPLE_ID_PASSWORD or APPLE_TEAM_ID environment variables required for notarization!`);
  
          await osxNotarizePkg(path, process.env.APPLE_ID, process.env.APPLE_ID_PASSWORD, process.env.APPLE_TEAM_ID);
        }
      }
    },
  },
  packagerConfig: {
    appBundleId: `com.${author.name}.${productName}`.toLowerCase(),
    appCategoryType: 'public.app-category.entertainment',
    appCopyright: `Copyright © 2024  ${author.name}`,
    asar: true,
    helperBundleId: `com.${author.name}.${productName}.helper`.toLowerCase(),
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
