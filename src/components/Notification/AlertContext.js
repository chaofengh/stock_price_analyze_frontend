// AlertsProvider.js
import React, { createContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

export const AlertsContext = createContext();

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const stock_summary_api_key = process.env.REACT_APP_summary_root_api;
  
  // Retrieve the user from Redux (assumes you store user info there)
  const user = useSelector((state) => state.auth.user);
  const userId = user ? user.id : null;

  useEffect(() => {
    // Build the stream endpoint, appending user_id if available.
    let endpoint = `${stock_summary_api_key}/alerts/stream`;
    if (userId) {
      endpoint += `?user_id=${userId}`;
    }
    const eventSource = new EventSource(endpoint);
    
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
  }, [stock_summary_api_key, userId]);

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
