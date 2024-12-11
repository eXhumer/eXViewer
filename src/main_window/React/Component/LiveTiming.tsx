import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import React, { useEffect, useRef, useState } from 'react';

import { deepMerge } from '../../../utils';

import styles from './LiveTiming.module.scss';

const LiveTiming = () => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [current, setCurrent] = useState<Record<string, unknown>>({});
  const [topics, setTopics] = useState<string[]>([]);

  const topicRef = useRef<HTMLInputElement>();

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('https://livetiming.formula1.com/signalrcore', {
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Debug)
      .build();

    newConnection.onclose(async (err) => {
      if (err) {
        console.error('Connection closed with error:', err);
      } else {
        console.log('Connection closed', newConnection.connectionId, newConnection.state);
      }
    });

    newConnection.onreconnected(connId => {
      console.log('Reconnected to the server!', connId);
    });

    newConnection.onreconnecting(err => {
      if (err) {
        console.error('Reconnecting to the server failed:', err);
      } else {
        console.log('Reconnecting to the server', newConnection.connectionId, newConnection.state);
      }
    });

    newConnection
      .start()
      .then(() => {
        console.log('Connection ID', newConnection.connectionId, newConnection.state);
        setConnection(newConnection);
        setCurrent({});
      })
      .catch(err => {
        console.error('Failed to start connection:', err);
        setConnection(null);
        setCurrent({});
      });

    return () => {
      console.log('Stopping connection', newConnection.connectionId);

      newConnection
        .stop()
        .catch(err => {
          console.error('Failed to stop connection:', err);
        })
        .finally(() => {
          setConnection(null);
          setCurrent({});
        });
    };
  }, []);

  useEffect(() => {
    if (connection && connection.state === HubConnectionState.Connected) {
      const onFeed = (topic: string, update: Record<string, unknown>, timestamp: string) => {
        console.log('feed', topic, update, timestamp);

        // delete _kf from update if it exists
        if ('_kf' in update)
          delete update['_kf'];

        setCurrent(prev => {
          if (prev[topic] === undefined)
            return { ...prev, [topic]: update };

          return deepMerge(prev, { [topic]: update });
        });
      };

      connection.on('feed', onFeed);

      return () => {
        connection.off('feed', onFeed);
      };
    }
  }, [connection]);

  useEffect(() => {
    if (!connection)
      return;

    const currentTopics = Object.keys(current || {});
    const toSubscribe = topics.filter(topic => !currentTopics.includes(topic));
    const toUnsubscribe = currentTopics.filter(topic => !topics.includes(topic));

    if (toUnsubscribe.length > 0) {
      connection
        .invoke('Unsubscribe', toUnsubscribe)
        .then(() => {
          console.log('Unsubscribed', toUnsubscribe);

          setCurrent(prev => {
            const next = { ...prev };
            toUnsubscribe.forEach(topic => delete next[topic]);
            return next;
          });
        });
    }

    if (toSubscribe.length > 0) {
      connection
        .invoke('Subscribe', toSubscribe)
        .then(subscribed => {
          for (const topic in subscribed)
            if ('_kf' in subscribed[topic])
              delete subscribed[topic]['_kf'];

          console.log('Subscribed', subscribed);

          setCurrent(prev => ({ ...prev, ...subscribed }));
        });
    }
  }, [connection, topics]);

  useEffect(() => {
    console.log('Current changed', current);
  }, [current]);

  const handleAddTopic = () => {
    if (!topicRef.current)
      return;

    const topicToAdd = topicRef.current.value;

    if (!topicToAdd || topics.includes(topicToAdd))
      return;

    setTopics(prev => [...prev, topicToAdd]);
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(prev => prev.filter(topic => topic !== topicToRemove));
  };

  const handleSubmitTopic = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    handleAddTopic();

    topicRef.current.value = '';
  };

  return (
    <div className={`${styles['container']} ${styles['padding']}`}>
      <h2>Live Timing</h2>
      <p>Connection Status: {!connection ? 'Not Connected' : connection.state}</p>

      {connection && connection.state === HubConnectionState.Connected && (
        <>
          <form className={`${styles['container']}`}>
            <input 
              type='text'
              ref={topicRef}
              placeholder='Enter topic name'
            />
            <button
              onClick={handleSubmitTopic}
              type='submit'
            >Add Topic</button>
          </form>
          <div className={`${styles['container']}`}>
            <h3>Active Topics:</h3>
            {topics.map(topic => (
              <div key={topic}>
                {topic}
                <button onClick={() => handleRemoveTopic(topic)}>Remove</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LiveTiming;
