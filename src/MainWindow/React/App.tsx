import { useEffect, useRef, useState } from "react";

const App = () => {
  const [subscriptionToken, setSubscriptionToken] = useState<string | null>(null);
  const contentIdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    f1tv.location()
      .then(location => console.log("a", location));

    f1tv.whenLocationReady()
      .then(async () => await f1tv.location())
      .then(location => console.log("b", location));

    f1tv.onSubscriptionToken((e, ascendon) => {
      setSubscriptionToken(ascendon);
      console.log(ascendon);
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
          <input type="text" ref={contentIdInputRef} />
          <button onClick={() => {
            const currentInput = contentIdInputRef.current;
            if (currentInput === null)
              return;
            console.log(currentInput.value);
          }}>Play</button>
          <br />
          <button onClick={f1tv.logout}>Logout</button>
        </div>}
      
    </div>
  );
};

export default App;
