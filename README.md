# eXViewer

<div align="center">
  <table>
    <tr style="border: none">
      <td>
        <a href="https://github.com/eXhumer/eXViewer">
          <img src="./assets/icon.png" width="100" />
        </a>
      </td>
      <td>
        <div align="center">
          Unofficial live timing and content streaming client for F1TV.
          <br />
          <a href="https://github.com/eXhumer/eXViewer/actions/workflows/build.yml">
            <img src="https://github.com/eXhumer/eXViewer/actions/workflows/build.yml/badge.svg" />
          </a>
        </div>
      </td>
    </tr>
  </table>
</div>

<br />

**This app is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing BV.**

## Packaging notes
* A [`postPackage`](https://www.electronforge.io/config/hooks#postpackage) hook has been added for macOS/win32 packages to be [VMP signed](https://github.com/castlabs/electron-releases/wiki/VMP) with [castlabs-evs](https://pypi.org/project/castlabs-evs/). `CASTLABS_EVS_USERNAME` & `CASTLABS_EVS_PASSWORD` are required as a result when trying to build the macOS/win32 packages and the `python` command must be available during packaging. For macOS builds, codesign build with custom entitlements as necessary and then notarize it with `APPLE_ID`, `APPLE_ID_PASSWORD` & `APPLE_TEAM_ID`.

## Acknowledgements
* [CastLabs' Electron](https://github.com/castlabs/electron-releases) which allows Widevine protected stream playback.
* [robvdpol's RaceControl](https://github.com/robvdpol/RaceControl) which provided an open-source desktop client for F1TV content streaming before F1TV used Widevine DRM.

## Dependency version notes
Some dependencies are locked to specific versions due to compatibility issues caused due to the newer versions.

* `eslint` is locked to `^8.57.0` due to `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` & `eslint-plugin-import` not being available for major version 9 yet. [`@typescript-eslint/eslint-plugin` & `@typescript-eslint/parser` have released beta version `rc-v8` to add support for ESLint 9](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8-beta/#as-an-existing-user), however [`eslint-plugin-import` has no support for ESLint 9 yet](https://github.com/import-js/eslint-plugin-import/pull/2996).
* `@vercel/webpack-asset-relocator-loader` is locked to [`1.7.3` due to Electron Forge](https://github.com/electron/forge/issues/3600)
* `sass` is locked to [`1.77.6` due to breaking changes with mixed declarations](https://sass-lang.com/documentation/breaking-changes/mixed-decls/). `1.77.7` & above shows warning regarding this while launching in development mode due to loading SCSS from packages `bootstrap` & `bitmovin-player-ui`.

## License

This package is licensed under the AGPL-3.0-only License. See the [LICENSE](LICENSE.md) file for more information.
