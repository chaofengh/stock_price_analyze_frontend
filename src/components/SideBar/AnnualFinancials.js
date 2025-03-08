import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const AnnualFinancials = ({ annualReports }) => {
  if (!annualReports || annualReports.length === 0) {
    return <Typography variant="body2">No annual financial data available.</Typography>;
  }

  // Use the last three reports (assumed to be reverse-chronological)
  const lastThreeReports = annualReports.slice(0, 3);
  const reportsData = lastThreeReports.map((report, index) => {
    const revenue = parseFloat(report.totalRevenue);
    const netIncome = parseFloat(report.netIncome);
    const grossProfit = parseFloat(report.grossProfit);
    const operatingIncome = parseFloat(report.operatingIncome);

    const netMargin = revenue ? (netIncome / revenue) * 100 : null;
    const operatingMargin = revenue ? (operatingIncome / revenue) * 100 : null;
    const grossMargin = revenue ? (grossProfit / revenue) * 100 : null;

    let revenueChange = null;
    let netIncomeChange = null;
    let netMarginChange = null;

    // Compare to previous year if available (reports are ordered most-recent first)
    if (index < lastThreeReports.length - 1) {
      const prevRevenue = parseFloat(lastThreeReports[index + 1].totalRevenue);
      const prevNetIncome = parseFloat(lastThreeReports[index + 1].netIncome);
      const prevNetMargin = prevRevenue
        ? (parseFloat(lastThreeReports[index + 1].netIncome) / prevRevenue) * 100
        : null;

      revenueChange = prevRevenue
        ? ((revenue - prevRevenue) / prevRevenue) * 100
        : null;

      // Use absolute value of prevNetIncome to handle negative-to-positive changes
      netIncomeChange = prevNetIncome
        ? ((netIncome - prevNetIncome) / Math.abs(prevNetIncome)) * 100
        : null;

      if (prevNetMargin !== null && netMargin !== null) {
        netMarginChange = netMargin - prevNetMargin;
      }
    }

    return {
      fiscalDateEnding: report.fiscalDateEnding,
      revenue,
      revenueChange,
      netIncome,
      netIncomeChange,
      netMargin,
      netMarginChange,
      operatingMargin,
      grossMargin,
    };
  });

  // Formatters for display
  const formatCurrency = (value) =>
    value != null
      ? `$${(value / 1e6).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`
      : '-';

  const formatPercent = (value) => (value != null ? `${value.toFixed(2)}%` : '-');

  const formatChange = (value) =>
    value != null ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : '-';

  const getChangeIcon = (value) => {
    if (value == null) return null;
    return value >= 0 ? (
      <TrendingUpIcon
        fontSize="inherit"
        sx={{ color: 'green', verticalAlign: 'middle', mr: 0.25 }}
      />
    ) : (
      <TrendingDownIcon
        fontSize="inherit"
        sx={{ color: 'red', verticalAlign: 'middle', mr: 0.25 }}
      />
    );
  };

  // Define the rows for each metric to be displayed
  const metrics = [
    {
      label: 'Total Revenue',
      field: 'revenue',
      changeField: 'revenueChange',
      formatter: formatCurrency,
    },
    {
      label: 'Net Income',
      field: 'netIncome',
      changeField: 'netIncomeChange',
      formatter: formatCurrency,
    },
    {
      label: 'Net Margin',
      field: 'netMargin',
      changeField: 'netMarginChange',
      formatter: formatPercent,
    },
    {
      label: 'Operating Margin',
      field: 'operatingMargin',
      changeField: null,
      formatter: formatPercent,
    },
    {
      label: 'Gross Margin',
      field: 'grossMargin',
      changeField: null,
      formatter: formatPercent,
    },
  ];

  return (
    <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, boxShadow: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ py: 2 }}>
              <strong>Metric</strong>
            </TableCell>
            {reportsData.map((report) => (
              <TableCell key={report.fiscalDateEnding} align="center" sx={{ py: 2 }}>
                <strong>{new Date(report.fiscalDateEnding).getFullYear()}</strong>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {metrics.map((metric) => (
            <TableRow key={metric.label}>
              <TableCell component="th" scope="row" sx={{ py: 2 }}>
                {metric.label}
              </TableCell>
              {reportsData.map((report) => (
                <TableCell key={report.fiscalDateEnding} align="center" sx={{ py: 2 }}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                      {metric.formatter(report[metric.field])}
                    </Typography>
                    {metric.changeField && report[metric.changeField] != null && (
                      <Box display="flex" alignItems="center">
                        {getChangeIcon(report[metric.changeField])}
                        <Typography
                          variant="caption"
                          color={report[metric.changeField] >= 0 ? 'green' : 'red'}
                        >
                          {formatChange(report[metric.changeField])}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AnnualFinancials;
