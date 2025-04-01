import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Box } from '@mui/material';

function CalendarComponent({ value, onChange, tileContent }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 1, mb: 2 }}>
      <Box sx={{ width: '80%', fontSize: '2rem' }}>
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
