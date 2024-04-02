import { useEffect, useRef, useState } from "react";

const App = () => {
  const [subscriptionToken, setSubscriptionToken] = useState<string | null>(null);
  const contentIdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    f1tv.onSubscriptionToken((e, ascendon) => {
      setSubscriptionToken(ascendon);
    });
  }, []);

  return (
    <div>
      <h1>Hello, World!</h1>
      {subscriptionToken === null ?
        <button onClick={f1tv.login}>Login</button> : // 
        <div>
          <input type="text" value={subscriptionToken} readOnly />
          <br />
          <input type="number" ref={contentIdInputRef} />
          <button onClick={() => {
            const currentInput = contentIdInputRef.current;

            if (currentInput === null || currentInput.value.length === 0)
              return;

            exviewer.newPlayer(parseInt(currentInput.value));
          }}>Play</button>
          <br />
          <button onClick={f1tv.logout}>Logout</button>
        </div>}
      
    </div>
  );
};

export default App;
