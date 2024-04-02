/*
  eXViewer - Unofficial live timing and content streaming client for F1TV
  Copyright (C) 2024  eXhumer

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
