// File: AggregatedResultsTable.js
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
  InputLabel,
  Divider
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import InfoIcon from '@mui/icons-material/Info';

/**
 * Color mapping for numeric parameters (less saturation to avoid harsh rainbow).
 */
const colorMapping = {
  OR: {
    prefix: 'OR=',
    baseHue: 210,       // bluish
    baseSaturation: 30, // toned down from 60
    min: 30,
    max: 60,
    minLightness: 60,
    maxLightness: 80,
    unit: 'm'
  },
  StopLoss: {
    prefix: 'StopLoss=',
    baseHue: 280,       // purple
    baseSaturation: 30,
    min: 0.005,
    max: 0.01,
    minLightness: 60,
    maxLightness: 80,
    unit: ''
  },
  TimeExit: {
    prefix: 'TimeExit=',
    baseHue: 30,       // orange
    baseSaturation: 40,
    min: 60,
    max: 120,
    minLightness: 60,
    maxLightness: 80,
    unit: 'm'
  },
  MaxEntries: {
    prefix: 'MaxEntries=',
    baseHue: 120,      // green
    baseSaturation: 30,
    min: 1,
    max: 5,
    minLightness: 60,
    maxLightness: 80,
    unit: ''
  }
};

/**
 * Compute dynamic HSL color for a numeric-based chip label, with toned-down saturation.
 */
const getDynamicColor = (chipLabel) => {
  // Special case for 'StopLoss=None'
  if (chipLabel.startsWith('StopLoss=') && chipLabel.includes('None')) {
    return '#BDBDBD'; // gray
  }

  // Check numeric-based keys
  for (const key in colorMapping) {
    const mapping = colorMapping[key];
    if (chipLabel.startsWith(mapping.prefix)) {
      let valueStr = chipLabel.slice(mapping.prefix.length);
      if (mapping.unit) {
        valueStr = valueStr.replace(mapping.unit, '');
      }
      const value = parseFloat(valueStr);
      if (isNaN(value)) break;

      const clamped = Math.max(mapping.min, Math.min(value, mapping.max));
      const ratio = (clamped - mapping.min) / (mapping.max - mapping.min);
      const lightness = mapping.minLightness + ratio * (mapping.maxLightness - mapping.minLightness);
      return `hsl(${mapping.baseHue}, ${mapping.baseSaturation}%, ${lightness}%)`;
    }
  }

  // Boolean-based chips
  if (chipLabel.startsWith('LimitSameDir=')) {
    const val = chipLabel.slice('LimitSameDir='.length);
    return val === 'true' ? 'hsl(180, 30%, 70%)' : 'hsl(180, 30%, 85%)';
  }
  if (chipLabel.startsWith('VolumeFilter=')) {
    const val = chipLabel.slice('VolumeFilter='.length);
    return val === 'true' ? 'hsl(50, 40%, 70%)' : 'hsl(50, 40%, 85%)';
  }

  return null;
};

const getChipColor = (chipLabel) => {
  const dynamicColor = getDynamicColor(chipLabel);
  return dynamicColor ? dynamicColor : null;
};

const AggregatedResultsTable = ({ results, onRowClick }) => {
  // Identify best/worst net pnl to highlight
  const netPnLs = results.map((r) => r.net_pnl);
  const bestPnl = Math.max(...netPnLs);
  const worstPnl = Math.min(...netPnLs);

  // -------------------------- FILTER STATE --------------------------
  const [stopLossFilter, setStopLossFilter] = useState('all');
  const [limitDirFilter, setLimitDirFilter] = useState('all');
  const [maxReFilter, setMaxReFilter] = useState('all');
  const [orMinutesFilter, setOrMinutesFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('all');
  const [timeExitFilter, setTimeExitFilter] = useState('all');

  // Extract unique values
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
    return vals; // e.g. [1, 2, 3...]
  }, [results]);
  const uniqueOrMinutes = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.open_range_minutes)));
    return vals;
  }, [results]);
  const uniqueVolumeOptions = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.use_volume_filter)));
    return vals; // e.g. [true, false]
  }, [results]);
  const uniqueTimeExitOptions = useMemo(() => {
    const vals = Array.from(new Set(results.map(r => r.time_exit_minutes)));
    return vals;
  }, [results]);

  // Filter the results
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      // stop_loss filter
      if (stopLossFilter !== 'all') {
        const itemSL = (item.stop_loss === null) ? 'None' : String(item.stop_loss);
        if (itemSL !== stopLossFilter) return false;
      }
      // limit_same_direction filter
      if (limitDirFilter !== 'all') {
        if (String(item.limit_same_direction) !== limitDirFilter) return false;
      }
      // max_entries filter
      if (maxReFilter !== 'all') {
        if (String(item.max_entries) !== maxReFilter) return false;
      }
      // open_range_minutes filter
      if (orMinutesFilter !== 'all') {
        if (String(item.open_range_minutes) !== orMinutesFilter) return false;
      }
      // volume filter
      if (volumeFilter !== 'all') {
        if (String(item.use_volume_filter) !== volumeFilter) return false;
      }
      // time_exit_minutes filter
      if (timeExitFilter !== 'all') {
        if (String(item.time_exit_minutes) !== timeExitFilter) return false;
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

  // Utility: Render column header with a tooltip
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

  // Render scenario name & parameters as color-coded chips
  const renderScenarioCell = (row) => {
    const scenarioName = row.scenario_name || '';

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
            let textColor = '#fff';
            if (bgColor && bgColor.startsWith('hsl(')) {
              const lightnessMatch = bgColor.match(/(\d+)%\)$/);
              if (lightnessMatch && Number(lightnessMatch[1]) > 70) {
                textColor = '#000';
              }
            }
            return (
              <Chip
                key={idx}
                label={chipLabel}
                size="small"
                sx={{
                  backgroundColor: bgColor || 'default',
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
      renderCell: (params) => renderScenarioCell(params.row)
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
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
          Scenario Filters
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))'
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

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
          Aggregated Results
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <DataGrid
          rows={rows}
          columns={columns}
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
          onRowClick={handleRowClick}
          autoHeight
          headerHeight={56}
          sx={{
            fontSize: '0.95rem',
            cursor: 'pointer',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            },
            // Subtle zebra striping
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
