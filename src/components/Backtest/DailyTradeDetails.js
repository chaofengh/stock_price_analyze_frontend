import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

export default function DailyTradeDetails({ dailyTrades }) {
  if (!dailyTrades || dailyTrades.length === 0)
    return <Typography>No trades for this day.</Typography>;

  const sorted = [...dailyTrades].sort(
    (a, b) => new Date(a.entry_time) - new Date(b.entry_time)
  );

  return (
    <>
      <Typography variant="subtitle1" gutterBottom>
        Trades – {new Date(sorted[0].entry_time).toLocaleDateString()}
      </Typography>

      {/* stickyHeader keeps column labels visible while scrolling */}
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Direction</TableCell>
            <TableCell align="right">Entry</TableCell>
            <TableCell align="right">Exit</TableCell>
            <TableCell align="right">PNL</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((t, i) => (
            <TableRow key={i}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{t.direction}</TableCell>
              <TableCell align="right">{t.entry_price.toFixed(2)}</TableCell>
              <TableCell align="right">{t.exit_price.toFixed(2)}</TableCell>
              <TableCell align="right" style={{ color: t.pnl >= 0 ? 'green' : 'red' }}>
                {t.pnl.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
