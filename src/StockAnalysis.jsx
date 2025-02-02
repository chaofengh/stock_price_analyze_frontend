import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import 'chart.js/auto';
import { Line } from 'react-chartjs-2';

// Your existing API call
import { fetchStockSummary } from './API/StockService';

// A helper to convert a Python date string (e.g. "Mon, 06 Jan 2025...") to "2025-01-06"
function toIsoDateString(dateObjOrStr) {
  // 1) If it's already "YYYY-MM-DD", just return it.
  if (/\d{4}-\d{2}-\d{2}/.test(dateObjOrStr)) return dateObjOrStr;

  // 2) Otherwise parse and reformat
  const d = new Date(dateObjOrStr);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
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

  /**
   * Build an event lookup so we can quickly find e.g. "upper_touch_pullbacks" by date.
   * We'll store them by their special date (touch_date, etc.) in a single map so that:
   *   eventMap["2025-01-06"] = [
   *       { type: "upper_touch_pullback", drop_dollars: X, ... },
   *       { type: "lower_touch_bounce", ...} // possibly more than one
   *   ]
   */

  const eventMap = useMemo(() => {
    if (!summary) return {};

    const map = {};

    function pushEvent(dateStr, eventObj) {
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(eventObj);
    }

    // 1) Upper touch pullbacks
    (summary.upper_touch_pullbacks || []).forEach((pb) => {
      const dStr = toIsoDateString(pb.touch_date);
      pushEvent(dStr, { type: 'upper_touch_pullback', ...pb });
    });

    // 2) Lower touch bounces
    (summary.lower_touch_bounces || []).forEach((b) => {
      const dStr = toIsoDateString(b.touch_date);
      pushEvent(dStr, { type: 'lower_touch_bounce', ...b });
    });

    // 3) Upper hug pullbacks
    (summary.upper_hug_pullbacks || []).forEach((pb) => {
      const dStr = toIsoDateString(pb.hug_start_date);
      pushEvent(dStr, { type: 'upper_hug_pullback', ...pb });
    });

    // 4) Lower hug bounces
    (summary.lower_hug_bounces || []).forEach((b) => {
      const dStr = toIsoDateString(b.hug_start_date);
      pushEvent(dStr, { type: 'lower_hug_bounce', ...b });
    });

    return map;
  }, [summary]);


  /**
   * Build the chart data with segment coloring.
   * We'll color a segment "orange" if BOTH endpoints are hugging. "red" if either is touching.
   * No dot is shown if isTouch/isHug is false (pointRadius=0).
   */
  const buildChartData = (chartData) => {
    if (!chartData) return {};

    const dataPoints = chartData.map((pt) => ({
      x: pt.date,
      y: pt.close,
      isTouch: pt.isTouch, // boolean
      isHug: pt.isHug      // boolean
    }));

    return {
      datasets: [
        {
          label: 'Stock Price',
          data: dataPoints,
          tension: 0.1,
          borderWidth: 2,
          segment: {
            borderColor: (ctx) => {
              const { p0, p1 } = ctx;
              const huggingSegment = p0?.raw?.isHug && p1?.raw?.isHug;
              const touchingSegment = p0?.raw?.isTouch || p1?.raw?.isTouch;
              if (huggingSegment) return 'orange'; // both are hugging
              if (touchingSegment) return 'red';   // either is touching
              return 'blue';                       // default
            },
          },
          // Only show points for touches/hugs
          pointRadius: (ctx) => {
            const raw = ctx.raw;
            return raw.isTouch || raw.isHug ? 5 : 0;
          },
          pointBackgroundColor: 'white',
          pointBorderColor: 'gray'
        }
      ]
    };
  };

  // Build the "options" to show a custom tooltip
  const chartOptions = useMemo(() => {
    if (!summary) return {};
    return {
      plugins: {
        tooltip: {
          // We'll build a custom "label" callback
          callbacks: {
            label: function (context) {
              const dateStr = context.raw.x; // e.g. "2025-01-06"
              console.log('dateStr:', dateStr);
              // Is there any special event info for this date in eventMap?
              const events = eventMap[dateStr];
              if (!events || events.length === 0) {
                // fallback: just show date & price
                return `Price: ${context.parsed.y}`;
              }

              // If we do have events, build custom lines
              // e.g. "Upper Touch Pullback: drop=$17.67, days=5"
              const lines = events.map((ev) => {
                switch (ev.type) {
                  case 'upper_touch_pullback':
                    return `Upper Touch Pullback:\n  drop=$${ev.drop_dollars.toFixed(2)} in ${ev.trading_days} days`;
                  case 'lower_touch_bounce':
                    return `Lower Touch Bounce:\n  bounce=$${ev.bounce_dollars.toFixed(2)} in ${ev.trading_days} days`;
                  case 'upper_hug_pullback':
                    return `Upper Hug Pullback:\n  drop=$${ev.drop_dollars.toFixed(2)} in ${ev.trading_days} days`;
                  case 'lower_hug_bounce':
                    return `Lower Hug Bounce:\n  bounce=$${ev.bounce_dollars.toFixed(2)} in ${ev.trading_days} days`;
                  default:
                    return 'Unknown event';
                }
              });

              // Return multiple lines. Chart.js will separate them automatically.
              return lines;
            }
          }
        }
      },
      scales: {
        x: {
          // Make sure we treat x as a category or time scale as needed
          type: 'category',
          // or: type: 'time', time: { unit: 'day', ... } if you'd like a time axis
        }
      }
    };
  }, [summary, eventMap]);

  const chartData = summary ? buildChartData(summary.chart_data) : null;

  // The columns with multiple rows for your stats
  const renderStatsColumns = () => {
    if (!summary) return null;
    const statsColumns = [
      {
        title: 'Upper Touches',
        rows: [
          { label: 'Count',           value: summary.upper_touches_count },
          { label: 'Avg drop ($)',    value: summary.avg_upper_touch_drop },
          { label: 'Avg days',        value: summary.avg_upper_touch_in_days }
        ]
      },
      {
        title: 'Lower Touches',
        rows: [
          { label: 'Count',           value: summary.lower_touches_count },
          { label: 'Avg bounce ($)',  value: summary.avg_lower_touch_bounce },
          { label: 'Avg days',        value: summary.avg_lower_touch_bounce_in_days }
        ]
      },
      {
        title: 'Upper Hugs',
        rows: [
          { label: 'Count',            value: summary.hug_events_upper_count },
          { label: 'Avg drop ($)',     value: summary.avg_upper_hug_drop },
          { label: 'Avg days',         value: summary.avg_upper_hug_drop_in_days },
          { label: 'Avg hug length',   value: summary.avg_upper_hug_length },
          { label: 'Avg hug change',   value: summary.avg_upper_hug_change },
          { label: 'Avg hug touches',  value: summary.avg_upper_hug_touch_count }
        ]
      },
      {
        title: 'Lower Hugs',
        rows: [
          { label: 'Count',            value: summary.hug_events_lower_count },
          { label: 'Avg bounce ($)',   value: summary.avg_lower_hug_bounce },
          { label: 'Avg days',         value: summary.avg_lower_hug_bounce_in_days },
          { label: 'Avg hug length',   value: summary.avg_lower_hug_length },
          { label: 'Avg hug change',   value: summary.avg_lower_hug_change },
          { label: 'Avg hug touches',  value: summary.avg_lower_hug_touch_count }
        ]
      }
    ];

    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {statsColumns.map((col) => (
          <Grid item xs={12} sm={6} md={3} key={col.title}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {col.title}
              </Typography>
              {col.rows.map((r) => (
                <Typography key={r.label} variant="body2" sx={{ mb: 0.5 }}>
                  <strong>{r.label}:</strong>{' '}
                  {r.value !== null && r.value !== undefined
                    ? r.value.toFixed?.(2) ?? r.value
                    : '-'}
                </Typography>
              ))}
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

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
        />
        <Button type="submit" variant="contained">
          Analyze
        </Button>
      </Box>

      {/* Loading & Error */}
      {loading && (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      )}
      {error && <Typography color="error">{error}</Typography>}

      {/* Results */}
      {summary && !loading && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analysis for {summary.symbol}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Chart */}
            {chartData && (
              <Box sx={{ height: 450 }}>
                <Line key={summary.symbol} data={chartData} options={chartOptions} />
              </Box>
            )}

            {/* Stats Columns */}
            {renderStatsColumns()}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default StockAnalysis;
