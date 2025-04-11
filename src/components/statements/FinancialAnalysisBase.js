// FinancialAnalysisBase.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
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
import { useDispatch, useSelector } from 'react-redux';

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

function FinancialAnalysisBase({
  symbol,
  // Redux-specific props
  fetchDataThunk,                // e.g. fetchBalanceSheet or fetchCashFlow
  selectDataFromStore,           // how to get the statement data from Redux
  selectLoadingFromStore,        // how to get the loading boolean
  selectErrorFromStore,          // how to get the error string
  // Statement-specific logic
  processAnnualReports,          // function(annualReports[]) => processed array
  processQuarterlyReports,       // function(quarterlyReports[]) => processed array
  // Display props
  metrics,                       // array of { key, label, isPercentage }
  chartColor,                    // main color for the chart bars
  sidebarTitle = 'Metrics',      // optional label for the left sidebar
}) {
  const dispatch = useDispatch();

  // Grab data, loading, error from the store:
  const statementData = useSelector(selectDataFromStore);
  const loading = useSelector(selectLoadingFromStore);
  const error = useSelector(selectErrorFromStore);

  // State for which metric & view (annual/quarterly)
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const [viewType, setViewType] = useState('quarterly');

  useEffect(() => {
    if (symbol && !statementData) {
      // If we have a symbol and no data, fetch it
      dispatch(fetchDataThunk(symbol));
    }
  }, [symbol, dispatch, fetchDataThunk,statementData]);

  const activeMetric = metrics[activeMetricIndex];

  // Helpers for formatting
  const formatLargeNumber = (value) => {
    if (Math.abs(value) >= 1.0e9) return (value / 1.0e9).toFixed(1) + 'B';
    if (Math.abs(value) >= 1.0e6) return (value / 1.0e6).toFixed(1) + 'M';
    if (Math.abs(value) >= 1.0e3) return (value / 1.0e3).toFixed(1) + 'K';
    return value.toString();
  };
  const formatValue = (val) =>
    activeMetric.isPercentage ? val.toFixed(1) + '%' : formatLargeNumber(val);

  // Pull arrays from the data
  const annualReports = useMemo(
    () => statementData?.annualReports || [],
    [statementData]
  );
  const quarterlyReports = useMemo(
    () => statementData?.quarterlyReports || [],
    [statementData]
  );

  // Statement-specific processing
  const processedAnnual = useMemo(
    () => processAnnualReports(annualReports),
    [annualReports, processAnnualReports]
  );
  const processedQuarterly = useMemo(
    () => processQuarterlyReports(quarterlyReports),
    [quarterlyReports, processQuarterlyReports]
  );

  // Handle loading/error/no-data states
  if (!symbol) {
    return (
      <Paper sx={{ p: 3, m: 3 }}>
        <Typography variant="h6">No symbol provided</Typography>
      </Paper>
    );
  }
  if (loading) {
    return (
      <Paper sx={{ p: 3, m: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography>Loading data...</Typography>
        </Box>
      </Paper>
    );
  }
  if (error) {
    return (
      <Paper sx={{ p: 3, m: 3 }}>
        <Typography variant="h6" color="error">
          Error fetching data
        </Typography>
        <Typography>{error}</Typography>
      </Paper>
    );
  }
  if (!statementData) {
    return (
      <Paper sx={{ p: 3, m: 3 }}>
        <Typography variant="h6">No data available</Typography>
      </Paper>
    );
  }

  // Build chart & table
  const handleViewTypeChange = (event, newView) => {
    if (newView !== null) setViewType(newView);
  };

  let chartData, chartOptions, tableRows;
  let sumOlder = 0,
    sumNewer = 0;

  // If user selects Annual
  if (viewType === 'annual') {
    if (!processedAnnual.length) {
      return (
        <Paper sx={{ p: 3, m: 3 }}>
          <Typography variant="h6">No annual data available</Typography>
        </Paper>
      );
    }

    const labels = processedAnnual.map((item) => item.year);
    const datasetValues = processedAnnual.map((item) => item[activeMetric.key]);

    chartData = {
      labels,
      datasets: [
        {
          label: activeMetric.label,
          data: datasetValues,
          backgroundColor: chartColor,
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
          ticks: { callback: (value) => formatValue(value) },
        },
      },
    };

    // Build the table rows with year-over-year difference
    tableRows = processedAnnual.map((item, index) => {
      const prev = index > 0 ? processedAnnual[index - 1][activeMetric.key] : null;
      const diff = prev !== null ? item[activeMetric.key] - prev : null;
      const diffPct = prev && prev !== 0 ? (diff / prev) * 100 : null;
      return { period: item.year, value: item[activeMetric.key], diff, diffPct };
    });
  } else {
    // Quarterly
    if (!processedQuarterly.length) {
      return (
        <Paper sx={{ p: 3, m: 3 }}>
          <Typography variant="h6">No quarterly data available</Typography>
        </Paper>
      );
    }

    // Typically we compare the last 8 quarters as "older 4" vs. "newer 4"
    const olderGroup = processedQuarterly.slice(-8, -4);
    const newerGroup = processedQuarterly.slice(-4);

    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
    const olderMap = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    const newerMap = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

    olderGroup.forEach((item) => {
      olderMap[item.quarter] = item[activeMetric.key];
    });
    newerGroup.forEach((item) => {
      newerMap[item.quarter] = item[activeMetric.key];
    });

    sumOlder = olderGroup.reduce((acc, item) => acc + (item[activeMetric.key] || 0), 0);
    sumNewer = newerGroup.reduce((acc, item) => acc + (item[activeMetric.key] || 0), 0);

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
          backgroundColor: chartColor,
        },
      ],
    };

    chartOptions = {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: { display: true, text: `${activeMetric.label} by Quarter` },
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
          ticks: { callback: (value) => formatValue(value) },
        },
      },
    };

    // Build table rows for quarter vs quarter
    tableRows = quarterOrder.map((q) => {
      const olderVal = olderMap[q];
      const newerVal = newerMap[q];
      const diff = newerVal - olderVal;
      const diffPct = olderVal ? (diff / olderVal) * 100 : 0;
      return { period: q, olderVal, newerVal, diff, diffPct };
    });
  }

  // Now mirror the layout of IncomeStatementAnalysis
  return (
    <Box sx={{ display: 'flex', height: '100%', p: 1 }}>
      {/* Sidebar with Metrics */}
      <Paper elevation={3} sx={{ minWidth: 220, mr: 2 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          {sidebarTitle}
        </Typography>
        <Divider />
        <List>
          {metrics.map((m, idx) => (
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
        {/* Toggle for Annual/Quarterly */}
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={handleViewTypeChange}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="annual">Annual</ToggleButton>
          <ToggleButton value="quarterly">Quarterly</ToggleButton>
        </ToggleButtonGroup>

        {/* Chart Section */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {activeMetric.label}
          </Typography>
          <Bar data={chartData} options={chartOptions} />
        </Paper>

        {/* Table Section */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {viewType === 'quarterly'
              ? 'Quarter-by-Quarter Comparison'
              : 'Year-over-Year Comparison'}
          </Typography>

          <TableContainer>
            <Table
              size="small"
              sx={{
                'td, th': {
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                },
              }}
            >
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
                      <TableCell align="right">% Diff</TableCell>
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
                        <TableCell align="right">
                          {formatValue(row.olderVal)}
                        </TableCell>
                        <TableCell align="right">
                          {formatValue(row.newerVal)}
                        </TableCell>
                        <TableCell align="right">
                          {formatValue(row.diff)}
                        </TableCell>
                        <TableCell align="right">
                          {row.diffPct.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  : tableRows.map((row) => {
                      const { period, value, diff, diffPct } = row;
                      return (
                        <TableRow key={period}>
                          <TableCell>{period}</TableCell>
                          <TableCell align="right">
                            {formatValue(value)}
                          </TableCell>
                          <TableCell align="right">
                            {diff !== null ? formatValue(diff) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {diffPct !== null
                              ? diffPct.toFixed(1) + '%'
                              : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                {viewType === 'quarterly' && (
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
                          : (((sumNewer - sumOlder) / sumOlder) * 100).toFixed(
                              1
                            ) + '%'}
                      </strong>
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

export default FinancialAnalysisBase;
