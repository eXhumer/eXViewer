import { components, dialog } from 'electron';

/**
 * Waits for castlabs ECS to install or update the Widevine CDM.
 * Resolves false (after logging why) if it can't be loaded.
 */
export async function loadWidevine(): Promise<boolean> {
  const id = components.WIDEVINE_CDM_ID;
  try {
    await components.whenReady([id]);
    console.log('Widevine CDM ready:', components.status()[id]);
    return true;
  } catch (error) {
    const details = (error as Electron.ComponentsError).errors?.map(
      (componentError) => componentError.detail,
    );
    console.error('Widevine CDM failed to load:', error, details ?? '');
    return false;
  }
}

export function warnWidevineUnavailable() {
  void dialog.showMessageBox({
    type: 'warning',
    message: 'Widevine could not be loaded',
    detail:
      'Protected video playback will not work. Check your internet connection and restart eXViewer.',
  });
}
