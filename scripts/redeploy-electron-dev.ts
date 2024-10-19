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
