import React, { useCallback, useState, useRef } from 'react';
import { Box, Paper, Typography, IconButton, Fade } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
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

// Custom plugin to draw a vertical crosshair line and date label
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
  // Ref for the chart instance to allow resetZoom functionality
  const chartRef = useRef(null);
  // State to hold the measurement info from dragging
  const [dragInfo, setDragInfo] = useState(null);

  // Helper: convert date to YYYY-MM-DD
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toISOString().split('T')[0];
  };

  // Build data and color mappings
  const eventTypeMappingTouch = useTouchEventTypes(summary, formatDate);
  const tooltipMappingTouch = useTouchTooltipMappings(summary, formatDate);
  const eventTypeMappingHug = useHugEventTypes(summary, formatDate);
  const tooltipMappingHug = useHugTooltipMappings(summary, formatDate);
  const data = useChartData(summary, eventTypeMappingTouch, eventTypeMappingHug);
  const externalTooltipHandler = useExternalTooltipHandler();

  // onHover logic for crosshair
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
      if (newHoverIndex === chart.$currentHoverIndex) return;
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

  // Compute price difference, capture start/end dates, and calculate duration on zoom complete
  const handleZoomComplete = useCallback(({ chart }) => {
    const xScale = chart.scales.x;
    // Since x is a category scale, .min/.max are numeric indexes
    const minIndex = Math.floor(xScale.min);
    const maxIndex = Math.ceil(xScale.max);
    // Clamp indices within data bounds
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
    const startDate = points[0].date;
    const endDate = points[points.length - 1].date;
    
    // Calculate duration in days
    const durationMs = new Date(endDate) - new Date(startDate);
    const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));
    
    // Update state to display overlay info
    setDragInfo({
      diff: diff.toFixed(2),
      pct: pct.toFixed(2),
      startDate,
      endDate,
      duration: durationDays,
    });
    
    // Uncomment the next line if you wish to reset zoom automatically after measurement
    // chart.resetZoom();
  }, [summary]);

  // Reset zoom and clear overlay when reset button is clicked
  const handleResetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
    setDragInfo(null);
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 20 } },
    scales: {
      x: { type: 'category', display: false, grid: { display: false } },
      y: { display: false, grid: { display: false } },
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
      zoom: {
        zoom: {
          drag: {
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.2)'
          },
          mode: 'x',
          onZoomComplete: handleZoomComplete
        },
        pan: { enabled: true, mode: 'x' }
      }
    },
    interaction: { mode: 'point', intersect: true },
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    onHover: handleHover,
  };

  return (
    <Box sx={{ height: 400, mb: 3, position: 'relative' }}>
      {dragInfo && (
        <Fade in timeout={500}>
          <Paper 
            elevation={3}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              padding: 2,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 2,
              minWidth: 240,
              color: 'text.primary',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Price Change
              </Typography>
              <IconButton onClick={handleResetZoom} size="small" color="primary" aria-label="Reset Zoom">
                <RefreshIcon />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              From: {dragInfo.startDate}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              To: {dragInfo.endDate}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Duration: {dragInfo.duration} day{dragInfo.duration > 1 ? 's' : ''}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ fontWeight: 'bold', color: parseFloat(dragInfo.diff) >= 0 ? 'green' : 'red' }}
            >
              ${dragInfo.diff} ({dragInfo.pct}%)
            </Typography>
          </Paper>
        </Fade>
      )}
      <Line ref={chartRef} data={data} options={chartOptions} />
    </Box>
  );
}

export default StockChart;
