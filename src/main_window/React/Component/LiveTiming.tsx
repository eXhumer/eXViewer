import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { useEffect, useState } from "react";

import { deepMerge } from '../../../utils';

import styles from './LiveTiming.module.scss';

const LiveTiming = () => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [current, setCurrent] = useState<Record<string, unknown> | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState<string>('');

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
        return;
      }

      console.log('Connection closed', newConnection.connectionId, newConnection.state);
    });

    newConnection.onreconnected(connId => {
      console.log('Reconnected to the server!', connId);
    });

    newConnection.onreconnecting(err => {
      if (err) {
        console.error('Reconnecting to the server failed:', err);
        return;
      }

      console.log('Reconnecting to the server', newConnection.connectionId, newConnection.state);
    });

    newConnection
      .start()
      .then(() => {
        console.log('Connection ID', newConnection.connectionId, newConnection.state);
        setConnection(newConnection);
        setCurrent(null);
      })
      .catch(err => {
        console.error('Failed to start connection:', err);
        setConnection(null);
        setCurrent(null);
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
          setCurrent(null);
        });
    };
  }, []);

  useEffect(() => {
    if (connection && connection.state === HubConnectionState.Connected) {
      const onFeed = (topic: string, update: unknown, timestamp: string) => {
        console.log('feed', topic, update, timestamp);
        setCurrent(prev => deepMerge(prev, { [topic]: update }));
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
            if (!prev)
              return null;

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
          console.log('Subscribed', subscribed);

          setCurrent(prev => ({ ...prev, ...subscribed }));
        });
    }
  }, [connection, topics]);

  const handleAddTopic = () => {
    if (newTopic && !topics.includes(newTopic)) {
      setTopics(prev => [...prev, newTopic]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(prev => prev.filter(topic => topic !== topicToRemove));
  };

  return (
    <div className={`${styles['container']} ${styles['padding']}`}>
      <h2>Live Timing</h2>
      <p>Connection Status: {!connection ? 'Not Connected' : connection.state}</p>
      
      <div>
        <input 
          type="text" 
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="Enter topic name"
        />
        <button onClick={handleAddTopic}>Add Topic</button>
      </div>

      <div>
        <h3>Active Topics:</h3>
        {topics.map(topic => (
          <div key={topic}>
            {topic}
            <button onClick={() => handleRemoveTopic(topic)}>Remove</button>
          </div>
        ))}
      </div>

      <div>
        <h3>Current Data:</h3>
        <pre>{JSON.stringify(current, undefined, 2)}</pre>
      </div>
    </div>
  );
};

export default LiveTiming;
