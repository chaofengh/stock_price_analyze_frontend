import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box
} from '@mui/material';

function DailyTradeDetails({ dailyTrades }) {
  // Copy and sort trades from newest to oldest by entry_time
  const sortedTrades = [...dailyTrades].sort(
    (a, b) => new Date(b.entry_time) - new Date(a.entry_time)
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Daily Trade Details (Latest to Oldest)
      </Typography>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow
            sx={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'background.paper',
              zIndex: 1,
            }}
          >
            <TableCell>Trade #</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Direction</TableCell>
            <TableCell>Entry Price</TableCell>
            <TableCell>Exit Price</TableCell>
            <TableCell>PNL</TableCell>
            <TableCell>Entry Time</TableCell>
            <TableCell>Exit Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTrades.map((trade, idx) => {
            const tradeIndex = sortedTrades.length - idx; // or just idx+1 in reverse
            const entryDate = new Date(trade.entry_time);
            const exitDate = trade.exit_time ? new Date(trade.exit_time) : null;
            const pnlColor = trade.pnl >= 0 ? 'green' : 'red';

            return (
              <TableRow
                key={idx}
                sx={{ '&:nth-of-type(even)': { backgroundColor: 'action.hover' } }}
              >
                <TableCell>
                  {`Trade ${tradeIndex}`}
                </TableCell>
                <TableCell>
                  {entryDate.toLocaleDateString()}
                </TableCell>
                <TableCell>{trade.direction}</TableCell>
                <TableCell>{trade.entry_price.toFixed(3)}</TableCell>
                <TableCell>{trade.exit_price.toFixed(3)}</TableCell>
                <TableCell sx={{ color: pnlColor, fontWeight: 'bold' }}>
                  {trade.pnl.toFixed(2)}
                </TableCell>
                <TableCell>
                  {entryDate.toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  {exitDate ? exitDate.toLocaleTimeString() : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

export default DailyTradeDetails;
