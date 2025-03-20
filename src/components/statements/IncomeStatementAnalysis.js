// src/components/statements/IncomeStatementAnalysis.js
import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function IncomeStatementAnalysis({ incomeStatementData }) {
  // ---------------------------
  // 1) Hooks & Data Access
  // ---------------------------
  const quarterlyReports = useMemo(() => {
    return incomeStatementData?.quarterlyReports || [];
  }, [incomeStatementData]);

  const [activeMetricIndex, setActiveMetricIndex] = useState(0);

  // Metrics for the sidebar
  const METRICS = [
    { key: 'totalRevenue', label: 'Revenue ($)', isPercentage: false },
    { key: 'grossProfit', label: 'Gross Profit ($)', isPercentage: false },
    { key: 'netIncome', label: 'Net Income ($)', isPercentage: false },
    { key: 'grossMargin', label: 'Gross Margin (%)', isPercentage: true },
    { key: 'netMargin', label: 'Net Margin (%)', isPercentage: true },
  ];
  const activeMetric = METRICS[activeMetricIndex];

  // ---------------------------
  // 2) Data Preparation
  // ---------------------------
  const getQuarter = (month) => {
    if (['01', '02', '03'].includes(month)) return 'Q1';
    if (['04', '05', '06'].includes(month)) return 'Q2';
    if (['07', '08', '09'].includes(month)) return 'Q3';
    return 'Q4';
  };

  // Transform raw data -> array of sorted objects
  const quarterlyDataArray = useMemo(() => {
    const arr = quarterlyReports.map((r) => {
      const dateStr = r.fiscalDateEnding; // e.g. "2023-03-31"
      const [year, month] = dateStr.split('-');
      const quarter = getQuarter(month);

      const totalRev = Number(r.totalRevenue) || 0;
      const gross = Number(r.grossProfit) || 0;
      const net = Number(r.netIncome) || 0;
      const grossMargin = totalRev ? (gross / totalRev) * 100 : 0;
      const netMargin = totalRev ? (net / totalRev) * 100 : 0;

      return {
        year,
        quarter,
        totalRevenue: totalRev,
        grossProfit: gross,
        netIncome: net,
        grossMargin,
        netMargin,
      };
    });

    // Sort by year, then Q1 < Q2 < Q3 < Q4
    arr.sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      const order = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
      return order[a.quarter] - order[b.quarter];
    });
    return arr;
  }, [quarterlyReports]);

  // If no data, show fallback
  if (!quarterlyDataArray.length) {
    return (
      <Paper sx={{ p: 3, m: 3 }}>
        <Typography variant="h6">No income statement data available</Typography>
      </Paper>
    );
  }

  // Split into older 4 vs. latest 4
  const olderGroup = quarterlyDataArray.slice(-8, -4);
  const newerGroup = quarterlyDataArray.slice(-4);

  // We want to line up Q1..Q4 side-by-side
  const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
  const olderMap = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  const newerMap = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

  olderGroup.forEach((item) => {
    olderMap[item.quarter] = item[activeMetric.key];
  });
  newerGroup.forEach((item) => {
    newerMap[item.quarter] = item[activeMetric.key];
  });

  // Sums for each group
  const sumOlder = olderGroup.reduce((acc, item) => acc + (item[activeMetric.key] || 0), 0);
  const sumNewer = newerGroup.reduce((acc, item) => acc + (item[activeMetric.key] || 0), 0);

  // ---------------------------
  // 3) Format Helpers
  // ---------------------------
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

  const formatValue = (val) => {
    if (activeMetric.isPercentage) {
      return val.toFixed(1) + '%';
    }
    return formatLargeNumber(val);
  };

  // ---------------------------
  // 4) Chart Data
  // ---------------------------
  const chartData = {
    labels: quarterOrder,
    datasets: [
      {
        label: `4 Quarters Prior`,
        data: quarterOrder.map((q) => olderMap[q]),
        backgroundColor: 'rgba(128, 128, 128, 0.2)',
      },
      {
        label: `Latest 4 Quarters`,
        data: quarterOrder.map((q) => newerMap[q]),
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `${activeMetric.label} by Quarter`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const rawVal = context.parsed.y || 0;
            return `${context.dataset.label}: ${formatValue(rawVal)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatValue(value),
        },
      },
    },
  };

  // ---------------------------
  // 5) Table Data
  // ---------------------------
  const tableRows = quarterOrder.map((q) => {
    const olderVal = olderMap[q];
    const newerVal = newerMap[q];
    const diff = newerVal - olderVal;
    const diffPct = olderVal ? (diff / olderVal) * 100 : 0;
    return { quarter: q, olderVal, newerVal, diff, diffPct };
  });

  // ---------------------------
  // 6) Render
  // ---------------------------
  return (
    <Box sx={{ display: 'flex', height: '100%', p: 1 }}>
      {/* Sidebar with Metrics */}
      <Paper elevation={3} sx={{ minWidth: 220, mr: 2 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Metrics
        </Typography>
        <Divider />
        <List>
          {METRICS.map((m, idx) => (
            <ListItemButton
              key={m.key}
              selected={idx === activeMetricIndex}
              onClick={() => setActiveMetricIndex(idx)}
            >
              <ListItemText primary={m.label} />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {activeMetric.label}
          </Typography>
          <Bar data={chartData} options={chartOptions} />
        </Paper>

        {/* Delta Table */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quarter-by-Quarter Comparison
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Quarter</TableCell>
                  <TableCell align="right">Older</TableCell>
                  <TableCell align="right">Latest</TableCell>
                  <TableCell align="right">Delta</TableCell>
                  <TableCell align="right">% Difference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow key={row.quarter}>
                    <TableCell>{row.quarter}</TableCell>
                    <TableCell align="right">{formatValue(row.olderVal)}</TableCell>
                    <TableCell align="right">{formatValue(row.newerVal)}</TableCell>
                    <TableCell align="right">{formatValue(row.diff)}</TableCell>
                    <TableCell align="right">{row.diffPct.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}

                {/* Total Row */}
                <TableRow>
                  <TableCell>
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{formatValue(sumOlder)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{formatValue(sumNewer)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{formatValue(sumNewer - sumOlder)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>
                      {sumOlder === 0
                        ? 'N/A'
                        : (((sumNewer - sumOlder) / sumOlder) * 100).toFixed(1) + '%'}
                    </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}

export default IncomeStatementAnalysis;
