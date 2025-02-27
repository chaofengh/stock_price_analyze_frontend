import React, { createContext, useState, useEffect } from 'react';

export const AlertsContext = createContext();

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [timestamp, setTimestamp] = useState(null);

  useEffect(() => {
    const eventSource = new EventSource('http://127.0.0.1:5000/api/alerts/stream');
    
    eventSource.onmessage = (event) => {
      // Parse the SSE data (string => JSON)
      const data = JSON.parse(event.data);
      if (data && data.alerts) {
        setAlerts(data.alerts);
        setTimestamp(data.timestamp);
        console.log('Received new alerts:', data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Clears the current alerts (Mark as Read)
  const clearAlerts = () => {
    setAlerts([]);
  };

  return (
    <AlertsContext.Provider value={{ alerts, timestamp, clearAlerts }}>
      {children}
    </AlertsContext.Provider>
  );
};