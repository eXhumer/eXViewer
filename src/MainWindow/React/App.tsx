import { useEffect, useState } from 'react';

const App = () => {
  const [ascendon, setAscendon] = useState<string | null>(null);
  const handleBtn = () => {
    if (ascendon === null)
      f1tv.login();

    else
      f1tv.logout();
  };
  const loginSessionCB = (e: Electron.IpcRendererEvent, newAscendon: string | null) => setAscendon(newAscendon);

  useEffect(() => {
    f1tv.onLoginSession(loginSessionCB);

    return () => {
      f1tv.offLoginSession(loginSessionCB);
    };
  }, []);

  return (
    <>
      <h2>Ascendon: {ascendon !== null ? 'Logged in!' : 'Not logged in!'}</h2>
      <button onClick={handleBtn}>{ascendon === null ? 'Login' : 'Logout'}</button>
    </>
  );
};

export default App;
