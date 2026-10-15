import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    // Packager otherwise writes an asar integrity digest into the macOS
    // Electron Framework binary, which castlabs EVS rejects for VMP signing.
    // Integrity is still checked against the hash in Info.plist.
    // See https://github.com/castlabs/electron-releases/issues/240
    asarIntegrityDigest: false,
    // Package with castlabs Electron for Content Security (ECS) instead of stock Electron.
    download: {
      mirrorOptions: {
        mirror:
          'https://github.com/castlabs/electron-releases/releases/download/',
      },
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ['darwin', 'win32']),
    // The Linux makers look for a binary named after package.json's `name`
    // (exviewer), but the packaged binary takes `productName` (eXViewer).
    new MakerRpm({ options: { bin: 'eXViewer' } }),
    new MakerDeb({ options: { bin: 'eXViewer' } }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.mts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
    }),
  ],
};

export default config;
