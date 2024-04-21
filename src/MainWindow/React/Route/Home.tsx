import { useRef } from 'react';
import { selectSubscriptionToken } from '../Reducer/SubscriptionToken';
import { useAppSelector } from '../Hook';
import styles from './Home.module.css';

const Home = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const subscriptionToken = useAppSelector(selectSubscriptionToken);

  return (
    <div className={styles["all-space"]}>
      {subscriptionToken !== null ? <>
        <input ref={inputRef} type="number" placeholder="Enter Content ID to view" />
        <button
          onClick={() => {
            if (inputRef.current) {
              const contentId = parseInt(inputRef.current.value);

              if (!isNaN(contentId)) {
                inputRef.current.value = '';
                exviewer.newPlayer(contentId);
              }
            }
          }}
        > Play Content </button>
      </> : <>
        <p> Please login to start watching content. </p>
        <button onClick={() => f1tv.login()}> Login </button>
      </>}
    </div>
  );
};

export default Home;
