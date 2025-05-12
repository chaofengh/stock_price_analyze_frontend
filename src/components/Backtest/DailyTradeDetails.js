// DailyTradeDetails.jsx – enriched trade log with times, duration & chips
import React from "react";
import {
  Box,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Chip,
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";

export default function DailyTradeDetails({ dailyTrades = [] }) {
  if (!dailyTrades.length)
    return <Typography>No trades for this day.</Typography>;

  const trades = [...dailyTrades].sort(
    (a, b) => new Date(a.entry_time) - new Date(b.entry_time)
  );
  const fmt = ts =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
        Trades – {new Date(trades[0].entry_time).toLocaleDateString()}
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: 320 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Direction</TableCell>
              <TableCell align="right">Entry Time</TableCell>
              <TableCell align="right">Exit Time</TableCell>
              <TableCell align="right">Duration</TableCell>
              <TableCell align="right">Entry $</TableCell>
              <TableCell align="right">Exit $</TableCell>
              <TableCell align="right">PnL $</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map((t, i) => {
              const mins =
                (new Date(t.exit_time) - new Date(t.entry_time)) / 60000;
              const long = t.direction === "long";
              return (
                <TableRow key={t.id ?? i} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <Chip
                      label={long ? "Long" : "Short"}
                      icon={long ? <ArrowUpward /> : <ArrowDownward />}
                      size="small"
                      color={long ? "success" : "error"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{fmt(t.entry_time)}</TableCell>
                  <TableCell align="right">{fmt(t.exit_time)}</TableCell>
                  <TableCell align="right">{mins.toFixed(1)} min</TableCell>
                  <TableCell align="right">{t.entry_price.toFixed(2)}</TableCell>
                  <TableCell align="right">{t.exit_price.toFixed(2)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: t.pnl >= 0 ? "success.main" : "error.main",
                      fontWeight: 600,
                    }}
                  >
                    {t.pnl.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
