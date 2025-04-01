import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  Paper
} from '@mui/material';

function AggregatedResultsTable({ results, order, orderBy, onSort, onRowClick }) {
  return (
    <Paper elevation={3} sx={{ mt: 2, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Aggregated Results
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            {[
              { id: 'scenario_name', label: 'Scenario', align: 'left' },
              { id: 'win_rate', label: 'Win Rate', align: 'right' },
              { id: 'profit_factor', label: 'Profit Factor', align: 'right' },
              { id: 'sharpe_ratio', label: 'Sharpe Ratio', align: 'right' },
              { id: 'max_drawdown', label: 'Max DD', align: 'right' },
              { id: 'num_trades', label: '# Trades', align: 'right' },
              { id: 'net_pnl', label: 'Net PNL', align: 'right' }
            ].map((headCell) => (
              <TableCell key={headCell.id} align={headCell.align}>
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : 'asc'}
                  onClick={() => onSort(headCell.id)}
                >
                  <strong>{headCell.label}</strong>
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((item, index) => (
            <TableRow
              key={index}
              onClick={() => onRowClick(item)}
              sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
            >
              <TableCell>{item.scenario_name}</TableCell>
              <TableCell align="right">{item.win_rate}</TableCell>
              <TableCell align="right">{item.profit_factor}</TableCell>
              <TableCell align="right">{item.sharpe_ratio}</TableCell>
              <TableCell align="right">{item.max_drawdown}</TableCell>
              <TableCell align="right">{item.num_trades}</TableCell>
              <TableCell align="right" sx={{ color: item.net_pnl < 0 ? 'red' : 'green' }}>
                {item.net_pnl?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
        Click a row to view daily trade details on a calendar.
      </Typography>
    </Paper>
  );
}

export default AggregatedResultsTable;
