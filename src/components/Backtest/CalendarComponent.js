import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Box, Tooltip } from '@mui/material';

/**
 * Returns both HSL color string and its lightness percentage.
 */
function getHeatColor(pnl, maxAbs) {
  if (maxAbs <= 0) return { color: '#eee', light: 90 };
  const ratio = Math.min(Math.abs(pnl) / maxAbs, 1);   // 0–1
  const hue   = pnl >= 0 ? 120 : 0;                    // green or red
  const light = 90 - ratio * 40;                       // 90% → 50%
  return {
    color: `hsl(${hue}, 60%, ${light}%)`,
    light
  };
}

export default function CalendarComponent({
  value,
  onChange,
  heatMapData = {},          // { 'yyyy-mm-dd': pnl, … }
  height = 450
}) {
  // ensure we never divide by zero
  const maxAbs = Math.max(1, ...Object.values(heatMapData).map(v => Math.abs(v)));

  return (
    <Box sx={{ mx: 'auto', width: '100%', height }}>
      <Box
        sx={{
          '& .react-calendar': {
            width: '100%',
            height: '100%',
            borderRadius: 2,
            p: 1,
            border: '1px solid #ccc',
            fontFamily: 'inherit'
          },
          '& .react-calendar__tile--now': {
            fontWeight: 700,
            // border: '1px solid #888'
          }
        }}
      >
        <Calendar
          calendarType="gregory"
          value={value}
          onChange={onChange}
          tileContent={({ date, view }) => {
            if (view !== 'month') return null;
            const key = date.toISOString().slice(0, 10);
            const pnl = heatMapData[key];
            const { color: bg, light } = pnl != null
              ? getHeatColor(pnl, maxAbs)
              : { color: 'transparent', light: 90 };
            // pick white text on darker tiles
            const textColor = light < 60 ? '#fff' : '#000';

            return (
              <Tooltip title={pnl != null ? `PNL ${pnl.toFixed(2)}` : ''}>
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: bg,
                    color: textColor,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  {pnl != null ? pnl.toFixed(0) : ''}
                </Box>
              </Tooltip>
            );
          }}
        />
      </Box>
    </Box>
  );
}
