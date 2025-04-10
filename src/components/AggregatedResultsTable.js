import React, { useCallback, useState, useMemo } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Tooltip,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import InfoIcon from '@mui/icons-material/Info';

const AggregatedResultsTable = ({ results, onRowClick }) => {
  // Identify the best/worst net pnl to highlight
  const netPnLs = results.map((r) => r.net_pnl);
  const bestPnl = Math.max(...netPnLs);
  const worstPnl = Math.min(...netPnLs);

  // ---- FILTER STATE ----
  const [stopLossFilter, setStopLossFilter] = useState('all');
  const [limitDirFilter, setLimitDirFilter] = useState('all');
  const [maxReFilter, setMaxReFilter] = useState('all');

  // Unique sets extracted from results
  // This helps build our filter menus dynamically if you want
  const uniqueStopLosses = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.stop_loss)));
    return vals; // e.g. [null, 0.005, 0.0075, 0.01]
  }, [results]);

  const uniqueLimitDirVals = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.limit_same_direction)));
    return vals; // e.g. [true, false]
  }, [results]);

  const uniqueMaxReVals = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.max_entries)));
    return vals; // e.g. [2, 5, 10]
  }, [results]);

  // Perform filtering
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      // stop_loss filter
      if (stopLossFilter !== 'all') {
        // Use string compare or numeric compare
        // If the item.stop_loss is null, we can represent it as 'None'
        const itemSL = (item.stop_loss === null) ? 'None' : String(item.stop_loss);
        if (itemSL !== stopLossFilter) return false;
      }
      // limit_same_direction filter
      if (limitDirFilter !== 'all') {
        // item.limit_same_direction is boolean
        const itemVal = String(item.limit_same_direction);
        if (itemVal !== limitDirFilter) return false;
      }
      // max_reentries filter
      if (maxReFilter !== 'all') {
        const itemVal = String(item.max_entries);
        if (itemVal !== maxReFilter) return false;
      }
      return true;
    });
  }, [results, stopLossFilter, limitDirFilter, maxReFilter]);

  // Utility to render a header with an info tooltip
  const renderHeaderWithTooltip = (headerText, tooltipText) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        {headerText}
      </Typography>
      <Tooltip title={tooltipText}>
        <InfoIcon sx={{ fontSize: '1rem', cursor: 'help' }} />
      </Tooltip>
    </Box>
  );

  const columns = [
    {
      field: 'scenario_name',
      headerName: 'Scenario',
      flex: 1,
      renderHeader: () =>
        renderHeaderWithTooltip('Scenario', 'Scenario name and applied filters'),
      renderCell: (params) => {
        const scenario = params.value || '';
        const filters = params.row.filters || '';
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {scenario}
            </Typography>
            {filters && (
              <Typography variant="body2" color="text.secondary">
                {filters}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'net_pnl',
      headerName: 'Net PNL',
      width: 150,
      renderHeader: () =>
        renderHeaderWithTooltip('Net PNL', 'Net Profit and Loss'),
      renderCell: (params) => {
        const rawVal = params.value;
        const displayVal = params.row.net_pnl_formatted || rawVal;
        const color = rawVal < 0 ? 'red' : 'green';
        const Icon = rawVal < 0 ? ArrowDownwardIcon : ArrowUpwardIcon;

        let highlight = {};
        if (rawVal === bestPnl) {
          highlight = { backgroundColor: 'rgba(0,255,0,0.1)' };
        } else if (rawVal === worstPnl) {
          highlight = { backgroundColor: 'rgba(255,0,0,0.1)' };
        }

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              ...highlight
            }}
          >
            <Icon sx={{ color, fontSize: '1.2rem' }} />
            <Typography variant="body2" sx={{ color, fontWeight: 'bold' }}>
              {displayVal}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'win_rate',
      headerName: 'Win Rate',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderHeader: () =>
        renderHeaderWithTooltip('Win Rate', 'Percentage of winning trades'),
      renderCell: (params) => {
        const val = params.row.win_rate;
        const displayVal =
          params.row.win_rate_formatted || ((val || 0) * 100).toFixed(1) + '%';
        let chipColor = 'default';
        if (val > 0.7) chipColor = 'success';
        else if (val < 0.3) chipColor = 'error';
        return <Chip label={displayVal} color={chipColor} size="small" />;
      },
    },
    {
      field: 'profit_factor',
      headerName: 'Profit Factor',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderHeader: () =>
        renderHeaderWithTooltip('Profit Factor', 'Gross profit / gross loss'),
      renderCell: (params) => {
        const val = params.row.profit_factor;
        const displayVal = params.row.profit_factor_formatted || val || '';
        return (
          <Tooltip title="Total gross profit / total gross loss">
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {displayVal}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: 'sharpe_ratio',
      headerName: 'Sharpe Ratio',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderHeader: () =>
        renderHeaderWithTooltip('Sharpe Ratio', 'Risk-adjusted return'),
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {params.row.sharpe_ratio_formatted || params.row.sharpe_ratio || ''}
        </Typography>
      ),
    },
    {
      field: 'max_drawdown',
      headerName: 'Max DD',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderHeader: () =>
        renderHeaderWithTooltip('Max DD', 'Maximum drawdown from peak equity'),
      renderCell: (params) => (
        <Tooltip title="Maximum drawdown from the equity peak">
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {params.row.max_drawdown_formatted || params.row.max_drawdown}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'num_trades',
      headerName: '# Trades',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderHeader: () =>
        renderHeaderWithTooltip('# Trades', 'Total number of trades executed'),
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {params.row.num_trades}
        </Typography>
      ),
    },
  ];

  const rows = filteredResults.map((item, index) => ({
    id: index,
    ...item,
    date: item.date ? new Date(item.date).toLocaleDateString() : '',
  }));

  // Row click handler
  const handleRowClick = useCallback(
    (params) => {
      onRowClick && onRowClick(params.row);
    },
    [onRowClick]
  );

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Filter Scenarios
        </Typography>
        {/* Example MUI selects for filtering */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Stop Loss</InputLabel>
            <Select
              label="Stop Loss"
              value={stopLossFilter}
              onChange={(e) => setStopLossFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {/* Render known stop-loss values */}
              {uniqueStopLosses.map((val) => {
                const label = val === null ? 'None' : String(val);
                return (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Opposite After Loss?</InputLabel>
            <Select
              label="Opposite After Loss?"
              value={limitDirFilter}
              onChange={(e) => setLimitDirFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {uniqueLimitDirVals.map((val) => {
                const label = String(val);
                return (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Max Entries</InputLabel>
            <Select
              label="Max Entries"
              value={maxReFilter}
              onChange={(e) => setMaxReFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {uniqueMaxReVals.map((val) => {
                const label = String(val);
                return (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Aggregated Results
        </Typography>
        <DataGrid
          rows={rows}
          columns={columns}
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
          onRowClick={handleRowClick}
          autoHeight
          headerHeight={60}
          sx={{
            fontSize: '0.95rem',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default AggregatedResultsTable;
