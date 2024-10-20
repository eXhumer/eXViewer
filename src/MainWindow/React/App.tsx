import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './Store';
import { updateAscendon } from './Slice/F1TV';
import { DecodedAscendonToken } from '@exhumer/f1tv-api';

const App = () => {
  const dispatch = useAppDispatch();
  const ascendon = useAppSelector(state => state.f1tv.ascendon);

  const handleBtn = () => {
    if (ascendon === null)
      f1tv.login();

    else
      f1tv.logout();
  };

  const loginSessionCB = (e: Electron.IpcRendererEvent, newAscendon: DecodedAscendonToken | null) => {
    console.log('newAscendon', newAscendon);
    dispatch(updateAscendon(newAscendon));
  };

  useEffect(() => {
    f1tv.onLoginSession(loginSessionCB);

    return () => {
      f1tv.offLoginSession(loginSessionCB);
    };
  }, []);

  return (
    <>
      <h2>{ascendon !== null ? `Logged in as ${ascendon.FirstName} ${ascendon.LastName}!` : 'Not logged in!'}</h2>
      <button onClick={handleBtn}>{ascendon === null ? 'Login' : 'Logout'}</button>
    </>
  );
};

export default App;
