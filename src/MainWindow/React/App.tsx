import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './Store';
import { updateAscendon, updateConfig, updateEntitlement, updateLocation } from './Slice/F1TV';
import { DecodedAscendonToken, F1TV } from '@exhumer/f1tv-api';

const App = () => {
  const dispatch = useAppDispatch();
  const ascendon = useAppSelector(state => state.f1tv.ascendon);
  const config = useAppSelector(state => state.f1tv.config);
  const entitlement = useAppSelector(state => state.f1tv.entitlement);
  const location = useAppSelector(state => state.f1tv.location);
  const isReady = config !== null && location !== null;

  const handleBtn = () => {
    if (ascendon === null)
      f1tv.login();

    else
      f1tv.logout();
  };

  const readyToShowCB = (e: Electron.IpcRendererEvent, decodedAscendon: DecodedAscendonToken | null, entitlement: string | null, config: F1TV.Config | null, location: F1TV.LocationResult | null) => {
    dispatch(updateAscendon(decodedAscendon));
    dispatch(updateEntitlement(entitlement));
    dispatch(updateConfig(config));
    dispatch(updateLocation(location));
  };

  const ascendonCB = (e: Electron.IpcRendererEvent, decodedAscendon: DecodedAscendonToken | null) => {
    dispatch(updateAscendon(decodedAscendon));
  };

  const configCB = (e: Electron.IpcRendererEvent, config: F1TV.Config | null) => {
    dispatch(updateConfig(config));
  };

  const entitlementCB = (e: Electron.IpcRendererEvent, entitlement: string | null) => {
    dispatch(updateEntitlement(entitlement));
  };

  const locationCB = (e: Electron.IpcRendererEvent, location: F1TV.LocationResult | null) => {
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
      <h2>F1TV Status: {isReady ? 'Ready' : 'Not ready'}</h2>
      <h2>{ascendon !== null ? `Logged in as ${ascendon.FirstName} ${ascendon.LastName}!` : 'Not logged in!'}</h2>
      {ascendon !== null && <h2>Entitlement: {entitlement !== null ? 'Available' : 'Not available'}</h2>}
      {ascendon !== null && <h2>Subscription Status: {ascendon.SubscriptionStatus}</h2>}
      {ascendon !== null && ascendon.SubscriptionStatus === 'active' && <h2>Subscription Product: {ascendon.SubscribedProduct}</h2>}
      <button onClick={handleBtn}>{ascendon === null ? 'Login' : 'Logout'}</button>
    </>
  );
};

export default App;
