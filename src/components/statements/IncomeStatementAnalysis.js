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
  ToggleButton,
  ToggleButtonGroup,
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
  // Default view set to quarterly
  const [viewType, setViewType] = useState('quarterly');
  const handleViewTypeChange = (event, newView) => {
    if (newView !== null) setViewType(newView);
  };

  // Sidebar Metrics
  const METRICS = [
    { key: 'totalRevenue', label: 'Revenue ($)', isPercentage: false },
    { key: 'grossProfit', label: 'Gross Profit ($)', isPercentage: false },
    { key: 'operatingExpenses', label: 'Operating Expenses ($)', isPercentage: false },
    { key: 'researchAndDevelopment', label: 'R&D ($)', isPercentage: false },
    { key: 'netIncome', label: 'Net Income ($)', isPercentage: false },
    { key: 'grossMargin', label: 'Gross Margin (%)', isPercentage: true },
    { key: 'netMargin', label: 'Net Margin (%)', isPercentage: true },

  ];
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const activeMetric = METRICS[activeMetricIndex];

  // Helpers for formatting
  const formatLargeNumber = (value) => {
    if (Math.abs(value) >= 1.0e9) return (value / 1.0e9).toFixed(1) + 'B';
    if (Math.abs(value) >= 1.0e6) return (value / 1.0e6).toFixed(1) + 'M';
    if (Math.abs(value) >= 1.0e3) return (value / 1.0e3).toFixed(1) + 'K';
    return value.toString();
  };
  const formatValue = (val) =>
    activeMetric.isPercentage ? val.toFixed(1) + '%' : formatLargeNumber(val);

  const getQuarter = (month) => {
    if (['01', '02', '03'].includes(month)) return 'Q1';
    if (['04', '05', '06'].includes(month)) return 'Q2';
    if (['07', '08', '09'].includes(month)) return 'Q3';
    return 'Q4';
  };

  // Memoized data
  const quarterlyReports = useMemo(
    () => incomeStatementData?.quarterlyReports || [],
    [incomeStatementData]
  );
  const annualReports = useMemo(
    () => incomeStatementData?.annualReports || [],
    [incomeStatementData]
  );

  // Build quarterly data array
  const quarterlyDataArray = useMemo(() => {
    const arr = quarterlyReports.map((r) => {
      const dateStr = r.fiscalDateEnding; // e.g. "2023-03-31"
      const [year, month] = dateStr.split('-');
      const quarter = getQuarter(month);

      const totalRev = Number(r.totalRevenue) || 0;
      const gross = Number(r.grossProfit) || 0;
      const net = Number(r.netIncome) || 0;
      const opEx = Number(r.operatingExpenses) || 0; // NEW
      const rAndD = Number(r.researchAndDevelopment) || 0; // NEW

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
        operatingExpenses: opEx,        // NEW
        researchAndDevelopment: rAndD,  // NEW
      };
    });

    // Sort by year then quarter order
    arr.sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      const order = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
      return order[a.quarter] - order[b.quarter];
    });
    return arr;
  }, [quarterlyReports]);

  // Build annual data array
  const annualDataArray = useMemo(() => {
    const arr = annualReports.map((r) => {
      const year = r.fiscalDateEnding.split('-')[0];

      const totalRev = Number(r.totalRevenue) || 0;
      const gross = Number(r.grossProfit) || 0;
      const net = Number(r.netIncome) || 0;
      const opEx = Number(r.operatingExpenses) || 0; // NEW
      const rAndD = Number(r.researchAndDevelopment) || 0; // NEW

      const grossMargin = totalRev ? (gross / totalRev) * 100 : 0;
      const netMargin = totalRev ? (net / totalRev) * 100 : 0;

      return {
        year,
        totalRevenue: totalRev,
        grossProfit: gross,
        netIncome: net,
        grossMargin,
        netMargin,
        operatingExpenses: opEx,        // NEW
        researchAndDevelopment: rAndD,  // NEW
      };
    });

    // Sort ascending by year and keep the last 8
    arr.sort((a, b) => a.year.localeCompare(b.year));
    return arr.slice(-8);
  }, [annualReports]);

  // Variables for chart and table data
  let chartData, chartOptions, tableRows;
  let sumOlder = 0,
    sumNewer = 0;

  // Handle "Quarterly" view
  if (viewType === 'quarterly') {
    if (!quarterlyDataArray.length) {
      return (
        <Paper sx={{ p: 3, m: 3 }}>
          <Typography variant="h6">
            No income statement quarterly data available
          </Typography>
        </Paper>
      );
    }

    // Split into older vs newer 4 quarters
    const olderGroup = quarterlyDataArray.slice(-8, -4);
    const newerGroup = quarterlyDataArray.slice(-4);

    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
    const olderMap = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    const newerMap = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

    olderGroup.forEach((item) => {
      olderMap[item.quarter] = item[activeMetric.key];
    });
    newerGroup.forEach((item) => {
      newerMap[item.quarter] = item[activeMetric.key];
    });

    sumOlder = olderGroup.reduce(
      (acc, item) => acc + (item[activeMetric.key] || 0),
      0
    );
    sumNewer = newerGroup.reduce(
      (acc, item) => acc + (item[activeMetric.key] || 0),
      0
    );

    chartData = {
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

    chartOptions = {
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

    // Prepare table rows
    tableRows = quarterOrder.map((q) => {
      const olderVal = olderMap[q];
      const newerVal = newerMap[q];
      const diff = newerVal - olderVal;
      const diffPct = olderVal ? (diff / olderVal) * 100 : 0;
      return { period: q, olderVal, newerVal, diff, diffPct };
    });
  }
  // Handle "Annual" view
  else {
    if (!annualDataArray.length) {
      return (
        <Paper sx={{ p: 3, m: 3 }}>
          <Typography variant="h6">
            No income statement annual data available
          </Typography>
        </Paper>
      );
    }

    const labelsAnnual = annualDataArray.map((item) => item.year);
    const datasetValuesAnnual = annualDataArray.map(
      (item) => item[activeMetric.key]
    );

    chartData = {
      labels: labelsAnnual,
      datasets: [
        {
          label: activeMetric.label,
          data: datasetValuesAnnual,
          backgroundColor: 'rgba(255, 159, 64, 0.8)',
        },
      ],
    };

    chartOptions = {
      responsive: true,
      plugins: {
        title: { display: true, text: `${activeMetric.label} Over Years` },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${formatValue(context.parsed.y)}`,
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

    // Prepare table rows
    tableRows = annualDataArray.map((item, index) => {
      const previousValue =
        index > 0 ? annualDataArray[index - 1][activeMetric.key] : null;
      const diff = previousValue !== null ? item[activeMetric.key] - previousValue : null;
      const diffPct =
        previousValue && previousValue !== 0 ? (diff / previousValue) * 100 : null;
      return { period: item.year, value: item[activeMetric.key], diff, diffPct };
    });
  }

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
        {/* View Toggle */}
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={handleViewTypeChange}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="quarterly">Quarterly</ToggleButton>
          <ToggleButton value="annual">Annual</ToggleButton>
        </ToggleButtonGroup>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {activeMetric.label}
          </Typography>
          <Bar data={chartData} options={chartOptions} />
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {viewType === 'quarterly'
              ? 'Quarter-by-Quarter Comparison'
              : 'Year-over-Year Comparison'}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    {viewType === 'quarterly' ? 'Quarter' : 'Year'}
                  </TableCell>
                  {viewType === 'quarterly' ? (
                    <>
                      <TableCell align="right">Older</TableCell>
                      <TableCell align="right">Latest</TableCell>
                      <TableCell align="right">Delta</TableCell>
                      <TableCell align="right">% Difference</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Change</TableCell>
                      <TableCell align="right">% Change</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {viewType === 'quarterly'
                  ? tableRows.map((row) => (
                      <TableRow key={row.period}>
                        <TableCell>{row.period}</TableCell>
                        {/* Bigger, bolder numeric cells */}
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {formatValue(row.olderVal)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {formatValue(row.newerVal)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {formatValue(row.diff)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {row.diffPct.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  : tableRows.map((row) => (
                      <TableRow key={row.period}>
                        <TableCell>{row.period}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {formatValue(row.value)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {row.diff !== null ? formatValue(row.diff) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {row.diffPct !== null ? row.diffPct.toFixed(1) + '%' : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                {viewType === 'quarterly' && (
                  <TableRow>
                    <TableCell>
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {formatValue(sumOlder)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {formatValue(sumNewer)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {formatValue(sumNewer - sumOlder)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {sumOlder === 0
                        ? 'N/A'
                        : (((sumNewer - sumOlder) / sumOlder) * 100).toFixed(1) + '%'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}

export default IncomeStatementAnalysis;
