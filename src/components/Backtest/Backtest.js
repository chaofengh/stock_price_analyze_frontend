import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,

} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import AggregatedResultsTable from './AggregatedResultsTable';
import DailyTradeDetails      from './DailyTradeDetails';
import CalendarComponent      from './CalendarComponent';
import CandleChart            from '../CandleChart';

/* ───────────────────────── helpers ───────────────────────── */

const yyyymmdd = (d) => new Date(d).toISOString().slice(0, 10);

const aggregateDailyPnl = (trades) =>
  trades.reduce((acc, t) => {
    const k = yyyymmdd(t.entry_time);
    acc[k] = (acc[k] || 0) + t.pnl;
    return acc;
  }, {});

const nearestPoint = (array, when) =>
  array.reduce((best, d) =>
    Math.abs(d.date - when) < Math.abs(best.date - when) ? d : best
  );

/* ───────────────────────── component ───────────────────────── */

export default function Backtest() {
  /* ---------------- search & data ---------------- */
  const [ticker, setTicker]   = useState('');
  const [results, setResults] = useState([]);
  const [intradayAll, setIA]  = useState([]);
  const [loading, setLoad]    = useState(false);
  const [error, setErr]       = useState(null);

  /* ---------------- dialog state ---------------- */
  const [open, setOpen]           = useState(false);
  const [scenario, setScenario]   = useState(null);

  const [calendarVal, setCalVal]  = useState(new Date());
  const [heatMap, setHeatMap]     = useState({});
  const [selDate, setSelDate]     = useState(null);

  const [intradayDay, setIDay]    = useState([]);
  const [annotations, setAnno]    = useState([]);
  const [dayTrades, setDayTrades] = useState([]);

  const dialogRef = useRef(null);

  /* ---------------- handlers ---------------- */

  const handleSearch = async () => {
    if (!ticker) return;
    setLoad(true); setErr(null); setResults([]); setIA([]);

    try {
      const url = `${process.env.REACT_APP_summary_root_api}/backtest?ticker=${ticker.toUpperCase()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setResults(data.scenarios);
      setIA(data.intraday_data);
    } catch (e) {
      setErr(e.message || 'Unknown error');
    } finally {
      setLoad(false);
    }
  };

  const openScenario = (sc) => {
    setScenario(sc);
    setHeatMap(aggregateDailyPnl(sc.daily_trades));
    setOpen(true);
    setSelDate(null);
    setIDay([]); setAnno([]); setDayTrades([]);
  };

  /* pickDate now wrapped in useCallback so its identity
     only changes when `intradayAll` or `scenario` changes */
  const pickDate = useCallback(
    (dateObj) => {
      const dStr = yyyymmdd(dateObj);
      setCalVal(dateObj);
      setSelDate(dStr);

      /* slice candles */
      const candles = intradayAll
        .filter((r) => yyyymmdd(r.timestamp) === dStr)
        .map((r) => ({
          date: new Date(r.timestamp),
          open: r.open,
          high: r.high,
          low: r.low,
          close: r.close,
          volume: r.volume
        }));
      setIDay(candles);

      /* slice trades */
      if (scenario) {
        const trades = scenario.daily_trades.filter(
          (t) => yyyymmdd(t.entry_time) === dStr
        );
        setDayTrades(trades);

        const anns = [];
        trades.forEach((tr, i) => {
          const entry = new Date(tr.entry_time);
          const exit  = new Date(tr.exit_time);
          const p1 = nearestPoint(candles, entry);
          const p2 = nearestPoint(candles, exit);
          if (!p1 || !p2) return;
          const fill =
            tr.direction === 'long'
              ? 'rgba(0,128,0,.15)'
              : 'rgba(255,0,0,.15)';
          anns.push(
            { type: 'trade-rectangle', entryDate: p1.date, exitDate: p2.date, fill },
            { type: 'entry-marker', date: p1.date, tooltip: `Entry #${i + 1}` },
            {
              type: 'exit-marker',
              date: p2.date,
              tooltip: `Exit (PNL ${tr.pnl.toFixed(2)})`
            }
          );
        });
        setAnno(anns);
      }
    },
    [intradayAll, scenario]   // <-- dependencies
  );

  /* arrow‑key navigation */
  useEffect(() => {
    if (!open) return;
    const days = Object.keys(heatMap).sort();
    if (days.length === 0) return;

    const listener = (e) => {
      if (!selDate) return;
      const idx = days.indexOf(selDate);
      if (e.key === 'ArrowLeft' && idx > 0)  pickDate(new Date(days[idx - 1]));
      if (e.key === 'ArrowRight' && idx < days.length - 1) pickDate(new Date(days[idx + 1]));
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [open, selDate, heatMap, pickDate]);   // added pickDate here

  /* ---------------- theme ---------------- */
  const theme = createTheme({
    palette: { primary: { main: '#1976d2' } }
  });

  /* ---------------- render ---------------- */
  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* header */}
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Strategy Backtest
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Enter a ticker, run the grid search, then explore trades day‑by‑day.
        </Typography>

        {/* search box */}
        <Paper elevation={3} sx={{ p: 3, mb: 5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                sx={{ height: '100%' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* status */}
        {loading && (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* results table */}
        {results.length > 0 && (
          <AggregatedResultsTable results={results} onRowClick={openScenario} />
        )}

        {/* dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>{scenario?.filters || 'Scenario'}</DialogTitle>
          <DialogContent ref={dialogRef}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <CalendarComponent
                value={calendarVal}
                onChange={pickDate}
                heatMapData={heatMap}
              />
              <Box>
                {selDate && intradayDay.length ? (
                  <CandleChart data={intradayDay} annotations={annotations} />
                ) : (
                  <Typography color="text.secondary" align="center">
                    Pick a date…
                  </Typography>
                )}
              </Box>
              <DailyTradeDetails dailyTrades={dayTrades} />
            </Box>
          </DialogContent>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}
