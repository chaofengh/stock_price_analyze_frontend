// useChartOptions.js
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

const useChartOptions = ({
  externalTooltipHandler,
  handleHover,
  handleZoomComplete,
  tooltipMappingTouch,
  zoomEnabled = true,
  priceView = "close",
}) => {
  const theme = useTheme();
  const isCandleView = priceView === "candles";

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
      interaction: { mode: isCandleView ? "index" : "point", intersect: false },

      plugins: {
        legend: {
          display: true,
          labels: { boxWidth: 12 },
        },

        tooltip: isCandleView
          ? {
              enabled: true,
              filter: (item) => item?.dataset?.type === "candlestick",
              callbacks: {
                label: (context) => {
                  const raw = context?.raw;
                  const hasOhlc =
                    raw &&
                    typeof raw === "object" &&
                    raw.o != null &&
                    raw.h != null &&
                    raw.l != null &&
                    raw.c != null;
                  if (!hasOhlc) return "";
                  const o = Number(raw.o).toFixed(2);
                  const h = Number(raw.h).toFixed(2);
                  const l = Number(raw.l).toFixed(2);
                  const c = Number(raw.c).toFixed(2);
                  return `O: $${o}  H: $${h}  L: $${l}  C: $${c}`;
                },
              },
            }
          : {
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
      isCandleView,
    ]
  );
};

export default useChartOptions;
