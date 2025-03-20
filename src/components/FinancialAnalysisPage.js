import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function FinancialAnalysisPage() {
  const location = useLocation();
  const { income_statement } = location.state || {};

  // 1) Always call your hooks
  const quarterlyReports = useMemo(() => {
    return income_statement?.quarterlyReports || [];
  }, [income_statement]);

  // Sort out how you'd handle no data. 
  // For example, let's create an empty array if there's no data:
  const hasData = quarterlyReports.length > 0;

  // Define other hooks or states
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);

  // Example transform
  const quarterlyDataArray = useMemo(() => {
    return quarterlyReports.map((r) => {
      const dateStr = r.fiscalDateEnding;
      const [year, month] = dateStr.split('-');
      let quarter = '';
      if (['01', '02', '03'].includes(month)) quarter = 'Q1';
      else if (['04', '05', '06'].includes(month)) quarter = 'Q2';
      else if (['07', '08', '09'].includes(month)) quarter = 'Q3';
      else quarter = 'Q4';

      const totalRev = Number(r.totalRevenue) || 0;
      const gross = Number(r.grossProfit) || 0;
      const net = Number(r.netIncome) || 0;

      return {
        yearQuarter: `${year}-${quarter}`,
        totalRevenue: totalRev,
        grossProfit: gross,
        netIncome: net,
        grossMargin: totalRev ? (gross / totalRev) * 100 : 0,
        netMargin: totalRev ? (net / totalRev) * 100 : 0,
      };
    });
  }, [quarterlyReports]);

  quarterlyDataArray.sort((a, b) => (a.yearQuarter > b.yearQuarter ? 1 : -1));

  // Some example metrics
  const METRICS = [
    { key: 'totalRevenue', label: 'Revenue ($)', isPercentage: false },
    { key: 'grossProfit', label: 'Gross Profit ($)', isPercentage: false },
    { key: 'netIncome', label: 'Net Income ($)', isPercentage: false },
    { key: 'grossMargin', label: 'Gross Margin (%)', isPercentage: true },
    { key: 'netMargin', label: 'Net Margin (%)', isPercentage: true },
  ];

  const activeMetric = METRICS[activeMetricIndex];

  // 2) Build the chart data
  const chartData = useMemo(() => {
    const labels = quarterlyDataArray.map((d) => d.yearQuarter);
    const dataVals = quarterlyDataArray.map((d) => d[activeMetric.key] || 0);

    return {
      labels,
      datasets: [
        {
          label: activeMetric.label,
          data: dataVals,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
        },
      ],
    };
  }, [quarterlyDataArray, activeMetric]);

  const formatLargeNumber = (value) => {
    if (Math.abs(value) >= 1.0e9) {
      return (value / 1.0e9).toFixed(1) + 'B';
    }
    if (Math.abs(value) >= 1.0e6) {
      return (value / 1.0e6).toFixed(1) + 'M';
    }
    if (Math.abs(value) >= 1.0e3) {
      return (value / 1.0e3).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `${activeMetric.label} by Quarter`,
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const rawVal = context.parsed.y || 0;

            // For yoy difference, you'd do something similar
            // as before. For brevity, let's just display the raw val:
            if (activeMetric.isPercentage) {
              return rawVal.toFixed(1) + '%';
            }
            return formatLargeNumber(rawVal);
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            if (activeMetric.isPercentage) {
              return value + '%';
            }
            return formatLargeNumber(value);
          },
        },
      },
    },
  };

  // 3) Now you can do a conditional render AFTER all hooks are defined
  if (!hasData) {
    return (
      <Paper sx={{ p: 3, m: 3 }}>
        <Typography variant="h6">No data available</Typography>
      </Paper>
    );
  }

  // 4) Otherwise, render your main UI
  return (
    <Box sx={{ display: 'flex', height: '100%', p: 1 }}>
      {/* Sidebar */}
      <Paper elevation={3} sx={{ minWidth: 220, mr: 2 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Metrics
        </Typography>
        <Divider />
        {METRICS.map((m, idx) => (
          <ListItemButton
            key={m.key}
            selected={idx === activeMetricIndex}
            onClick={() => setActiveMetricIndex(idx)}
          >
            <ListItemText primary={m.label} />
          </ListItemButton>
        ))}
      </Paper>

      {/* Main Content: Chart */}
      <Box sx={{ flex: 1 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {activeMetric.label}
          </Typography>
          <Bar data={chartData} options={chartOptions} />
        </Paper>
      </Box>
    </Box>
  );
}

export default FinancialAnalysisPage;
