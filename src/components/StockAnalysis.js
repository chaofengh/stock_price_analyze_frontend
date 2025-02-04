// StockAnalysis.js
import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from '@mui/material';

import { fetchStockSummary } from '../API/StockService';
import KpiTiles from './KpiTiles';
import StockChart from './StockChart';
import StatsColumns from './GroupedStats';

function toIsoDateString(dateObjOrStr) {
  if (/\d{4}-\d{2}-\d{2}/.test(dateObjOrStr)) return dateObjOrStr;
  const d = new Date(dateObjOrStr);
  return d.toISOString().slice(0, 10);
}

function StockAnalysis() {
  const [symbol, setSymbol] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol) return;

    setLoading(true);
    setError('');
    setSummary(null);

    try {
      const data = await fetchStockSummary(symbol);
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const eventMap = useMemo(() => {
    if (!summary) return {};
    const map = {};
    function pushEvent(dateStr, eventObj) {
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(eventObj);
    }

    (summary.upper_touch_pullbacks || []).forEach((pb) => {
      pushEvent(toIsoDateString(pb.touch_date), { type: 'upper_touch_pullback', ...pb });
    });
    (summary.lower_touch_bounces || []).forEach((b) => {
      pushEvent(toIsoDateString(b.touch_date), { type: 'lower_touch_bounce', ...b });
    });
    (summary.upper_hug_pullbacks || []).forEach((pb) => {
      pushEvent(toIsoDateString(pb.hug_start_date), { type: 'upper_hug_pullback', ...pb });
    });
    (summary.lower_hug_bounces || []).forEach((b) => {
      pushEvent(toIsoDateString(b.hug_start_date), { type: 'lower_hug_bounce', ...b });
    });
    return map;
  }, [summary]);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Stock Analysis
      </Typography>

      {/* Symbol Input Form */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', gap: 2, mb: 3 }}
      >
        <TextField
          label="Enter Stock Symbol"
          variant="outlined"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          fullWidth
        />
        <Button type="submit" variant="contained" sx={{ minWidth: 120 }}>
          Analyze
        </Button>
      </Box>

      {/* Loading & Error */}
      {loading && (
        <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Results */}
      {summary && !loading && (
        <Card elevation={4} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analysis for {summary.symbol.toUpperCase()}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* KPI Tiles */}
            <KpiTiles summary={summary} />

            {/* Stock Chart */}
            <StockChart summary={summary} eventMap={eventMap} />

            {/* Stats Columns */}
            <StatsColumns summary={summary} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default StockAnalysis;
