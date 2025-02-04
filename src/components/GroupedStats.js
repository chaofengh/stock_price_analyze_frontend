// GroupedStats.js
import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StatCard from './StatCard';

const GroupedStats = ({ summary }) => {
  if (!summary) return null;

  // Define groups with related stats.
  const groups = [
    {
      title: 'Lower Hug Metrics',
      stats: [
        {
          label: 'Avg Lower Hug Bounce',
          value:
            summary.avg_lower_hug_bounce !== undefined
              ? summary.avg_lower_hug_bounce.toFixed(2)
              : '-',
          change:
            summary.avg_lower_hug_change !== undefined
              ? summary.avg_lower_hug_change.toFixed(2)
              : null,
        },
        {
          label: 'Lower Hug Bounce (Days)',
          value:
            summary.avg_lower_hug_bounce_in_days !== undefined
              ? summary.avg_lower_hug_bounce_in_days.toFixed(1)
              : '-',
        },
        {
          label: 'Avg Lower Hug Length',
          value:
            summary.avg_lower_hug_length !== undefined
              ? summary.avg_lower_hug_length.toFixed(1)
              : '-',
        },
        {
          label: 'Lower Hug Touch Count',
          value:
            summary.avg_lower_hug_touch_count !== undefined
              ? summary.avg_lower_hug_touch_count.toFixed(1)
              : '-',
        },
      ],
    },
    {
      title: 'Lower Touch Metrics',
      stats: [
        {
          label: 'Avg Lower Touch Bounce',
          value:
            summary.avg_lower_touch_bounce !== undefined
              ? summary.avg_lower_touch_bounce.toFixed(2)
              : '-',
        },
        {
          label: 'Lower Touch Bounce (Days)',
          value:
            summary.avg_lower_touch_bounce_in_days !== undefined
              ? summary.avg_lower_touch_bounce_in_days.toFixed(1)
              : '-',
        },
      ],
    },
    {
      title: 'Upper Hug Metrics',
      stats: [
        {
          label: 'Avg Upper Hug Change',
          value:
            summary.avg_upper_hug_change !== undefined
              ? summary.avg_upper_hug_change.toFixed(2)
              : '-',
        },
        {
          label: 'Avg Upper Hug Drop',
          value:
            summary.avg_upper_hug_drop !== undefined
              ? summary.avg_upper_hug_drop.toFixed(2)
              : '-',
        },
        {
          label: 'Upper Hug Drop (Days)',
          value:
            summary.avg_upper_hug_drop_in_days !== undefined
              ? summary.avg_upper_hug_drop_in_days.toFixed(1)
              : '-',
        },
        {
          label: 'Avg Upper Hug Length',
          value:
            summary.avg_upper_hug_length !== undefined
              ? summary.avg_upper_hug_length.toFixed(1)
              : '-',
        },
        {
          label: 'Upper Hug Touch Count',
          value:
            summary.avg_upper_hug_touch_count !== undefined
              ? summary.avg_upper_hug_touch_count.toFixed(1)
              : '-',
        },
      ],
    },
    {
      title: 'Upper Touch Metrics',
      stats: [
        {
          label: 'Avg Upper Touch Drop',
          value:
            summary.avg_upper_touch_drop !== undefined
              ? summary.avg_upper_touch_drop.toFixed(2)
              : '-',
        },
        {
          label: 'Upper Touch Drop (Days)',
          value:
            summary.avg_upper_touch_in_days !== undefined
              ? summary.avg_upper_touch_in_days.toFixed(1)
              : '-',
        },
      ],
    },
    {
      title: 'Overall Metrics',
      stats: [
        {
          label: 'Lower Touches Count',
          value:
            summary.lower_touches_count !== undefined
              ? summary.lower_touches_count
              : '-',
        },
        {
          label: 'Total Touches',
          value:
            summary.total_touches !== undefined
              ? summary.total_touches
              : '-',
        },
        {
          label: 'Trading Days',
          value:
            summary.trading_days !== undefined
              ? summary.trading_days
              : '-',
        },
      ],
    },
  ];

  return (
    <div>
      {groups.map((group, groupIndex) => (
        <Accordion key={groupIndex} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{group.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {group.stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <StatCard
                    label={stat.label}
                    value={stat.value}
                    change={stat.change}
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
};

export default GroupedStats;
