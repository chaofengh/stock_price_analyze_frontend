// useChartOptions.js
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

/**
 * Builds the Chart.js options object.
 * - Bright axis/labels for dark canvas
 * - Uses our external tooltip
 * - Keeps zoom/pan + hover logic
 */
const useChartOptions = ({
  externalTooltipHandler,
  handleHover,
  handleZoomComplete,
  summary,
  tooltipMappingTouch,
}) => {
  const theme = useTheme();

  return useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 20, right: 10, left: 10 } },

      scales: {
        x: {
          type: "category",
          grid: { display: false },
          ticks: {
            color: theme.palette.grey[300],
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
        y: {
          type: "linear",
          position: "left",
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: {
            color: theme.palette.grey[300],
            callback: (v) => `$${v}`,
          },
        },
      },

      interaction: { mode: "point", intersect: false },

      plugins: {
        legend: {
          display: true,
          labels: { boxWidth: 12 },
        },

        // External tooltip renderer
        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
          callbacks: {
            label: (ctx) => {
              const i = ctx.dataIndex;
              const pt = summary.chart_data[i];
              const dt = pt?.date;
              if (pt?.isTouch && tooltipMappingTouch[dt])
                return tooltipMappingTouch[dt];
              return `Close: ${ctx.parsed.y?.toFixed(2)}`;
            },
          },
        },

        // Zoom / pan
        zoom: {
          zoom: {
            drag: { enabled: true, backgroundColor: "rgba(0,0,0,0.15)" },
            mode: "x",
            onZoomComplete: handleZoomComplete,
          },
          pan: { enabled: true, mode: "x" },
        },

        // (Removed the annotation date label—crosshair plugin draws the date pill)
      },

      events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
      onHover: handleHover,
    }),
    [
      theme,
      externalTooltipHandler,
      handleHover,
      handleZoomComplete,
      summary,
      tooltipMappingTouch,
    ]
  );
};

export default useChartOptions;
