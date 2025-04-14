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

// Helper to determine the chip's background color based on its label.
// For the OR chip (e.g., "OR=30m"), we calculate a blue shade that varies by value.
const getChipColor = (chipLabel) => {
  if (chipLabel.startsWith("OR=")) {
    // Extract the numeric value (expecting format like "OR=45m").
    const valueStr = chipLabel.slice(3).replace("m", "");
    const value = parseInt(valueStr, 10);
    // Expect OR values roughly between 30 and 60.
    const min = 30, max = 60;
    const clamped = Math.max(min, Math.min(value, max));
    // Linear mapping: 30 -> 80% lightness (lighter blue), 60 -> 60% lightness (darker blue)
    const percentage = (clamped - min) / (max - min);
    const lightness = 80 - (percentage * 20);
    return `hsl(220, 70%, ${lightness}%)`;
  }
  if (chipLabel.startsWith("StopLoss=")) {
    // Use a purple hue. For a "None" value, use gray.
    return chipLabel.includes("None") ? "#BDBDBD" : "#8E24AA";
  }
  if (chipLabel.startsWith("TimeExit=")) {
    return "#FFB74D"; // amber
  }
  if (chipLabel.startsWith("MaxEntries=")) {
    return "#81C784"; // green
  }
  if (chipLabel.startsWith("LimitSameDir=")) {
    return "#4DD0E1"; // teal
  }
  if (chipLabel.startsWith("VolumeFilter=")) {
    return "#FFD54F"; // yellow
  }
  return null; // Default will use the chip's built-in color
};

