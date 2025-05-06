import React, { useCallback } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box, Paper, Chip, Typography } from '@mui/material';
import ArrowUpwardIcon  from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

/* colour helpers ----------------------------------------------------------- */
const chipBg = {
  OR:         '#90a4ae',   // grey
  VWAPFilter: '#ffe082',   // light amber
  VolFilter:  '#fff59d',   // pastel yellow
  Reverse:    '#d1c4e9',   // lavender
  ORB:        '#bbdefb',   // light blue
  BBands:     '#c8e6c9',   // mint green
  'S/R':      '#ffe0b2'    // peach
};

/* strategy → label lookup -------------------------------------------------- */
const stratLabel = {
  backtest_orb:                 'ORB',
  backtest_reverse_orb:         'Reverse',
  backtest_bbands:              'BBands',
  backtest_support_resistance:  'S/R'
};

/* component ---------------------------------------------------------------- */
export default function AggregatedResultsTable({ results = [], onRowClick }) {

  /* ----- derive best / worst safely ----- */
  const best  = results.length ? Math.max(...results.map(r => r.net_pnl)) : 0;
  const worst = results.length ? Math.min(...results.map(r => r.net_pnl)) : 0;

  /* ----- columns ---------------------------------------------------------- */
  const columns = [
    /* scenario chips ------------------------------------------------------- */
    {
      field: 'scenario',
      headerName: 'Strategy & Filters',
      flex: 3,
      renderCell: ({ row }) => {
        const primary = stratLabel[row.strategy] || row.strategy;
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label={primary}
              size="small"
              sx={{
                background: chipBg[primary] || '#e0e0e0',
                color: '#000'
              }}
            />
            {row.filters.split(' + ').map((c, i) => {
              const key = c.split('=')[0];
              return (
                <Chip
                  key={i}
                  label={c}
                  size="small"
                  sx={{ background: chipBg[key] || '#e0e0e0' }}
                />
              );
            })}
          </Box>
        );
      }
    },

    /* net pnl -------------------------------------------------------------- */
    {
      field: 'net_pnl',
      headerName: 'Net\u00A0P&L\u00A0($)',
      width: 130,
      type: 'number',
      headerAlign: 'center',
      align:'center',
      renderCell: ({ row }) => {
        const pos  = row.net_pnl >= 0;
        const Icon = pos ? ArrowUpwardIcon : ArrowDownwardIcon;
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              backgroundColor:
                row.net_pnl === best
                  ? 'rgba(0,255,0,.1)'
                  : row.net_pnl === worst
                  ? 'rgba(255,0,0,.1)'
                  : 'transparent',
              width: '100%',
              height: '100%',
              pl: 1
            }}
          >
            <Icon sx={{ color: pos ? 'green' : 'red', fontSize: '1rem' }} />
            <Typography sx={{ color: pos ? 'green' : 'red', fontWeight: 600 }}>
              {row.net_pnl.toFixed(2)}
            </Typography>
          </Box>
        );
      }
    },

    /* Win % --------------------------------------------------------------- */
    {
      field: 'win_rate',
      headerName: 'Win\u00A0Rate\u00A0(%)',
      width: 150,
      headerAlign: 'center',
      align:'center',
      renderCell: ({ value }) =>
        value != null ? `${(value * 100).toFixed(1)}\u00A0%` : ''
    },

    /* Profit Factor ------------------------------------------------------- */
    {
      field: 'profit_factor',
      headerName: 'Profit\u00A0Factor',
      width: 150,
      headerAlign: 'center',
      align:'center',
      renderCell: ({ value }) =>
        value != null ? value.toFixed(2) : ''
    },

    /* Sharpe -------------------------------------------------------------- */
    {
      field: 'sharpe_ratio',
      headerName: 'Sharpe\u00A0Ratio',
      width: 150,
      headerAlign: 'center',
      align:'center',
      renderCell: ({ value }) =>
        value != null ? value.toFixed(2) : ''
    },

    /* Max DD -------------------------------------------------------------- */
    {
      field: 'max_drawdown',
      headerName: 'Max\u00A0Drawdown\u00A0(%)',
      width: 150,
      headerAlign: 'center',
      align:'center',
      renderCell: ({ value }) =>
        value != null ? value.toFixed(2) : ''
    },

    /* # trades ------------------------------------------------------------ */
    {
      field: 'num_trades',
      headerName: 'Trades',
      width: 150,
      type: 'number',
      headerAlign: 'center',
      align:'center'
    }
  ];

  /* ----- rows & click handler ------------------------------------------- */
  const rows  = results.map((r, i) => ({ id: i, ...r }));
  const onRow = useCallback(
    (params) => onRowClick && onRowClick(params.row),
    [onRowClick]
  );

  /* ----- render ---------------------------------------------------------- */
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        onRowClick={onRow}
        components={{ Toolbar: GridToolbar }}
        autoHeight
        rowHeight={70}
        sx={{
          '& .MuiDataGrid-columnHeaders': { background: 'rgba(0,0,0,.04)' },
          '& .MuiDataGrid-row:nth-of-type(even)': { background: 'rgba(0,0,0,.02)' }
        }}
      />
    </Paper>
  );
}
