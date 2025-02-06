import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { Line } from 'react-chartjs-2';

function StockChart({ summary, eventMap }) {
  const data = useMemo(() => {
    if (!summary || !summary.chart_data) return { datasets: [] };
    const dataPoints = summary.chart_data.map((pt) => ({
      x: pt.date,
      y: pt.close,
    }));
    return {
      datasets: [
        {
          label: 'Closing Price',
          data: dataPoints,
          tension: 0.3,
          borderWidth: 2,
          borderColor: '#1a1a1a',
          fill: false,
          pointRadius: 0,
        },
      ],
    };
  }, [summary]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#1a1a1a',
          bodyColor: '#1a1a1a',
          borderColor: '#e0e0e0',
          borderWidth: 1,
          borderRadius: 4,
          padding: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#1a1a1a', font: { size: 12 } },
        },
        y: {
          grid: { color: '#e0e0e0' },
          ticks: { color: '#1a1a1a', font: { size: 12 } },
        },
      },
    }),
    []
  );

  return (
    <Box sx={{ height: 300, mb: 3 }}>
      <Line data={data} options={chartOptions} />
    </Box>
  );
}

export default StockChart;
