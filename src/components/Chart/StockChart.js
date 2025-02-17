import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  // If you were using time-based scales, you’d also import TimeScale, etc.
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { useTouchEventTypes, useTouchTooltipMappings } from './useTouchMappings';
import { useHugEventTypes, useHugTooltipMappings } from './useHugMappings';
import { useChartData } from './useChartData';
import { useExternalTooltipHandler } from './TooltipHandler';

// Custom plugin to draw a vertical line + date label
const CrosshairLinePlugin = {
  id: 'crosshairLinePlugin',
  afterDatasetsDraw(chart) {
    // If we haven't hovered over a point yet, do nothing
    if (chart.$currentHoverIndex == null) return;

    const { ctx, chartArea, scales } = chart;
    const hoverIndex = chart.$currentHoverIndex;
    const xScale = scales.x;

    // Convert the hovered data index to an x pixel
    const xPixel = xScale.getPixelForValue(hoverIndex);
    if (Number.isNaN(xPixel)) return; // safety check

    // Draw the vertical line
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xPixel, chartArea.top);
    ctx.lineTo(xPixel, chartArea.bottom);
    ctx.lineWidth = 1;
    // Light/semi-transparent line; adjust color as needed
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.stroke();
    ctx.restore();

    // Now draw the date label above the line
    const rawDate = chart.data.labels?.[hoverIndex];
    if (!rawDate) return;

    const dateLabel = rawDate; // "YYYY-MM-DD" or however your labels look

    ctx.save();
    ctx.font = '12px Roboto, sans-serif';
    ctx.fillStyle = '#000';
    const textWidth = ctx.measureText(dateLabel).width;
    // Center the text horizontally above the line
    const textX = xPixel - textWidth / 2;
    // Place it a few pixels above the chart area
    const textY = chartArea.top - 6;
    ctx.fillText(dateLabel, textX, textY);
    ctx.restore();
  },
};

// Register the plugin + necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  CrosshairLinePlugin
);

function StockChart({ summary, eventMap, onHoverPriceChange }) {
  // Helper: convert date to YYYY-MM-DD
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toISOString().split('T')[0];
  };

  // Touch/Hug event + tooltip mappings
  const eventTypeMappingTouch = useTouchEventTypes(summary, formatDate);
  const tooltipMappingTouch = useTouchTooltipMappings(summary, formatDate);
  const eventTypeMappingHug = useHugEventTypes(summary, formatDate);
  const tooltipMappingHug = useHugTooltipMappings(summary, formatDate);

  // Build datasets & labels
  const data = useChartData(summary, eventTypeMappingTouch, eventTypeMappingHug);

  // External tooltip logic
  const externalTooltipHandler = useExternalTooltipHandler();

  // onHover: store the hovered index on chart, call parent's callback if any
  const handleHover = useCallback(
    (event, chartElements, chart) => {
      if (!summary?.chart_data) return;

      if (chartElements.length) {
        const elem = chartElements[0];
        chart.$currentHoverIndex = elem.index; // store for crosshair plugin
        const hoveredPoint = summary.chart_data[elem.index];

        // Let the parent know which price is hovered (for roller effect)
        onHoverPriceChange?.({
          date: hoveredPoint.date,
          price: hoveredPoint.close,
        });
      } else {
        chart.$currentHoverIndex = null;
        onHoverPriceChange?.(null);
      }

      // Force re-draw so the crosshair line updates
      chart.update('none'); // 'none' = no animation
    },
    [summary, onHoverPriceChange]
  );

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      // Using a category scale for x so that getPixelForValue(hoverIndex) works
      x: {
        type: 'category',
        display: false,
        grid: { display: false },
      },
      y: {
        display: false,
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
        callbacks: {
          label: function (context) {
            const dataIndex = context.dataIndex;
            const datasetIndex = context.datasetIndex;
            // We can still get the raw chartPoint from summary
            const chartPoint = summary.chart_data[dataIndex];
            const pointDate = summary.chart_data[dataIndex].date;

            // Hug or Touch tooltip lines
            if (chartPoint.isHug && tooltipMappingHug[pointDate]) {
              return tooltipMappingHug[pointDate];
            }
            if (chartPoint.isTouch && tooltipMappingTouch[pointDate]) {
              return tooltipMappingTouch[pointDate];
            }
            // Default fallback
            return `Close: ${context.parsed.y}`;
          },
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    onHover: handleHover,
  };

  return (
    <Box sx={{ height: 400, mb: 3, position: 'relative' }}>
      <Line data={data} options={chartOptions} />
    </Box>
  );
}

export default StockChart;
