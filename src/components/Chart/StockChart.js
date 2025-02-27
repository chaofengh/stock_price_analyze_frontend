import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Fade
} from '@mui/material';
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

import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';

import { useTouchEventTypes, useTouchTooltipMappings } from './useTouchMappings';
import { useHugEventTypes, useHugTooltipMappings } from './useHugMappings';
import { useExternalTooltipHandler } from './TooltipHandler';
import { useChartData } from './useChartData';

// --------------------------
// Crosshair Plugin
// --------------------------
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
    ctx.font = 'bold 14px Roboto, sans-serif';
    ctx.fillStyle = '#333';
    const textWidth = ctx.measureText(rawDate).width;
    const textX = xPixel - textWidth / 2;
    const textY = chartArea.top + 14;
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
  annotationPlugin,
  zoomPlugin,
  CrosshairLinePlugin
);

function StockChart({ summary, eventMap, onHoverPriceChange }) {
  const chartRef = useRef(null);
  const [dragInfo, setDragInfo] = useState(null);

  // Format date as YYYY-MM-DD
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

  // ----------------------------------------
  // 1) Base close-price data (from your custom hook)
  // ----------------------------------------
  const baseChartData = useChartData(
    summary,
    eventTypeMappingTouch,
    eventTypeMappingHug
  );

  // ----------------------------------------
  // 2) Extract Bollinger band data
  //    (We assume each pt has pt.upper & pt.lower)
  // ----------------------------------------
  const closePrices = summary?.chart_data?.map(pt => pt.close) || [];
  const upperBand = summary?.chart_data?.map(pt => pt.upper ?? null) || [];
  const lowerBand = summary?.chart_data?.map(pt => pt.lower ?? null) || [];

  // We'll build the final chartData in state so we can apply a gradient fill.
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  // Build final datasets (Close + Bollinger) & gradient fill
  useEffect(() => {
    if (!baseChartData?.labels?.length) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

    // Grab chart instance context to create gradient
    const chart = chartRef.current?.ctx;
    if (!chart) {
      // If not ready, fallback
      setChartData(baseChartData);
      return;
    }

    // We'll do a gradient for the close line
    const gradient = chart.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(25,118,210,0.4)');  // top
    gradient.addColorStop(1, 'rgba(25,118,210,0)');    // bottom

    // Rebuild the main close dataset to include fill & gradient
    const mainDataset = {
      ...baseChartData.datasets[0],
      label: 'Close',
      borderColor: '#1976d2',
      backgroundColor: gradient,
      fill: true,
    };

    // Lower band dataset (no fill)
    const lowerBB = {
      type: 'line',
      label: 'Lower BB',
      data: lowerBand,
      borderColor: 'rgba(75,192,192,0.8)',
      borderWidth: 2,
      pointRadius: 0,
      fill: false, // We'll fill on the upper dataset
      yAxisID: 'y',
      order: 1
    };

    // Upper band dataset (fill down to the lower band)
    const upperBB = {
      type: 'line',
      label: 'Upper BB',
      data: upperBand,
      borderColor: 'rgba(75,192,192,0.8)',
      borderWidth: 2,
      pointRadius: 0,
      fill: '-1', // Fill from this dataset down to the previous dataset (lowerBB)
      backgroundColor: 'rgba(75,192,192,0.1)',
      yAxisID: 'y',
      order: 1
    };

    // Combine them
    const newDatasets = [
      mainDataset,  // main close line
      lowerBB,
      upperBB
    ];

    setChartData({
      labels: baseChartData.labels,
      datasets: newDatasets
    });
  }, [baseChartData]);

  // ---------------------
  // External Tooltip
  // ---------------------
  const externalTooltipHandler = useExternalTooltipHandler();

  // ---------------------
  // Crosshair Hover
  // ---------------------
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

  // ---------------------
  // Zoom / Pan
  // ---------------------
  const handleZoomComplete = useCallback(
    ({ chart }) => {
      const xScale = chart.scales.x;
      // .min/.max are numeric indexes in a category scale
      const minIndex = Math.floor(xScale.min);
      const maxIndex = Math.ceil(xScale.max);
      const clampedMin = Math.max(0, minIndex);
      const clampedMax = Math.min(summary.chart_data.length - 1, maxIndex);
      const points = summary.chart_data.slice(clampedMin, clampedMax + 1);
      if (points.length < 2) return;

      const firstPrice = points[0].close;
      const lastPrice = points[points.length - 1].close;
      const diff = lastPrice - firstPrice;
      const pct = (diff / firstPrice) * 100;
      const startDate = points[0].date;
      const endDate = points[points.length - 1].date;
      const durationMs = new Date(endDate) - new Date(startDate);
      const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));

      setDragInfo({
        diff: diff.toFixed(2),
        pct: pct.toFixed(2),
        startDate,
        endDate,
        duration: durationDays,
      });
    },
    [summary]
  );

  const handleResetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
    setDragInfo(null);
  }, []);

  // ---------------------
  // Chart Options
  // ---------------------
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 20, right: 10, left: 10 } },
    scales: {
      x: {
        type: 'category',
        grid: { display: false },
        ticks: {
          color: '#666',
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          color: '#666',
          callback: (value) => `$${value}`
        }
      }
    },
    interaction: {
      mode: 'point',
      intersect: true
    },
    plugins: {
      legend: {
        display: true,
        labels: { boxWidth: 12 }
      },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
        callbacks: {
          label: (context) => {
            const dataIndex = context.dataIndex;
            const chartPoint = summary.chart_data[dataIndex];
            const pointDate = chartPoint?.date;
            // Show Hug/Touch info if it exists
            if (chartPoint.isHug && tooltipMappingHug[pointDate]) {
              return tooltipMappingHug[pointDate];
            }
            if (chartPoint.isTouch && tooltipMappingTouch[pointDate]) {
              return tooltipMappingTouch[pointDate];
            }
            // Otherwise default
            return `Close: ${context.parsed.y?.toFixed(2)}`;
          },
        },
      },
      zoom: {
        zoom: {
          drag: {
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.15)'
          },
          mode: 'x',
          onZoomComplete: handleZoomComplete
        },
        pan: {
          enabled: true,
          mode: 'x'
        }
      },
      // Optional: highlight highest/lowest closes
      annotation: {
        annotations: {
        }
      }
    },
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    onHover: handleHover,
  };

  return (
    <Box sx={{ height: 450, mb: 3, position: 'relative' }}>
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
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Price Change
              </Typography>
              <IconButton
                onClick={handleResetZoom}
                size="small"
                color="primary"
                aria-label="Reset Zoom"
              >
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
              Duration: {dragInfo.duration} day
              {dragInfo.duration > 1 ? 's' : ''}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 'bold',
                color: parseFloat(dragInfo.diff) >= 0 ? 'green' : 'red'
              }}
            >
              ${dragInfo.diff} ({dragInfo.pct}%)
            </Typography>
          </Paper>
        </Fade>
      )}

      <Line ref={chartRef} data={chartData} options={chartOptions} />
    </Box>
  );
}

export default StockChart;
