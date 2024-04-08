# eXViewer

Unofficial live timing and content streaming client for F1TV.

**This app is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing BV.**

## Packaging notes
* A [`postPackage`](https://www.electronforge.io/config/hooks#postpackage) hook has been added for macOS/win32 packages to be [VMP signed](https://github.com/castlabs/electron-releases/wiki/VMP) with [castlabs-evs](https://pypi.org/project/castlabs-evs/). `CASTLABS_EVS_USERNAME` & `CASTLABS_EVS_PASSWORD` are required as a result when trying to build the macOS/win32 packages and the `python` command must be available during packaging.

## Acknowledgements
* [CastLabs' Electron](https://github.com/castlabs/electron-releases) which allows Widevine protected stream playback.
* [robvdpol's RaceControl](https://github.com/robvdpol/RaceControl) which provided an open-source desktop client for F1TV content streaming before F1TV used Widevine DRM.

## License

This package is licensed under the AGPL-3.0-only License. See the [LICENSE](LICENSE.md) file for more information.
