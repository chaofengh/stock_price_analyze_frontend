import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Box } from '@mui/material';

function CalendarComponent({ value, onChange, tileContent }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 2, mb: 2 }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: '600px',
          '& .react-calendar': {
            fontSize: '1.2rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#fff',
            fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
          },
          '& .react-calendar__navigation': {
            marginBottom: '0.5rem',
            button: {
              minWidth: 'auto',
              background: 'transparent',
              color: '#1976d2',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
              },
            },
          },
          '& .react-calendar__month-view__weekdays': {
            fontWeight: 'bold',
            fontSize: '1rem',
            textAlign: 'center',
          },
          '& .react-calendar__tile': {
            padding: '1rem 0',
            height: '60px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#eee',
            },
          },
          '& .react-calendar__tile--now': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderRadius: '4px',
          },
          '& .react-calendar__tile--active': {
            backgroundColor: '#1976d2',
            color: '#fff',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#1976d2',
            },
          },
        }}
      >
        <Calendar
          onChange={onChange}
          value={value}
          view="month"
          minDetail="month"
          maxDetail="month"
          tileContent={tileContent}
        />
      </Box>
    </Box>
  );
}

export default CalendarComponent;
