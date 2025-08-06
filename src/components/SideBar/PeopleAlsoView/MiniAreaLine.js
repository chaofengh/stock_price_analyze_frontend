import React from 'react';
import { alpha } from '@mui/material';
import { AreaChart, Area, Line, YAxis } from 'recharts';

/**
 * Tiny area-line sparkline for peer rows
 *
 * @param {Array<{v:number}>} data – Each item needs a .v property (price)
 * @param {string} color – Base stroke / gradient colour (theme-aware)
 */
const MiniAreaLine = ({ data = [], color }) => {
  const vals   = data.map((d) => d.v);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  const pad    = rawMax === rawMin ? Math.abs(rawMax) * 0.01 || 0.01 : 0;
  const domain = [rawMin - pad, rawMax + pad];

  return (
    <AreaChart width={80} height={36} data={data}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={alpha(color, 1)} />
          <stop offset="100%" stopColor={alpha(color, 0)} />
        </linearGradient>
      </defs>

      <YAxis type="number" domain={domain} hide />

      <Area
        type="monotone"
        dataKey="v"
        fill={`url(#grad-${color})`}
        stroke="none"
        dot={false}
        isAnimationActive={false}
      />

      <Line
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
      />
    </AreaChart>
  );
};

export default MiniAreaLine;
