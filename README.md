# eXViewer

A desktop app for watching [F1 TV](https://f1tv.formula1.com), built with
Electron and React. It plays live sessions and replays with Widevine through
[castlabs Electron for Content Security](https://github.com/castlabs/electron-releases),
and shows up to four feeds side by side in a synced multiview.

**This app is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing BV.**

## Features

- **F1 account login** through the official F1 login page. Tokens stay in the
  main process and are never handed to the page.
- **Home page for the current season**: the live or next meeting with a
  countdown, continue watching, and the season calendar.
- **Every round by series**: Formula 1, Formula 2, Formula 3, F1 Academy and
  Porsche Supercup, with the sessions kept apart from highlights and shows.
- **Settings** to hide the series you don't follow.
- **Watch page** that offers to resume where you left off, or to watch live or
  from the start.
- **Multiview** in the style of the F1 TV web player: up to four synced feeds
  in several layouts, a channel panel with live previews, drag and drop,
  quality and audio choices per feed, and pop-out windows.
- Your playback position is reported back to F1 TV.

## Requirements

- Node.js (current LTS)
- npm 12. The castlabs Electron dependency is installed from git, which
  `.npmrc` allows with `allow-git=root`.
- Python 3, for VMP signing with castlabs EVS (see below)

## Getting started

```sh
npm install
npm start
```

The first start downloads the castlabs Electron binary and the Widevine CDM.

## Scripts

| Script              | What it does                                |
| ------------------- | ------------------------------------------- |
| `npm start`         | Runs the app in development                 |
| `npm run package`   | Packages the app into `out/`                |
| `npm run make`      | Packages and makes zip, deb and rpm files   |
| `npm run lint`      | Lints with oxlint and checks oxfmt format   |
| `npm run lint:fix`  | Fixes lint issues and formats the code      |
| `npm run typecheck` | Type-checks with `tsc`                      |

## Configuration

eXViewer reads an optional `config.json` from its app data folder at startup:

- macOS: `~/Library/Application Support/eXViewer/config.json`
- Windows: `%APPDATA%\eXViewer\config.json`
- Linux: `~/.config/eXViewer/config.json`

## VMP signing

Widevine only plays protected streams in apps that carry a VMP signature, so
eXViewer is signed with [castlabs EVS](https://github.com/castlabs/electron-releases/wiki/EVS).
EVS needs a free castlabs account:

```sh
python3 -m pip install --upgrade castlabs-evs
python3 -m castlabs_evs.account signup
```

To play protected content while developing, sign the Electron used by
`npm start`:

```sh
python3 -m castlabs_evs.vmp sign-pkg node_modules/electron/dist
```

To sign a build, package first, sign the package, then make the installers
from it:

```sh
npx electron-forge package
python3 -m castlabs_evs.vmp sign-pkg out/eXViewer-darwin-arm64
npx electron-forge make --skip-package
```

On macOS, VMP signing has to happen before any Apple code signing. castlabs
has no VMP for Linux, so Linux builds are not signed.

## Builds on GitHub

`.github/workflows/build.yml` builds and VMP-signs eXViewer for macOS (Apple
silicon and Intel) and Windows, builds it unsigned for Linux, and uploads the
packages as workflow artifacts. It runs when a `v*` tag is pushed, or by hand
from the Actions tab.

Add your EVS account as repository secrets under **Settings > Secrets and
variables > Actions**:

| Secret             | Value                 |
| ------------------ | --------------------- |
| `EVS_ACCOUNT_NAME` | Your EVS account name |
| `EVS_PASSWD`       | Your EVS password     |

## Project layout

```
src/
  main.ts            app startup and the main window
  auth.ts            F1 login and session cookies
  f1tv.ts            F1 TV client, streams, licences and playhead reports
  catalog.ts         calendar and round content for the browse pages
  history.ts         local watch history for continue watching
  popout.ts          pop-out player windows
  widevine.ts        waits for the Widevine CDM
  config.ts          reads config.json
  preload.ts         window.auth, window.player and window.catalog
  shared/            types shared by main and the renderer
  main_window/       the React app
    home/            home page, calendar and content rows
    multiview/       multiview player, channel panel and controls
```

## License

MIT