const AggregatedResultsTable = ({ results, onRowClick }) => {
  // Identify best/worst net pnl to highlight
  const netPnLs = results.map((r) => r.net_pnl);
  const bestPnl = Math.max(...netPnLs);
  const worstPnl = Math.min(...netPnLs);

  // ------------------------- FILTER STATE -------------------------
  const [stopLossFilter, setStopLossFilter] = useState('all');
  const [limitDirFilter, setLimitDirFilter] = useState('all');
  const [maxReFilter, setMaxReFilter] = useState('all');
  const [orMinutesFilter, setOrMinutesFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('all');
  const [timeExitFilter, setTimeExitFilter] = useState('all');

  // Extract unique values from results for each parameter
  const uniqueStopLosses = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.stop_loss)));
    return vals; // e.g. [null, 0.005, 0.01]
  }, [results]);

  const uniqueLimitDirVals = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.limit_same_direction)));
    return vals; // e.g. [true, false]
  }, [results]);

  const uniqueMaxReVals = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.max_entries)));
    return vals; // e.g. [2, 5, 10]
  }, [results]);

  const uniqueOrMinutes = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.open_range_minutes)));
    return vals; // e.g. [30, 45]
  }, [results]);

  const uniqueVolumeOptions = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.use_volume_filter)));
    return vals; // e.g. [true, false]
  }, [results]);

  const uniqueTimeExitOptions = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.time_exit_minutes)));
    return vals; // e.g. [60, 120]
  }, [results]);

  // Perform filtering over all parameters
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      // stop_loss filter
      if (stopLossFilter !== 'all') {
        const itemSL = (item.stop_loss === null) ? 'None' : String(item.stop_loss);
        if (itemSL !== stopLossFilter) return false;
      }
      // limit_same_direction filter
      if (limitDirFilter !== 'all') {
        const itemVal = String(item.limit_same_direction);
        if (itemVal !== limitDirFilter) return false;
      }
      // max_entries filter
      if (maxReFilter !== 'all') {
        const itemVal = String(item.max_entries);
        if (itemVal !== maxReFilter) return false;
      }
      // open_range_minutes filter
      if (orMinutesFilter !== 'all') {
        const itemVal = String(item.open_range_minutes);
        if (itemVal !== orMinutesFilter) return false;
      }
      // volume filter
      if (volumeFilter !== 'all') {
        const itemVal = String(item.use_volume_filter);
        if (itemVal !== volumeFilter) return false;
      }
      // time_exit_minutes filter
      if (timeExitFilter !== 'all') {
        const itemVal = String(item.time_exit_minutes);
        if (itemVal !== timeExitFilter) return false;
      }
      return true;
    });
  }, [
    results,
    stopLossFilter,
    limitDirFilter,
    maxReFilter,
    orMinutesFilter,
    volumeFilter,
    timeExitFilter
  ]);

  // Utility: render column header with a tooltip
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

  // Helper to render scenario name and its parameters as chips,
  // applying a custom color for each chip based on its value.
  const renderScenarioCell = (row) => {
    const scenarioName = row.scenario_name || '';

    // Build parameter strings as chips.
    const chips = [];
    if (row.open_range_minutes !== undefined) {
      chips.push(`OR=${row.open_range_minutes}m`);
    }
    if (row.stop_loss !== null) {
      chips.push(`StopLoss=${row.stop_loss}`);
    } else {
      chips.push('StopLoss=None');
    }
    if (row.time_exit_minutes !== undefined) {
      chips.push(`TimeExit=${row.time_exit_minutes}m`);
    }
    if (row.max_entries !== undefined) {
      chips.push(`MaxEntries=${row.max_entries}`);
    }
    if (row.limit_same_direction !== undefined) {
      chips.push(`LimitSameDir=${row.limit_same_direction}`);
    }
    if (row.use_volume_filter !== undefined) {
      chips.push(`VolumeFilter=${row.use_volume_filter}`);
    }

    return (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {scenarioName}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {chips.map((chipLabel, idx) => {
            const bgColor = getChipColor(chipLabel);
            // Determine text color based on background lightness for readability.
            // Here, if the chip is an OR chip, we check the lightness from the hsl string.
            let textColor = 'white';
            if (chipLabel.startsWith("OR=")) {
              // Simple check: if the hsl lightness is above 70%, use black instead.
              const lightnessMatch = bgColor.match(/(\d+)%\)$/);
              if (lightnessMatch && Number(lightnessMatch[1]) > 70) {
                textColor = 'black';
              }
            }
            return (
              <Chip
                key={idx}
                label={chipLabel}
                size="small"
                sx={{
                  backgroundColor: bgColor,
                  color: bgColor ? textColor : 'inherit'
                }}
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  const columns = [
    {
      field: 'scenario_name',
      headerName: 'Scenario',
      flex: 2,
      renderHeader: () =>
        renderHeaderWithTooltip('Scenario', 'Scenario name and parameters'),
      renderCell: (params) => {
        return renderScenarioCell(params.row);
      }
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
        if (rawVal === bestPnl)
          highlight = { backgroundColor: 'rgba(0,255,0,0.1)' };
        else if (rawVal === worstPnl)
          highlight = { backgroundColor: 'rgba(255,0,0,0.1)' };

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
      }
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
          params.row.win_rate_formatted ||
          ((val || 0) * 100).toFixed(1) + '%';
        let chipColor = 'default';
        if (val > 0.7) chipColor = 'success';
        else if (val < 0.3) chipColor = 'error';
        return <Chip label={displayVal} color={chipColor} size="small" />;
      }
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
          <Tooltip title="Total gross profit divided by total gross loss">
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {displayVal}
            </Typography>
          </Tooltip>
        );
      }
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
      )
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
      )
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
      )
    }
  ];

  // Map filtered results to rows for the DataGrid
  const rows = filteredResults.map((item, index) => ({
    id: index,
    ...item,
    date: item.date ? new Date(item.date).toLocaleDateString() : ''
  }));

  const handleRowClick = useCallback(
    (params) => {
      onRowClick && onRowClick(params.row);
    },
    [onRowClick]
  );

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* FILTER UI */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Filter Scenarios
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'
          }}
        >
          {/* Stop Loss Filter */}
          <FormControl variant="outlined" size="small" sx={{ width: '100%' }}>
            <InputLabel>Stop Loss</InputLabel>
            <Select
              label="Stop Loss"
              value={stopLossFilter}
              onChange={(e) => setStopLossFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
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

          {/* Limit Same Direction Filter */}
          <FormControl variant="outlined" size="small" sx={{ width: '100%' }}>
            <InputLabel>LimitSameDir?</InputLabel>
            <Select
              label="LimitSameDir?"
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

          {/* Max Re-Entries Filter */}
          <FormControl variant="outlined" size="small" sx={{ width: '100%' }}>
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

          {/* OR Minutes Filter */}
          <FormControl variant="outlined" size="small" sx={{ width: '100%' }}>
            <InputLabel>OR Minutes</InputLabel>
            <Select
              label="OR Minutes"
              value={orMinutesFilter}
              onChange={(e) => setOrMinutesFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {uniqueOrMinutes.map((val) => {
                const label = String(val);
                return (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Volume Filter */}
          <FormControl variant="outlined" size="small" sx={{ width: '100%' }}>
            <InputLabel>Volume Filter</InputLabel>
            <Select
              label="Volume Filter"
              value={volumeFilter}
              onChange={(e) => setVolumeFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {uniqueVolumeOptions.map((val) => {
                const label = String(val);
                return (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Time Exit Filter */}
          <FormControl variant="outlined" size="small" sx={{ width: '100%' }}>
            <InputLabel>Time Exit (min)</InputLabel>
            <Select
              label="Time Exit (min)"
              value={timeExitFilter}
              onChange={(e) => setTimeExitFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {uniqueTimeExitOptions.map((val) => {
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

      {/* DATA GRID */}
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
            cursor: 'pointer',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
            },
            // Zebra striping
            '& .MuiDataGrid-row:nth-of-type(even)': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
            // Hover highlight
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.06)',
            },
            // Remove focus outline on cells
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
              outline: 'none',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default AggregatedResultsTable;
