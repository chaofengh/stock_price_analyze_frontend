// useChartOptions.js
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

const useChartOptions = ({
  externalTooltipHandler,
  handleHover,
  handleZoomComplete,
  tooltipMappingTouch,
  zoomEnabled = true,
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

      // IMPORTANT: show tooltip anywhere along an index (not just on a point)
      interaction: { mode: "point", intersect: false },

      plugins: {
        legend: {
          display: true,
          labels: { boxWidth: 12 },
        },

        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
          // Stash mapping for TooltipHandler to read (so the hook needs no args)
          _touchMapping: tooltipMappingTouch || {},
        },

        zoom: {
          zoom: {
            drag: { enabled: zoomEnabled, backgroundColor: "rgba(0,0,0,0.15)" },
            mode: "x",
            onZoomComplete: handleZoomComplete,
          },
          pan: { enabled: true, mode: "x" },
        },
      },

      events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
      onHover: handleHover,
    }),
    [
      theme,
      externalTooltipHandler,
      handleHover,
      handleZoomComplete,
      tooltipMappingTouch,
      zoomEnabled,
    ]
  );
};

export default useChartOptions;
