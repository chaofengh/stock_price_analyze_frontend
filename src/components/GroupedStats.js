import React, { useState } from 'react';
import { Box, Tabs, Tab, Grid, Typography, Divider } from '@mui/material';
import DualStatCard from './DualStatCard';

const formatMetric = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) {
    return { formatted: '-', trend: null };
  }
  const formatted = Number(num).toFixed(decimals);
  const trend = Number(num) > 0 ? 'up' : Number(num) < 0 ? 'down' : null;
  return { formatted, trend };
};

const GroupedStats = ({ summary }) => {
  const [tab, setTab] = useState(0);
  if (!summary) return null;
  const agg5 = summary.aggregated_window_5 || {};
  const agg10 = summary.aggregated_window_10 || {};

  // For the metrics where you want to remove the arrows, we add disableTrend: true.
  const resistanceTouchMetrics = [
    { label: 'Avg Upper Touch Drop', key: 'avg_upper_touch_drop', decimals: 2 },
    { label: 'Drop Duration (Days)', key: 'avg_upper_touch_in_days', decimals: 1, disableTrend: true },
    { label: 'Accuracy', key: 'upper_touch_accuracy', decimals: 0, disableTrend: true },
    { label: 'Touch Count', key: 'upper_touch_count', decimals: 0, disableTrend: true },
  ];
  const resistanceHugMetrics = [
    { label: 'Avg Upper Hug Drop', key: 'avg_upper_hug_drop', decimals: 2 },
    { label: 'Avg Upper Hug Change', key: 'avg_upper_hug_change', decimals: 2 },
    { label: 'Hug Drop Duration (Days)', key: 'avg_upper_hug_drop_in_days', decimals: 1, disableTrend: true },
    { label: 'Avg Hug Length (Days)', key: 'avg_upper_hug_length_in_days', decimals: 1, disableTrend: true },
    { label: 'Hug Touch Count', key: 'avg_upper_hug_touch_count', decimals: 0, disableTrend: true },
  ];
  const supportTouchMetrics = [
    { label: 'Avg Lower Touch Bounce', key: 'avg_lower_touch_bounce', decimals: 2 },
    { label: 'Bounce Duration (Days)', key: 'avg_lower_touch_bounce_in_days', decimals: 1, disableTrend: true },
    { label: 'Accuracy', key: 'lower_touch_accuracy', decimals: 0, disableTrend: true },
    { label: 'Touch Count', key: 'lower_touch_count', decimals: 0, disableTrend: true }
  ];
  const supportHugMetrics = [
    { label: 'Avg Lower Hug Bounce', key: 'avg_lower_hug_bounce', decimals: 2 },
    { label: 'Avg Lower Hug Change', key: 'avg_lower_hug_change', decimals: 2 },
    { label: 'Bounce Duration (Days)', key: 'avg_lower_hug_bounce_in_days', decimals: 1, disableTrend: true },
    { label: 'Avg Hug Length (Days)', key: 'avg_lower_hug_length_in_days', decimals: 1, disableTrend: true },
    { label: 'Hug Touch Count', key: 'avg_lower_hug_touch_count', decimals: 0, disableTrend: true },
  ];

  const handleTabChange = (event, newValue) => setTab(newValue);

  const renderMetrics = (metrics) =>
    metrics.map((metric, index) => {
      const num5 = agg5[metric.key];
      const num10 = agg10[metric.key];

      // If the metric is "Accuracy", multiply the values by 100.
      const value5 = metric.label === 'Accuracy' ? num5 * 100 : num5;
      const value10 = metric.label === 'Accuracy' ? num10 * 100 : num10;

      let { formatted: formatted5, trend: trend5 } = formatMetric(value5, metric.decimals);
      let { formatted: formatted10, trend: trend10 } = formatMetric(value10, metric.decimals);

      // Append percentage sign for Accuracy metrics.
      if (metric.label === 'Accuracy') {
        formatted5 = `${formatted5}%`;
        formatted10 = `${formatted10}%`;
      }

      // Override trend values to null if disableTrend is set.
      const finalTrend5 = metric.disableTrend ? null : trend5;
      const finalTrend10 = metric.disableTrend ? null : trend10;

      return (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <DualStatCard
            label={metric.label}
            trend5={finalTrend5}
            value5={formatted5}
            trend10={finalTrend10}
            value10={formatted10}
          />
        </Grid>
      );
    });

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        centered
        sx={{ mb: 3 }}
      >
        <Tab label="Resistance" />
        <Tab label="Support" />
      </Tabs>
      {tab === 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Touch Metrics
          </Typography>
          <Grid container spacing={2}>
            {renderMetrics(resistanceTouchMetrics)}
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Hug Metrics
          </Typography>
          <Grid container spacing={2}>
            {renderMetrics(resistanceHugMetrics)}
          </Grid>
        </Box>
      )}
      {tab === 1 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Touch Metrics
          </Typography>
          <Grid container spacing={2}>
            {renderMetrics(supportTouchMetrics)}
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Hug Metrics
          </Typography>
          <Grid container spacing={2}>
            {renderMetrics(supportHugMetrics)}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default GroupedStats;
