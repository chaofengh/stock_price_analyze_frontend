import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Box, Tooltip, Typography } from '@mui/material';

/* ───────────────────────────────────────── helpers ───────────────────────────────────────── */

const getHeatColor = (pnl, maxAbs) => {
  if (!maxAbs) return '#eee';
  const ratio = Math.min(Math.abs(pnl) / maxAbs, 1);   // 0‒1
  const hue   = pnl >= 0 ? 120 : 0;                    // green → red
  const light = 90 - ratio * 40;                       // 90 % (pale) → 50 % (vivid)
  return `hsl(${hue}, 60%, ${light}%)`;
};

/* ───────────────────────────────────────── component ─────────────────────────────────────── */

export default function CalendarComponent({
  value,
  onChange,
  heatMapData = {},            // { 'yyyy-mm-dd': pnl, … }
  height = 450
}) {
  const maxAbs = Math.max(1, ...Object.values(heatMapData).map(v => Math.abs(v)));

  return (
    <Box sx={{ mx: 'auto', width: '100%', height }}>
      <Box
        sx={{
          '& .react-calendar': {
            width: '100%',
            height: '100%',
            borderRadius: 2,
            p: 0.5,
            border: '1px solid #ccc',
            fontFamily: 'inherit'
          },
          '& .react-calendar__tile--now': { fontWeight: 'bold' }
        }}
      >
        <Calendar
          value={value}
          onChange={onChange}
          tileContent={({ date, view }) => {
            if (view !== 'month') return null;
            const key = date.toISOString().slice(0, 10);
            const pnl = heatMapData[key];
            const bg  = pnl !== undefined ? getHeatColor(pnl, maxAbs) : 'transparent';

            return (
              <Tooltip title={pnl !== undefined ? `PNL ${pnl.toFixed(2)}` : ''}>
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 1,
                    backgroundColor: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {pnl !== undefined && (
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                      {pnl.toFixed(0)}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            );
          }}
        />
      </Box>
    </Box>
  );
}
