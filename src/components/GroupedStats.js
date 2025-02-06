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

  const resistanceTouchMetrics = [
    { label: 'Avg Upper Touch Drop', key: 'avg_upper_touch_drop', decimals: 2 },
    { label: 'Drop Duration (Days)', key: 'avg_upper_touch_in_days', decimals: 1 },
  ];
  const resistanceHugMetrics = [
    { label: 'Avg Upper Hug Change', key: 'avg_upper_hug_change', decimals: 2 },
    { label: 'Avg Upper Hug Drop', key: 'avg_upper_hug_drop', decimals: 2 },
    { label: 'Hug Drop Duration (Days)', key: 'avg_upper_hug_drop_in_days', decimals: 1 },
    { label: 'Avg Hug Length (Days)', key: 'avg_upper_hug_length_in_days', decimals: 1 },
    { label: 'Hug Touch Count', key: 'avg_upper_hug_touch_count', decimals: 0 },
  ];
  const supportTouchMetrics = [
    { label: 'Avg Lower Touch Bounce', key: 'avg_lower_touch_bounce', decimals: 2 },
    { label: 'Bounce Duration (Days)', key: 'avg_lower_touch_bounce_in_days', decimals: 1 },
  ];
  const supportHugMetrics = [
    { label: 'Avg Lower Hug Change', key: 'avg_lower_hug_change', decimals: 2 },
    { label: 'Avg Lower Hug Bounce', key: 'avg_lower_hug_bounce', decimals: 2 },
    { label: 'Bounce Duration (Days)', key: 'avg_lower_hug_bounce_in_days', decimals: 1 },
    { label: 'Avg Hug Length (Days)', key: 'avg_lower_hug_length_in_days', decimals: 1 },
    { label: 'Hug Touch Count', key: 'avg_lower_hug_touch_count', decimals: 0 },
  ];

  const handleTabChange = (event, newValue) => setTab(newValue);

  const renderMetrics = (metrics) =>
    metrics.map((metric, index) => {
      const num5 = agg5[metric.key];
      const num10 = agg10[metric.key];
      const { formatted: formatted5, trend: trend5 } = formatMetric(num5, metric.decimals);
      const { formatted: formatted10, trend: trend10 } = formatMetric(num10, metric.decimals);
      return (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <DualStatCard
            label={metric.label}
            value5={formatted5}
            trend5={trend5}
            value10={formatted10}
            trend10={trend10}
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
