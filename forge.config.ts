// Node.js dependencies
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { readdir, unlink } from 'fs/promises';
import { join, resolve } from 'path';

// External dependencies
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { signAsync, PerFileSignOptions } from '@electron/osx-sign';
import { notarize } from '@electron/notarize';
// import { FusesPlugin } from '@electron-forge/plugin-fuses';
// import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { config as dotenvConfig } from 'dotenv';

// Local dependencies
import { mainConfig } from './webpack/main.config';
import { rendererConfig } from './webpack/renderer.config';
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
    packageAfterExtract: async (config, buildPath, electronVersion, platform) => {
      if (platform !== 'darwin')
        return;

      const helpers = await readdir(buildPath, { recursive: true })
        .then(files => files.filter(f => f.endsWith('Electron Framework.framework')))
        .then(files => files.map(f => join(buildPath, f)));

      for (const helper of helpers) {
        const sigFiles = await readdir(helper, { recursive: true })
          .then(files => files.filter(f => f.endsWith('Versions/A/Resources/Electron Framework.sig')))
          .then(files => files.map(f => join(helper, f)));

        for (const sigFile of sigFiles)
          await unlink(sigFile);
      }
    },
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
    download: {
      mirrorOptions: {
        mirror: 'https://github.com/castlabs/electron-releases/releases/download/'
      }
    },
    icon: './assets/icon',
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ['darwin', 'linux', 'win32']),
    new MakerDMG({
      appPath: 'fakePathToSatisfyTypeCheck',
      name: `Install ${productName}`,
      icon: './assets/icon.icns',
    }),
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
            html: './src/main_window/index.html',
            js: './src/main_window/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/main_window/preload.ts',
            },
          },
          {
            html: './src/player/index.html',
            js: './src/player/renderer.ts',
            name: 'player',
            preload: {
              js: './src/player/preload.ts',
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
    //   [FuseV1Options.OnlyLoadAppFromAsar]: true,
    // }),
  ],
};

export default config;
