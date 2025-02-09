import React, { useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register required Chart.js components.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function StockChart({ summary, eventMap }) {
  // Helper: Convert any date string into "YYYY-MM-DD" format.
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toISOString().split('T')[0];
  };

  // -------------------------------
  // MAPPING FOR TOUCH EVENTS
  // -------------------------------
  const eventTypeMappingTouch = useMemo(() => {
    const mapping = {};
    const addEventType = (event, type) => {
      const key = formatDate(event.touch_date);
      mapping[key] = type;
    };
    if (summary && summary.window_5) {
      summary.window_5.lower_touch_bounces?.forEach(event =>
        addEventType(event, 'lower')
      );
      summary.window_5.upper_touch_pullbacks?.forEach(event =>
        addEventType(event, 'upper')
      );
    }
    if (summary && summary.window_10) {
      summary.window_10.lower_touch_bounces?.forEach(event =>
        addEventType(event, 'lower')
      );
      summary.window_10.upper_touch_pullbacks?.forEach(event =>
        addEventType(event, 'upper')
      );
    }
    return mapping;
  }, [summary]);

  // Build tooltip mapping for touch events.
  const tooltipMappingTouch = useMemo(() => {
    const mapping = {};
    const addEventToMapping = (event, windowLabel, type) => {
      const key = formatDate(event.touch_date);
      let lines = [];
      if (type === 'lower') {
        const diff = event.peak_price - event.touch_price;
        lines = [
          `Window ${windowLabel}:`,
          `Event: Lower Bollinger Bounce`,
          `Touch Price: $${event.touch_price.toFixed(2)}`,
          `Peak Price: $${event.peak_price.toFixed(2)}`,
          `Bounce: $${diff.toFixed(2)} in ${event.trading_days} day${event.trading_days > 1 ? 's' : ''}`,
        ];
      } else if (type === 'upper') {
        lines = [
          `Window ${windowLabel}:`,
          `Event: Upper Bollinger Pullback`,
          `Touch Price: $${event.touch_price.toFixed(2)}`,
          `Trough Price: $${event.trough_price.toFixed(2)}`,
          `Drop: $${Math.abs(event.drop_dollars).toFixed(2)} in ${event.trading_days} day${event.trading_days > 1 ? 's' : ''}`,
        ];
      }
      if (mapping[key]) {
        mapping[key] = mapping[key].concat([''], lines);
      } else {
        mapping[key] = lines;
      }
    };

    if (summary && summary.window_5) {
      const w5 = summary.window_5;
      w5.lower_touch_bounces?.forEach(event =>
        addEventToMapping(event, '5', 'lower')
      );
      w5.upper_touch_pullbacks?.forEach(event =>
        addEventToMapping(event, '5', 'upper')
      );
    }
    if (summary && summary.window_10) {
      const w10 = summary.window_10;
      w10.lower_touch_bounces?.forEach(event =>
        addEventToMapping(event, '10', 'lower')
      );
      w10.upper_touch_pullbacks?.forEach(event =>
        addEventToMapping(event, '10', 'upper')
      );
    }
    return mapping;
  }, [summary]);

  // -------------------------------
  // MAPPING FOR HUG EVENTS
  // -------------------------------
  const eventTypeMappingHug = useMemo(() => {
    const mapping = {};
    const addHugEvent = (event, type) => {
      const key = formatDate(event.hug_end_date);
      mapping[key] = type;
    };
    if (summary && summary.window_5) {
      summary.window_5.lower_hug_bounces?.forEach(event =>
        addHugEvent(event, 'lower_hug')
      );
      summary.window_5.upper_hug_pullbacks?.forEach(event =>
        addHugEvent(event, 'upper_hug')
      );
    }
    if (summary && summary.window_10) {
      summary.window_10.lower_hug_bounces?.forEach(event =>
        addHugEvent(event, 'lower_hug')
      );
      summary.window_10.upper_hug_pullbacks?.forEach(event =>
        addHugEvent(event, 'upper_hug')
      );
    }
    return mapping;
  }, [summary]);

  // Build tooltip mapping for hug events.
  const tooltipMappingHug = useMemo(() => {
    const mapping = {};
    const addHugEventTooltip = (event, windowLabel, type) => {
      const key = formatDate(event.hug_end_date);
      let lines = [];
      if (type === 'lower_hug') {
        lines = [
          `Window ${windowLabel}:`,
          `Event: Lower Hug Bounce`,
          `Hug Start: $${event.hug_start_price.toFixed(2)} on ${formatDate(event.hug_start_date)}`,
          `Hug End: $${event.hug_end_price.toFixed(2)} on ${formatDate(event.hug_end_date)}`,
          `Bounce: $${event.bounce_dollars.toFixed(2)} in ${event.trading_days} day${event.trading_days > 1 ? 's' : ''}`,
          `Peak: $${event.peak_price.toFixed(2)} on ${formatDate(event.peak_date)}`,
        ];
      } else if (type === 'upper_hug') {
        lines = [
          `Window ${windowLabel}:`,
          `Event: Upper Hug Pullback`,
          `Hug Start: $${event.hug_start_price.toFixed(2)} on ${formatDate(event.hug_start_date)}`,
          `Hug End: $${event.hug_end_price.toFixed(2)} on ${formatDate(event.hug_end_date)}`,
          `Drop: $${Math.abs(event.drop_dollars).toFixed(2)} in ${event.trading_days} day${event.trading_days > 1 ? 's' : ''}`,
          `Trough: $${event.trough_price.toFixed(2)} on ${formatDate(event.trough_date)}`,
        ];
      }
      if (mapping[key]) {
        mapping[key] = mapping[key].concat([''], lines);
      } else {
        mapping[key] = lines;
      }
    };

    if (summary && summary.window_5) {
      const w5 = summary.window_5;
      w5.lower_hug_bounces?.forEach(event =>
        addHugEventTooltip(event, '5', 'lower_hug')
      );
      w5.upper_hug_pullbacks?.forEach(event =>
        addHugEventTooltip(event, '5', 'upper_hug')
      );
    }
    if (summary && summary.window_10) {
      const w10 = summary.window_10;
      w10.lower_hug_bounces?.forEach(event =>
        addHugEventTooltip(event, '10', 'lower_hug')
      );
      w10.upper_hug_pullbacks?.forEach(event =>
        addHugEventTooltip(event, '10', 'upper_hug')
      );
    }
    return mapping;
  }, [summary]);

  // -------------------------------
  // PREPARE CHART DATA
  // -------------------------------
  const data = useMemo(() => {
    if (!summary || !summary.chart_data) return { datasets: [] };

    const closingData = summary.chart_data.map((pt) => ({
      x: pt.date, // expected format "YYYY-MM-DD"
      y: pt.close,
    }));

    const closingPointColors = summary.chart_data.map((pt) => {
      if (pt.isTouch) {
        const key = pt.date;
        if (eventTypeMappingTouch[key] === 'lower') {
          return '#00C853';
        } else if (eventTypeMappingTouch[key] === 'upper') {
          return '#D50000';
        }
        return '#FF5733';
      } else if (pt.isHug) {
        const key = pt.date;
        if (eventTypeMappingHug[key] === 'lower_hug') {
          return 'rgb(13, 71, 161)';
        } else if (eventTypeMappingHug[key] === 'upper_hug') {
          return 'rgb(13, 71, 161)';
        }
        return '#FF9800';
      }
      return '#1a1a1a';
    });

    const closingPointRadii = summary.chart_data.map((pt) =>
      pt.isTouch || pt.isHug ? 6 : 4
    );

    return {
      datasets: [
        {
          label: 'Closing Price',
          data: closingData,
          tension: 0.3,
          borderWidth: 2,
          borderColor: '#1a1a1a',
          fill: false,
          pointBackgroundColor: closingPointColors,
          pointRadius: closingPointRadii,
          order: 3,
        },
      ],
    };
  }, [summary, eventTypeMappingTouch, eventTypeMappingHug]);

  // -------------------------------
  // EXTERNAL TOOLTIP HANDLER (with bold labels)
  // -------------------------------
  const externalTooltipHandler = useCallback((context) => {
    // Tooltip Element
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip';
      // Base styles for a modern tooltip.
      tooltipEl.style.background = 'rgba(255, 255, 255, 0.95)';
      tooltipEl.style.border = '1px solid #ddd';
      tooltipEl.style.borderRadius = '8px';
      tooltipEl.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)';
      tooltipEl.style.padding = '8px';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.transition = 'all 0.1s ease';
      document.body.appendChild(tooltipEl);
    }

    const tooltipModel = context.tooltip;
    // Hide if no tooltip
    if (tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    // Set position
    const canvasRect = context.chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left =
      canvasRect.left + window.pageXOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top =
      canvasRect.top + window.pageYOffset + tooltipModel.caretY + 'px';

    // Build tooltip content.
    let innerHtml = '';

    // Title
    if (tooltipModel.title) {
      innerHtml += `<div style="font-family: Roboto, sans-serif; font-size: 16px; font-weight: bold; color: #333; margin-bottom: 4px;">`;
      tooltipModel.title.forEach((title) => {
        innerHtml += title + '<br/>';
      });
      innerHtml += `</div>`;
    }

    // Body (each body item may be multi-line)
    if (tooltipModel.body) {
      tooltipModel.body.forEach((bodyItem) => {
        bodyItem.lines.forEach((line) => {
          // Customize the numeric value for 'Drop' and 'Bounce'
          if (line.startsWith('Drop:')) {
            line = line.replace(
              /(Drop:\s*)(\$\d+(\.\d+)?)/,
              "$1<span style='background-color: red; color: white; padding: 2px 4px;'>$2</span>"
            );
          } else if (line.startsWith('Bounce:')) {
            line = line.replace(
              /(Bounce:\s*)(\$\d+(\.\d+)?)/,
              "$1<span style='background-color: green; color: white; padding: 2px 4px;'>$2</span>"
            );
          }
          // Wrap the label (everything before the first colon) in <strong> to make it bold.
          line = line.replace(/^([^:]+:\s*)/, "<strong>$1</strong>");
          innerHtml += `<div style="font-family: Roboto, sans-serif; font-size: 14px; color: #555; margin-bottom: 2px;">${line}</div>`;
        });
      });
    }

    tooltipEl.innerHTML = innerHtml;
  }, []);

  // -------------------------------
  // CHART OPTIONS WITH CUSTOM EXTERNAL TOOLTIP
  // -------------------------------
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { family: 'Roboto, sans-serif', size: 14 },
          color: '#333',
        },
      },
      tooltip: {
        enabled: false, // Disable the default tooltip
        external: externalTooltipHandler,
        callbacks: {
          label: function (context) {
            const dataIndex = context.dataIndex;
            const datasetIndex = context.datasetIndex;
            const pointDate = context.chart.data.datasets[datasetIndex].data[dataIndex].x;
            const chartPoint = summary.chart_data[dataIndex];
            if (chartPoint.isHug && tooltipMappingHug[pointDate]) {
              return tooltipMappingHug[pointDate];
            }
            if (chartPoint.isTouch && tooltipMappingTouch[pointDate]) {
              return tooltipMappingTouch[pointDate];
            }
            return `Close: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        grid: { display: false },
        ticks: {
          color: '#333',
          font: { size: 12, family: 'Roboto, sans-serif' },
        },
      },
      y: {
        grid: { color: '#e0e0e0' },
        ticks: {
          color: '#333',
          font: { size: 12, family: 'Roboto, sans-serif' },
        },
      },
    },
  }), [externalTooltipHandler, tooltipMappingTouch, tooltipMappingHug, summary]);

  return (
    <Box sx={{ height: 400, mb: 3 }}>
      <Line data={data} options={chartOptions} />
    </Box>
  );
}

export default StockChart;
