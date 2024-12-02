import { useEffect } from 'react';
import { DecodedAscendonToken, F1TV } from '@exhumer/f1tv-api';

import LoggedOutView from './Component/LoggedOutView';
import LoggedInView from './Component/LoggedInView';

import { updateAscendon, updateConfig, updateEntitlement, updateLocation } from './Slice/F1TV';
import { useAppDispatch, useAppSelector } from './Hook';

const App = () => {
  const dispatch = useAppDispatch();
  const ascendon = useAppSelector(state => state.f1tv.ascendon);

  const readyToShowCB = (e: Electron.IpcRendererEvent, decodedAscendon: DecodedAscendonToken | null, entitlement: string | null, config: F1TV.Config | null, location: F1TV.LocationResult | null) => {
    dispatch(updateAscendon(decodedAscendon));
    dispatch(updateEntitlement(entitlement));
    dispatch(updateConfig(config));
    dispatch(updateLocation(location));
  };

  const ascendonCB = (e: Electron.IpcRendererEvent, decodedAscendon: DecodedAscendonToken | null) => {
    dispatch(updateAscendon(decodedAscendon));
  };

  const configCB = (e: Electron.IpcRendererEvent, config: F1TV.Config) => {
    dispatch(updateConfig(config));
  };

  const entitlementCB = (e: Electron.IpcRendererEvent, entitlement: string | null) => {
    dispatch(updateEntitlement(entitlement));
  };

  const locationCB = (e: Electron.IpcRendererEvent, location: F1TV.LocationResult) => {
    dispatch(updateLocation(location));
  };

  const readyCB = (e: Electron.IpcRendererEvent, config: F1TV.Config, location: F1TV.LocationResult) => {
    dispatch(updateConfig(config));
    dispatch(updateLocation(location));
  };

  useEffect(() => {
    mainWindow.onReadyToShow(readyToShowCB);
    f1tv.onAscendon(ascendonCB);
    f1tv.onConfig(configCB);
    f1tv.onEntitlement(entitlementCB);
    f1tv.onLocation(locationCB);
    f1tv.onReady(readyCB);

    return () => {
      mainWindow.offReadyToShow(readyToShowCB);
      f1tv.offAscendon(ascendonCB);
      f1tv.offConfig(configCB);
      f1tv.offEntitlement(entitlementCB);
      f1tv.offLocation(locationCB);
      f1tv.offReady(readyCB);
    };
  }, []);

  return (
    <>
      {ascendon !== null ?
        <LoggedInView /> :
        <LoggedOutView />}
    </>
  );
};

export default App;
