// CalendarComponent.js
import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Box } from '@mui/material';

function CalendarComponent({ value, onChange, tileContent }) {
  return (
    <Box
      sx={{
        margin: '0 auto', // Center the calendar container
        mt: 2,
        mb: 2,
        maxWidth: '700px', // Constrain the maximum width
      }}
    >
      <Box
        sx={{
          '& .react-calendar': {
            fontSize: '1rem', // Slightly smaller base font-size
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '0.5rem', // Reduced overall padding
            backgroundColor: '#fff',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            width: '100%', // Full width of the container
            height: 'auto', // Allow height to adjust based on content
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
            padding: '0.6rem 0.3rem', // Reduced padding on tiles
            minHeight: 'auto',         // Remove the fixed minimum height
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#eee',
            },
            whiteSpace: 'nowrap',      // Prevent text from wrapping unexpectedly
          },
          '& .react-calendar__tile--now': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderRadius: '4px',
          },
          '& .react-calendar__tile--active': {
            // Instead of changing the full background, we now use a border highlight
            backgroundColor: 'transparent',
            color: '#1976d2', // Use the selected color for the text as well
            border: '2px solid #1976d2',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'transparent',
              border: '2px solid #1976d2',
            },
          },
        }}
      >
        <Calendar onChange={onChange} value={value} tileContent={tileContent} />
      </Box>
    </Box>
  );
}

export default CalendarComponent;
