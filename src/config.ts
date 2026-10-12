import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export interface AppConfig {
  disableHardwareAcceleration?: boolean;
}

/** Path to config.json in the app data folder. */
export const getConfigPath = () =>
  path.join(app.getPath('userData'), 'config.json');

/**
 * Reads config.json synchronously, so it can be used before the app is ready.
 * A missing or invalid file yields an empty config.
 */
export function readConfig(): AppConfig {
  const configPath = getConfigPath();
  let raw: string;
  try {
    raw = fs.readFileSync(configPath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`Could not read ${configPath}:`, error);
    }
    return {};
  }
  try {
    const config: unknown = JSON.parse(raw);
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      return config as AppConfig;
    }
    console.warn(`Ignoring ${configPath}: expected a JSON object`);
  } catch (error) {
    console.warn(`Ignoring ${configPath}: invalid JSON`, error);
  }
  return {};
}
