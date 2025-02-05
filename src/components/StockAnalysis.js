// StockAnalysis.js
import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { fetchStockSummary } from '../API/StockService';
import KpiTiles from './KpiTiles';
import StockChart from './StockChart';
import GroupedStats from './GroupedStats';

function StockAnalysis() {
  const [symbol, setSymbol] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWindow, setSelectedWindow] = useState('window_5');

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

  // Build eventMap for the StockChart (as before)
  const eventMap = useMemo(() => {
    if (!summary) return {};
    const windowData = summary[selectedWindow] || {};
    const map = {};
    function pushEvent(dateStr, eventObj) {
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(eventObj);
    }
    (windowData.upper_touch_pullbacks || []).forEach((pb) =>
      pushEvent(pb.touch_date || pb.hug_start_date, { type: 'upper_touch_pullback', ...pb })
    );
    (windowData.lower_touch_bounces || []).forEach((b) =>
      pushEvent(b.touch_date || b.hug_start_date, { type: 'lower_touch_bounce', ...b })
    );
    (windowData.upper_hug_pullbacks || []).forEach((pb) =>
      pushEvent(pb.hug_start_date || pb.touch_date, { type: 'upper_hug_pullback', ...pb })
    );
    (windowData.lower_hug_bounces || []).forEach((b) =>
      pushEvent(b.hug_start_date || b.touch_date, { type: 'lower_hug_bounce', ...b })
    );
    return map;
  }, [summary, selectedWindow]);

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              Stock Analysis
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
            >
              <TextField
                label="Enter Symbol"
                variant="outlined"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                size="small"
                sx={{ width: '160px' }}
              />
              <Button type="submit" variant="contained" size="large">
                Analyze
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            {/* This could be a banner image or tagline */}
            <Typography variant="subtitle1" align="right" color="textSecondary">
              Empowering your investment decisions.
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
          <CircularProgress size={48} />
        </Box>
      )}

      {error && (
        <Typography variant="h6" align="center" color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      )}

      {summary && !loading && (
        <Grid container spacing={3}>
          {/* Left Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper elevation={4} sx={{ p: 3, mb: 3 }}>
              <KpiTiles summary={summary} />
            </Paper>
            <Paper elevation={4} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Fundamentals
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">
                <strong>PE Ratio:</strong> {summary.PE_ratio ?? '-'}
              </Typography>
              <Typography variant="body1">
                <strong>PEG:</strong> {summary.PEG ?? '-'}
              </Typography>
            </Paper>
          </Grid>

          {/* Right Panel */}
          <Grid item xs={12} md={8}>
            <Paper elevation={4} sx={{ p: 3, mb: 3 }}>
              <StockChart summary={summary} eventMap={eventMap} />
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Short-Term Window for Chart Events:
                </Typography>
                <RadioGroup
                  row
                  value={selectedWindow}
                  onChange={(e) => setSelectedWindow(e.target.value)}
                  sx={{ justifyContent: 'center' }}
                >
                  <FormControlLabel value="window_5" control={<Radio />} label="5-Day" />
                  <FormControlLabel value="window_10" control={<Radio />} label="10-Day" />
                </RadioGroup>
              </Box>
            </Paper>
            <Paper elevation={4} sx={{ p: 3 }}>
              <GroupedStats summary={summary} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default StockAnalysis;
