import { useRef } from 'react';

import { useAppSelector } from '../Hook';
import { F1TVPlatform } from '../Type';

import styles from './ContentPlayForm.module.scss';

const ContentPlayForm = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const platformRef = useRef<HTMLSelectElement>(null);

  const config = useAppSelector(state => state.f1tv.config);
  const location = useAppSelector(state => state.f1tv.location);
  const isReady = config !== null && location !== null;

  return (
    <div className={`${styles['container']} ${styles['padding']}`}>
      <h2>F1TV Status: {isReady ? 'Ready' : 'Initializing'}!</h2>
      <form className={styles['container']}>
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
        <select
          ref={platformRef}
          defaultValue={F1TVPlatform.WEB_DASH}
          disabled={!isReady}
        >
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
    </div>
  );
};

export default ContentPlayForm;
