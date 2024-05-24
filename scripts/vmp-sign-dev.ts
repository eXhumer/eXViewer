import { config as dotenvConfig } from 'dotenv';

import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { join, resolve } from 'path';

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

if (!process.env.CASTLABS_EVS_USERNAME || !process.env.CASTLABS_EVS_PASSWORD) {
  console.error('CASTLABS_EVS_USERNAME and CASTLABS_EVS_PASSWORD must be set!');
  process.exit(1);
}

vmpSignPkg(`${resolve(join(__dirname, '..', 'node_modules', 'electron', 'dist'))}`, process.env.CASTLABS_EVS_USERNAME, process.env.CASTLABS_EVS_PASSWORD)
  .then(() => console.log('VMP signed node_modules/electron/dist successfully!'));
