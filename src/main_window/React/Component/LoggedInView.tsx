import { useRef } from 'react';
import { useAppSelector } from '../Hook';
import { F1TVPlatform } from '../Type';

const LoggedInView = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const config = useAppSelector(state => state.f1tv.config);
  const location = useAppSelector(state => state.f1tv.location);
  const isReady = config !== null && location !== null;
  const platformRef = useRef<HTMLSelectElement>(null);

  return (
    <>
      <form>
        <input
          disabled={!isReady}
          ref={inputRef}
          type='text'
          placeholder='Enter Content ID to view'
          onChange={e => {
            // remove non digit characters
            e.target.value = e.target.value.replace(/\D/g, '');
          }}
        />
        <select ref={platformRef} defaultValue={F1TVPlatform.WEB_DASH}>
          {Object
            .values(F1TVPlatform)
            .map(val => (
              <option
                key={val}
                value={val}
              >{val}</option>
            ))}
        </select>
        <button
          disabled={!isReady}
          type='submit'
          onClick={e => {
            e.preventDefault();

            if (inputRef.current) {
              const contentId = parseInt(inputRef.current.value);

              if (!isNaN(contentId)) {
                inputRef.current.value = '';
              }

              mainWindow.newPlayer(contentId, platformRef.current.value);
            }
          }}
        > Play Content </button>
      </form>
      <button onClick={() => f1tv.logout()}>Logout</button>
    </>
  );
};

export default LoggedInView;
