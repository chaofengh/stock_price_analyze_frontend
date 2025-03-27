import React, { createContext, useState, useEffect } from 'react';

export const AlertsContext = createContext();

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const stock_summary_api_key = process.env.REACT_APP_summary_root_api;

  useEffect(() => {
    const eventSource = new EventSource(`${stock_summary_api_key}/alerts/stream`);
    
    eventSource.onmessage = (event) => {
      // Parse the SSE data (string => JSON)
      const data = JSON.parse(event.data);
      if (data && data.alerts) {
        setAlerts(data.alerts);
        setTimestamp(data.timestamp);
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