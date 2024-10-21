import { useRef } from 'react';
import { useAppSelector } from '../Hook';

const LoggedInView = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const config = useAppSelector(state => state.f1tv.config);
  const location = useAppSelector(state => state.f1tv.location);
  const isReady = config !== null && location !== null;

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
            }
          }}
        > Play Content </button>
      </form>
      <button onClick={() => f1tv.logout()}>Logout</button>
    </>
  );
};

export default LoggedInView;
