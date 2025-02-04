// StockChart.js
import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import 'chart.js/auto';
import { Line } from 'react-chartjs-2';

function StockChart({ summary, eventMap }) {
  const data = useMemo(() => {
    if (!summary || !summary.chart_data) {
      return { datasets: [] };
    }
    const dataPoints = summary.chart_data.map((pt) => ({
      x: pt.date,
      y: pt.close,
    }));
    return {
      datasets: [
        {
          label: '',
          data: dataPoints,
          tension: 0.3,
          borderWidth: 2,
          borderColor: '#1976d2',
          fill: false,
          pointRadius: 0,
        },
      ],
    };
  }, [summary]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(25, 118, 210, 0.9)',
          titleFont: { size: 14 },
          bodyFont: { size: 12 },
          borderColor: '#fff',
          borderWidth: 1,
          borderRadius: 4,
          padding: 8,
          callbacks: {
            label: (context) => {
              const dateStr = context.raw.x;
              const events = eventMap?.[dateStr];
              if (!events || events.length === 0) {
                return `Price: ${context.parsed.y}`;
              }
              return events.map((ev) => {
                switch (ev.type) {
                  case 'upper_touch_pullback':
                    return `Upper Touch Pullback: drop=$${ev.drop_dollars.toFixed(2)} in ${ev.trading_days} days`;
                  case 'lower_touch_bounce':
                    return `Lower Touch Bounce: bounce=$${ev.bounce_dollars.toFixed(2)} in ${ev.trading_days} days`;
                  case 'upper_hug_pullback':
                    return `Upper Hug Pullback: drop=$${ev.drop_dollars.toFixed(2)} in ${ev.trading_days} days`;
                  case 'lower_hug_bounce':
                    return `Lower Hug Bounce: bounce=$${ev.bounce_dollars.toFixed(2)} in ${ev.trading_days} days`;
                  default:
                    return 'Unknown event';
                }
              });
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { display: false },
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.1)' },
          ticks: {
            color: '#777',
            font: { size: 12 },
          },
        },
      },
    };
  }, [eventMap]);

  if (!summary) return null;

  return (
    <Box sx={{ height: 300, mb: 2 }}>
      <Line data={data} options={chartOptions} />
    </Box>
  );
}

export default StockChart;
