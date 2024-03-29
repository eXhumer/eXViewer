import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerZIP } from "@electron-forge/maker-zip";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
// import { FusesPlugin } from "@electron-forge/plugin-fuses";
// import { FuseVersion, FuseV1Options } from "@electron/fuses";

import { mainConfig } from "./webpack/main.config";
import { rendererConfig } from "./webpack/renderer.config";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    download: {
      mirrorOptions: {
        mirror: "https://github.com/castlabs/electron-releases/releases/download/"
      }
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ["darwin", "win32", "linux"]),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/MainWindow/index.html",
            js: "./src/MainWindow/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/MainWindow/preload.ts",
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
