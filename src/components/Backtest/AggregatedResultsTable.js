import React, { useCallback } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box, Paper, Chip, Typography } from '@mui/material';
import ArrowUpwardIcon  from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

/* colour helpers ----------------------------------------------------------- */
const chipBg = {
  OR:         '#90a4ae',
  VWAPFilter: '#ffe082',
  VolFilter:  '#fff59d',
  Reverse:    '#d1c4e9',
  ORB:        '#bbdefb'
};

/* component ---------------------------------------------------------------- */
export default function AggregatedResultsTable({ results = [], onRowClick }) {

  /* ----- derive best / worst safely ----- */
  const best  = results.length ? Math.max(...results.map(r => r.net_pnl)) : 0;
  const worst = results.length ? Math.min(...results.map(r => r.net_pnl)) : 0;

  /* ----- columns ----- */
  const columns = [
    /* scenario chips ------------------------------------------------------- */
    {
      field: 'scenario',
      headerName: 'Scenario',
      flex: 2,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label={row.strategy === 'backtest_orb' ? 'ORB' : 'Reverse'}
            size="small"
            sx={{
              background: chipBg[row.strategy === 'backtest_orb' ? 'ORB' : 'Reverse'],
              color: '#000'
            }}
          />
          {row.filters.split(' + ').map((c, i) => (
            <Chip
              key={i}
              label={c}
              size="small"
              sx={{ background: chipBg[c.split('=')[0]] || '#e0e0e0' }}
            />
          ))}
        </Box>
      )
    },

    /* net pnl -------------------------------------------------------------- */
    {
      field: 'net_pnl',
      headerName: 'Net PNL',
      width: 130,
      type: 'number',
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

    /* the four numeric metrics -------------------------------------------- */
    {
      field: 'win_rate',
      headerName: 'Win %',
      width: 90,
      type: 'number',
      valueFormatter: ({ value }) =>
        value != null ? `${(value * 100).toFixed(1)} %` : ''
    },
    {
      field: 'profit_factor',
      headerName: 'PF',
      width: 90,
      type: 'number',
      valueFormatter: ({ value }) =>
        value != null ? value.toFixed(2) : ''
    },
    {
      field: 'sharpe_ratio',
      headerName: 'Sharpe',
      width: 100,
      type: 'number',
      valueFormatter: ({ value }) =>
        value != null ? value.toFixed(2) : ''
    },
    {
      field: 'max_drawdown',
      headerName: 'Max DD',
      width: 100,
      type: 'number',
      valueFormatter: ({ value }) =>
        value != null ? value.toFixed(2) : ''
    },

    { field: 'num_trades', headerName: '#T', width: 80, type: 'number' }
  ];

  /* ----- rows & click handler ----- */
  const rows  = results.map((r, i) => ({ id: i, ...r }));
  const onRow = useCallback(
    (params) => onRowClick && onRowClick(params.row),
    [onRowClick]
  );

  /* ----- render ----- */
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
