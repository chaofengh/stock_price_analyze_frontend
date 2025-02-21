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
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';

import { useTouchEventTypes, useTouchTooltipMappings } from './useTouchMappings';
import { useHugEventTypes, useHugTooltipMappings } from './useHugMappings';
import { useChartData } from './useChartData';
import { useExternalTooltipHandler } from './TooltipHandler';

// Custom plugin to draw a vertical line + date label
const CrosshairLinePlugin = {
  id: 'crosshairLinePlugin',
  afterDatasetsDraw(chart) {
    if (chart.$currentHoverIndex == null) return;

    const { ctx, chartArea, scales } = chart;
    const hoverIndex = chart.$currentHoverIndex;
    const xScale = scales.x;

    const xPixel = xScale.getPixelForValue(hoverIndex);
    if (Number.isNaN(xPixel)) return;

    // Draw vertical line
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xPixel, chartArea.top);
    ctx.lineTo(xPixel, chartArea.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.stroke();
    ctx.restore();

    // Draw date label
    const rawDate = chart.data.labels?.[hoverIndex];
    if (!rawDate) return;

    ctx.save();
    ctx.font = 'bold 16px Roboto, sans-serif';
    ctx.fillStyle = '#000';
    const textWidth = ctx.measureText(rawDate).width;
    const textX = xPixel - textWidth / 2;
    const textY = chartArea.top + 12;
    ctx.fillText(rawDate, textX, textY);
    ctx.restore();
  },
};

// Register everything
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  CrosshairLinePlugin,
  zoomPlugin
);

function StockChart({ summary, eventMap, onHoverPriceChange }) {
  // Helper: convert date to YYYY-MM-DD
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toISOString().split('T')[0];
  };

  // Build data + color mappings
  const eventTypeMappingTouch = useTouchEventTypes(summary, formatDate);
  const tooltipMappingTouch = useTouchTooltipMappings(summary, formatDate);
  const eventTypeMappingHug = useHugEventTypes(summary, formatDate);
  const tooltipMappingHug = useHugTooltipMappings(summary, formatDate);

  const data = useChartData(summary, eventTypeMappingTouch, eventTypeMappingHug);
  const externalTooltipHandler = useExternalTooltipHandler();

  // onHover logic (crosshair)
  const handleHover = useCallback(
    (event, chartElements, chart) => {
      if (!summary?.chart_data) return;

      if (event.type === 'mouseout') {
        if (chart.$currentHoverIndex != null) {
          chart.$currentHoverIndex = null;
          onHoverPriceChange?.(null);
          chart.update('none');
        }
        return;
      }

      if (!chartElements.length) {
        if (chart.$currentHoverIndex != null) {
          chart.$currentHoverIndex = null;
          onHoverPriceChange?.(null);
          chart.update('none');
        }
        return;
      }

      const newHoverIndex = chartElements[0].index;
      if (newHoverIndex === chart.$currentHoverIndex) {
        return;
      }

      chart.$currentHoverIndex = newHoverIndex;

      const hoveredPoint = summary.chart_data[newHoverIndex];
      onHoverPriceChange?.({
        date: hoveredPoint.date,
        price: hoveredPoint.close,
      });

      chart.update('none');
    },
    [summary, onHoverPriceChange]
  );

  // We'll handle the "zoom complete" event to compute price difference
  const handleZoomComplete = useCallback(({ chart }) => {
    // Because x is a category scale, .min/.max are numeric indexes
    const xScale = chart.scales.x;
    const minIndex = Math.floor(xScale.min);
    const maxIndex = Math.ceil(xScale.max);

    // If out of bounds, clamp
    const clampedMin = Math.max(0, minIndex);
    const clampedMax = Math.min(summary.chart_data.length - 1, maxIndex);

    const points = summary.chart_data.slice(clampedMin, clampedMax + 1);
    if (points.length < 2) {
      console.log('Not enough points in the zoomed range.');
      return;
    }

    const firstPrice = points[0].close;
    const lastPrice = points[points.length - 1].close;
    const diff = lastPrice - firstPrice;
    const pct = (diff / firstPrice) * 100;
    
    // For now, just log it; you could store in state to display
    console.log(
      `Zoom Range Price Change: $${diff.toFixed(2)} (${pct.toFixed(2)}%)`
    );
  }, [summary]);

  // Chart options, enabling "drag to zoom" in the x direction
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 20 }
    },
    scales: {
      x: {
        type: 'category', // indexes
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
            const chartPoint = summary.chart_data[dataIndex];
            const pointDate = chartPoint?.date;

            if (chartPoint.isHug && tooltipMappingHug[pointDate]) {
              return tooltipMappingHug[pointDate];
            }
            if (chartPoint.isTouch && tooltipMappingTouch[pointDate]) {
              return tooltipMappingTouch[pointDate];
            }
            return `Close: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
      // chartjs-plugin-zoom config
      zoom: {
        zoom: {
          drag: {
            enabled: true,     // Click+drag to zoom
            backgroundColor: 'rgba(0,0,0,0.2)' // optional highlight color
          },
          mode: 'x',          // Zoom in the x direction
          onZoomComplete: handleZoomComplete
        },
        pan: {
          enabled: true,      // Allow panning
          mode: 'x'
        }
      }
    },
    // For crosshair hover
    interaction: {
      mode: 'point',
      intersect: true,
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
