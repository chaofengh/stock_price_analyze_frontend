import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Box } from '@mui/material';

function CalendarComponent({ value, onChange, tileContent, height = 450 }) {
  return (
    <Box
      sx={{
        margin: '0 auto', // Center the calendar container
        mt: 2,
        mb: 2,
        width: '100%',
        height, // Set fixed height (default is 450px)
      }}
    >
      <Box
        sx={{
          '& .react-calendar': {
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '0.5rem',
            backgroundColor: '#fff',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            width: '100%',
            height: '100%', // Fill the parent container’s height
          },
          '& .react-calendar__navigation': {
            marginBottom: '1rem',
            button: {
              minWidth: 'auto',
              background: 'transparent',
              color: '#1976d2',
              fontSize: '1rem',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
              },
            },
          },
          '& .react-calendar__month-view__weekdays': {
            fontWeight: 'bold',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: '0.3rem',
          },
          '& .react-calendar__tile': {
            padding: '0.6rem 0.3rem',
            minHeight: 'auto',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#eee',
            },
            whiteSpace: 'nowrap',
          },
          '& .react-calendar__tile--now': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderRadius: '4px',
          },
          '& .react-calendar__tile--active': {
            backgroundColor: 'transparent',
            color: '#1976d2',
            border: '2px solid #1976d2',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'transparent',
              border: '2px solid #1976d2',
            },
          },
          '& .react-calendar__tile:focus': {
            backgroundColor: 'transparent',
          },
          '& .react-calendar__tile--active:focus': {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Calendar onChange={onChange} value={value} tileContent={tileContent} />
      </Box>
    </Box>
  );
}

export default CalendarComponent;
