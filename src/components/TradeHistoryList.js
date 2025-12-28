import React from "react";
import {
  Paper,
  Chip,
  List,
  ListItem,
  Typography,
  Stack,
  Divider,
  Box,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

/* ───────── helpers ───────── */
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const cash = (n) => `$${Math.abs(n).toFixed(2)}`;
const pct = (n, base) => `${((Math.abs(n) / base) * 100).toFixed(2)}%`;
const equalOutcome = (a, b) =>
  a && b && a.exitPrice === b.exitPrice && a.profit$ === b.profit$ && a.days === b.days;

/* ───────── collect + group ───────── */
const buildGroupedTrades = (summary = {}) => {
  const list = [];

  const add = (arr, side, w) =>
    arr?.forEach((t) => {
      const key = `${t.touch_date}-${side}`;
      let holder = list.find((itm) => itm.key === key);
      if (!holder) {
        holder = {
          key,
          entryDate: t.touch_date,
          entryPrice: t.touch_price,
          side,
          windows: {},
        };
        list.push(holder);
      }
      const isLong = side === "Long";
      holder.windows[w] = {
        exitPrice: isLong ? t.peak_price : t.trough_price,
        profit$: isLong ? t.bounce_dollars : -t.drop_dollars,
        days: t.trading_days,
      };
    });

  add(summary?.window_5?.lower_touch_bounces, "Long", 5);
  add(summary?.window_10?.lower_touch_bounces, "Long", 10);
  add(summary?.window_5?.upper_touch_pullbacks, "Short", 5);
  add(summary?.window_10?.upper_touch_pullbacks, "Short", 10);

  return list.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
};

/* ───────── component ───────── */
const TradeHistoryList = ({ summary }) => {
  const trades = buildGroupedTrades(summary);

  return (
    <div>
      <Typography variant="h6" gutterBottom sx={{ textAlign: "center" }}>
        Performance Blotter
      </Typography>

      <List dense disablePadding>
        {trades.map((t) => {
          /* if the D5 & D10 stats are identical, keep only D5 */
          const hasDup =
            t.windows[5] && t.windows[10] && equalOutcome(t.windows[5], t.windows[10]);
          const renderOrder = hasDup ? [5] : [5, 10].filter((w) => t.windows[w]);

          const borderColour =
            (t.windows[5] || t.windows[10]).profit$ >= 0 ? "success.main" : "error.main";

          return (
            <ListItem key={t.key} sx={{ px: 0, py: 1.5 }}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderLeft: 4,
                  borderColor: borderColour,
                  width: "100%",
                }}
              >
                {/* entry date + side */}
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {fmtDate(t.entryDate)}
                  </Typography>
                  <Chip
                    size="small"
                    icon={t.side === "Long" ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    label={t.side}
                    color={t.side === "Long" ? "success" : "error"}
                    variant="outlined"
                  />
                </Stack>

                {renderOrder.map((w, idx) => {
                  const wData = t.windows[w];
                  const colour = wData.profit$ >= 0 ? "success.main" : "error.main";
                  return (
                    <Box key={w}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1.5}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip size="small" label={`D${w}`} variant="outlined" />
                          <Typography variant="body2">
                            {`${cash(t.entryPrice)} → ${cash(wData.exitPrice)} • ${wData.days}d`}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ color: colour, minWidth: 90, textAlign: "right" }}
                        >
                          {wData.profit$ >= 0 ? "+" : "-"}
                          {cash(wData.profit$)} ({pct(wData.profit$, t.entryPrice)})
                        </Typography>
                      </Stack>
                      {idx < renderOrder.length - 1 && <Divider sx={{ my: 1.25 }} />}
                    </Box>
                  );
                })}
              </Paper>
            </ListItem>
          );
        })}

        {!trades.length && (
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ width: "100%", textAlign: "center", py: 2 }}
          >
            No trades found.
          </Typography>
        )}
      </List>
    </div>
  );
};

export default TradeHistoryList;
