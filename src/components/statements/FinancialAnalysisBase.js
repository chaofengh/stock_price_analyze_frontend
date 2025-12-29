// FinancialAnalysisBase.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  ButtonBase,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

const withAlpha = (color, alpha) => {
  if (!color) return color;
  const rgbaMatch = color.match(/rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)(?:,\s*([\d.]+))?\)/i);
  if (!rgbaMatch) return color;
  const [, r, g, b] = rgbaMatch;
  return `rgba(${Number(r)}, ${Number(g)}, ${Number(b)}, ${alpha})`;
};

function FinancialAnalysisBase({
  symbol,
  // Redux-specific props
  fetchDataThunk,                // e.g. fetchBalanceSheet or fetchCashFlow
  selectDataFromStore,           // how to get the statement data from Redux
  selectLoadingFromStore,        // how to get the loading boolean
  selectErrorFromStore,          // how to get the error string
  initialData = null,            // optional prefetched data (e.g. from summary)
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
  const normalizedInitialData = useMemo(() => {
    if (!initialData) return null;
    if (initialData.symbol) return initialData;
    return { ...initialData, symbol };
  }, [initialData, symbol]);
  const storeMatchesSymbol =
    !statementData?.symbol || statementData.symbol === symbol;
  const effectiveStoreData = storeMatchesSymbol ? statementData : null;
  const effectiveStatementData = effectiveStoreData || normalizedInitialData;
  const isStaleData = Boolean(
    statementData?.symbol &&
      statementData.symbol !== symbol &&
      !normalizedInitialData
  );

  // State for which metric & view (annual/quarterly)
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const [viewType, setViewType] = useState('quarterly');
  const inFlightSymbolRef = useRef(null);
  const fetchAttemptedSymbolRef = useRef(null);

  const hasAnnualData = Boolean(
    effectiveStatementData?.partialYearReports?.length ||
      effectiveStatementData?.annualReports?.length
  );
  const hasQuarterlyData = Boolean(
    effectiveStatementData?.quarterlyReports?.length
  );
  const needsAnnualData = viewType === 'annual' && !hasAnnualData;
  const needsQuarterlyData = viewType === 'quarterly' && !hasQuarterlyData;
  const shouldFetch =
    !effectiveStatementData || needsAnnualData || needsQuarterlyData;

  useEffect(() => {
    if (!symbol) {
      inFlightSymbolRef.current = null;
      fetchAttemptedSymbolRef.current = null;
      return;
    }

    if (!shouldFetch || loading) {
      inFlightSymbolRef.current = null;
      return;
    }

    if (fetchAttemptedSymbolRef.current === symbol) {
      return;
    }

    // Prevent duplicate fetches (e.g., StrictMode double effects)
    if (inFlightSymbolRef.current === symbol) {
      return;
    }

    fetchAttemptedSymbolRef.current = symbol;
    inFlightSymbolRef.current = symbol;

    dispatch(fetchDataThunk(symbol)).finally(() => {
      if (inFlightSymbolRef.current === symbol) {
        inFlightSymbolRef.current = null;
      }
    });
  }, [symbol, dispatch, fetchDataThunk, shouldFetch, loading]);

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
  const annualReportsSource = useMemo(() => {
    if (!effectiveStatementData) return [];
    if (effectiveStatementData.partialYearReports?.length) {
      return effectiveStatementData.partialYearReports;
    }
    return effectiveStatementData.annualReports || [];
  }, [effectiveStatementData]);

  const isPartialYearMode = Boolean(effectiveStatementData?.partialYearReports?.length);

  const quarterlyReports = useMemo(
    () => effectiveStatementData?.quarterlyReports || [],
    [effectiveStatementData]
  );

  // Statement-specific processing
  const processedAnnual = useMemo(
    () => processAnnualReports(annualReportsSource),
    [annualReportsSource, processAnnualReports]
  );
  const processedQuarterly = useMemo(
    () => processQuarterlyReports(quarterlyReports),
    [quarterlyReports, processQuarterlyReports]
  );

  const ytdRangeLabel = useMemo(() => {
    if (!processedAnnual.length) return null;
    const entryWithRange = processedAnnual.find((item) => item.quarterRange);
    return entryWithRange?.quarterRange || null;
  }, [processedAnnual]);

  const chartHeading =
    viewType === 'quarterly'
      ? activeMetric.label
      : isPartialYearMode && ytdRangeLabel
        ? `${activeMetric.label} (${ytdRangeLabel})`
        : isPartialYearMode
          ? `${activeMetric.label} (Year-to-Date)`
          : `${activeMetric.label} (Annual)`;
  const tableTitle =
    viewType === 'quarterly'
      ? 'Quarter-by-Quarter Comparison'
      : isPartialYearMode && ytdRangeLabel
        ? `Year-to-Date Comparison (${ytdRangeLabel})`
        : isPartialYearMode
          ? 'Year-to-Date Comparison'
        : 'Year-over-Year Comparison';
  const toggleOptions = useMemo(
    () => [
      { value: 'annual', label: isPartialYearMode ? 'Year-to-Date' : 'Annual' },
      { value: 'quarterly', label: 'Quarterly' },
    ],
    [isPartialYearMode]
  );
  const activeToggleIndex = Math.max(
    0,
    toggleOptions.findIndex((option) => option.value === viewType)
  );
  const periodHeader =
    viewType === 'quarterly'
      ? 'Quarter'
      : isPartialYearMode && ytdRangeLabel
        ? `Year (${ytdRangeLabel})`
        : isPartialYearMode
          ? 'Year (YTD)'
          : 'Year';
  const valueHeader =
    viewType === 'quarterly'
      ? null
      : isPartialYearMode && ytdRangeLabel
        ? `Total (${ytdRangeLabel})`
        : isPartialYearMode
          ? 'YTD Total'
          : 'Annual Total';
  const priorHeader = 'Prior 4Q (Same Quarter)';
  const trailingHeader = 'Trailing 4Q (Same Quarter)';
  const deltaHeader = 'Change vs Prior';
  const deltaPctHeader = '% Change vs Prior';
  const positiveDeltaColor = withAlpha(chartColor, 0.95) || 'rgba(46, 125, 50, 0.95)';
  const negativeDeltaColor = 'rgba(211, 47, 47, 0.95)';
  const getDeltaColor = (value) => {
    if (value === null || value === undefined) return 'inherit';
    if (value > 0) return positiveDeltaColor;
    if (value < 0) return negativeDeltaColor;
    return 'inherit';
  };

  const latestQuarterInfo = useMemo(() => {
    if (!processedQuarterly.length) return null;
    return processedQuarterly[processedQuarterly.length - 1];
  }, [processedQuarterly]);

  // Handle loading/error/no-data states
  if (!symbol) {
    return (
      <Paper sx={{ p: 3, m: 3 }}>
        <Typography variant="h6">No symbol provided</Typography>
      </Paper>
    );
  }
  if (isStaleData) {
    return (
      <Paper sx={{ p: 3, m: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography>Loading data...</Typography>
        </Box>
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
  if (!effectiveStatementData) {
    return (
      <Paper sx={{ p: 3, m: 3 }}>
        <Typography variant="h6">No data available</Typography>
      </Paper>
    );
  }

  // Build chart & table
  const handleViewTypeChange = (newView) => {
    if (typeof newView === 'string') {
      setViewType(newView);
    }
  };

  let chartData, chartOptions, tableRows;
  let sumOlder = 0,
    sumNewer = 0;

  // If user selects Annual
  if (viewType === 'annual') {
    if (!processedAnnual.length) {
      return (
        <Paper sx={{ p: 3, m: 3 }}>
          <Typography variant="h6">
            {isPartialYearMode ? 'No year-to-date data available' : 'No annual data available'}
          </Typography>
        </Paper>
      );
    }

    const labels = processedAnnual.map((item) => item.displayLabel || item.year);
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
        title: { display: true, text: chartHeading, align: 'center' },
        legend: { align: 'center' },
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
      const periodLabel = item.displayLabel || item.year;
      return { period: periodLabel, value: item[activeMetric.key], diff, diffPct };
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

    const highlightQuarter = latestQuarterInfo?.quarter || null;
    const highlightIndex = highlightQuarter
      ? quarterOrder.indexOf(highlightQuarter)
      : -1;

    const olderBaseColor = 'rgba(176, 190, 197, 0.08)';
    const olderHighlightColor = 'rgba(96, 125, 139, 0.95)';
    const newerMutedColor = withAlpha(chartColor, 0.12);
    const newerHighlightColor = withAlpha(chartColor, 1);
    const highlightBorderColor = 'rgba(0, 0, 0, 0.8)';

    const olderBackground = quarterOrder.map((_, idx) =>
      idx === highlightIndex ? olderHighlightColor : olderBaseColor
    );
    const newerBackground = quarterOrder.map((_, idx) =>
      idx === highlightIndex ? newerHighlightColor : newerMutedColor
    );
    const borderColors = quarterOrder.map((_, idx) =>
      idx === highlightIndex ? highlightBorderColor : 'rgba(0, 0, 0, 0)'
    );
    const borderWidths = quarterOrder.map((_, idx) => (idx === highlightIndex ? 3 : 0));

    chartData = {
      labels: quarterOrder,
      datasets: [
        {
          label: `Prior 4 trailing quarters`,
          data: quarterOrder.map((q) => olderMap[q]),
          backgroundColor: olderBackground,
          borderColor: borderColors,
          borderWidth: borderWidths,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: `Trailing 4 quarters`,
          data: quarterOrder.map((q) => newerMap[q]),
          backgroundColor: newerBackground,
          borderColor: borderColors,
          borderWidth: borderWidths,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };

    chartOptions = {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: {
          display: true,
          text: `${activeMetric.label} by Quarter (Trailing vs Prior)`,
          align: 'center',
        },
        legend: { align: 'center' },
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

  // Shared layout for statement analysis views
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
        <Box
          role="tablist"
          aria-label="Statement view"
          sx={{
            mb: 2,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: 260,
            maxWidth: '100%',
            height: 32,
            p: '2px',
            borderRadius: '999px',
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: 2,
              width: 'calc(50% - 4px)',
              borderRadius: '999px',
              backgroundColor: 'primary.main',
              boxShadow: 1,
              transform: `translateX(${activeToggleIndex * 100}%)`,
              transition: 'transform 0.22s ease',
            }}
          />
          {toggleOptions.map((option) => (
            <ButtonBase
              key={option.value}
              role="tab"
              aria-selected={viewType === option.value}
              onClick={() => handleViewTypeChange(option.value)}
              sx={{
                flex: 1,
                zIndex: 1,
                height: '100%',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: 0.3,
                color: viewType === option.value ? '#fff' : 'text.primary',
              }}
            >
              {option.label}
            </ButtonBase>
          ))}
        </Box>

        {viewType === 'quarterly' && latestQuarterInfo && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 1 }}
          >
            Highlighted bars show {latestQuarterInfo.year} {latestQuarterInfo.quarter}
            {' '}versus the same quarter from the prior year.
          </Typography>
        )}

        {/* Chart Section */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom align="center" sx={{ py: 5 }}>
            {chartHeading}
          </Typography>
          <Bar data={chartData} options={chartOptions} />
        </Paper>

        {/* Table Section */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom align="center" sx={{ py: 5 }}>
            {tableTitle}
          </Typography>

          <TableContainer>
            <Table
              size="small"
              sx={{
                'td, th': {
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>{periodHeader}</TableCell>
                  {viewType === 'quarterly' ? (
                    <>
                      <TableCell align="center">{trailingHeader}</TableCell>
                      <TableCell align="center">{priorHeader}</TableCell>
                      <TableCell align="center">{deltaHeader}</TableCell>
                      <TableCell align="center">{deltaPctHeader}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell align="center">{deltaHeader}</TableCell>
                      <TableCell align="center">{valueHeader}</TableCell>
                      <TableCell align="center">{deltaPctHeader}</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {viewType === 'quarterly'
                  ? tableRows.map((row) => (
                      <TableRow
                        key={row.period}
                        sx={{
                          backgroundColor:
                            latestQuarterInfo?.quarter === row.period
                              ? 'rgba(212, 235, 240, 0.08)'
                              : 'transparent',
                        }}
                      >
                        <TableCell>{row.period}</TableCell>
                        <TableCell align="center">{formatValue(row.newerVal)}</TableCell>
                        <TableCell align="center">{formatValue(row.olderVal)}</TableCell>
                        <TableCell align="center" sx={{ color: getDeltaColor(row.diff) }}>
                          {formatValue(row.diff)}
                        </TableCell>
                        <TableCell align="center" sx={{ color: getDeltaColor(row.diffPct) }}>
                          {row.diffPct.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  : tableRows.map((row) => {
                      const { period, value, diff, diffPct } = row;
                      return (
                        <TableRow key={period}>
                          <TableCell>{period}</TableCell>
                          <TableCell align="center" sx={{ color: getDeltaColor(diff) }}>
                            {diff !== null ? formatValue(diff) : '-'}
                          </TableCell>
                          <TableCell align="center">{formatValue(value)}</TableCell>
                          <TableCell align="center" sx={{ color: getDeltaColor(diffPct) }}>
                            {diffPct !== null ? diffPct.toFixed(1) + '%' : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                {viewType === 'quarterly' && (
                  <TableRow>
                    <TableCell>
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>{formatValue(sumNewer)}</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>{formatValue(sumOlder)}</strong>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ color: getDeltaColor(sumNewer - sumOlder) }}
                    >
                      <strong>{formatValue(sumNewer - sumOlder)}</strong>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: getDeltaColor(
                          sumOlder === 0 ? null : ((sumNewer - sumOlder) / sumOlder) * 100
                        ),
                      }}
                    >
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
