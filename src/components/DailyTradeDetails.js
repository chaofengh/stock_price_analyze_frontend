import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography, Box } from '@mui/material';

function DailyTradeDetails({ dailyTrades }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Daily Trade Details (Latest to Oldest)
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
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
          {[...dailyTrades]
            .sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time))
            .map((trade, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  {new Date(trade.entry_time).toLocaleDateString()}
                </TableCell>
                <TableCell>{trade.direction}</TableCell>
                <TableCell>{trade.entry_price}</TableCell>
                <TableCell>{trade.exit_price}</TableCell>
                <TableCell>{trade.pnl.toFixed(2)}</TableCell>
                <TableCell>
                  {trade.entry_time
                    ? new Date(trade.entry_time).toLocaleTimeString()
                    : '-'}
                </TableCell>
                <TableCell>
                  {trade.exit_time
                    ? new Date(trade.exit_time).toLocaleTimeString()
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default DailyTradeDetails;
