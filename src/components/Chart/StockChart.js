import React, { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { Box } from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";

import { useTouchEventTypes, useTouchTooltipMappings } from "./useTouchMappings";
import { useHugEventTypes, useHugTooltipMappings } from "./useHugMappings";
import { useExternalTooltipHandler } from "./TooltipHandler";
import { useChartData } from "./useChartData";

import CrosshairLinePlugin from "./CrosshairLinePlugin";
import PriceChangeInfo from "./PriceChangeInfo";
import useChartOptions from "./useChartOptions";
import { formatDate } from "../../utils/formatDate";

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
  CrosshairLinePlugin,
  Filler
);

function StockChart({ summary, eventMap, onHoverPriceChange }) {
  const chartRef = useRef(null);
  const [dragInfo, setDragInfo] = useState(null);

  // ── Data prep ───────────────────────────────────────────────────────────
  const eventTypeMappingTouch = useTouchEventTypes(summary, formatDate);
  const tooltipMappingTouch   = useTouchTooltipMappings(summary, formatDate);
  const eventTypeMappingHug   = useHugEventTypes(summary, formatDate);
  const tooltipMappingHug     = useHugTooltipMappings(summary, formatDate);

  const baseChartData = useChartData(
    summary,
    eventTypeMappingTouch,
    eventTypeMappingHug
  );

  const upperBand = useMemo(
    () => summary?.chart_data?.map((pt) => pt.upper ?? null) || [],
    [summary]
  );
  const lowerBand = useMemo(
    () => summary?.chart_data?.map((pt) => pt.lower ?? null) || [],
    [summary]
  );

  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    if (!baseChartData?.labels?.length) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

    const chartCtx = chartRef.current?.ctx;

    const mainDataset = {
      ...baseChartData.datasets[0],
      label: "Close",
      borderColor: "#1976d2",
      fill: false,
    };

    const lowerBB = {
      type: "line",
      label: "Lower BB",
      data: lowerBand,
      borderColor: "rgba(75,192,192,0.8)",
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      yAxisID: "y",
      order: 1,
    };

    const upperBB = {
      type: "line",
      label: "Upper BB",
      data: upperBand,
      borderColor: "rgba(75,192,192,0.8)",
      borderWidth: 2,
      pointRadius: 0,
      fill: "-1",
      backgroundColor: "rgba(20,133,203,0.2)",
      yAxisID: "y",
      order: 1,
      animations: {
        x: { duration: 50, easing: "easeOutQuad" },
        y: { duration: 50, easing: "easeOutQuad" },
      },
    };

    setChartData({
      labels: baseChartData.labels,
      datasets: [mainDataset, lowerBB, upperBB],
    });
  }, [baseChartData, lowerBand, upperBand]);

  // ── Tooltip + hover logic ───────────────────────────────────────────────
  const externalTooltipHandler = useExternalTooltipHandler();

  const handleHover = useCallback(
    (event, chartElements, chart) => {
      if (!summary?.chart_data) return;

      if (event.type === "mouseout" || !chartElements.length) {
        if (chart.$currentHoverIndex != null) {
          chart.$currentHoverIndex = null;
          onHoverPriceChange?.(null);
        }
        return;
      }

      const newIndex = chartElements[0].index;
      if (newIndex === chart.$currentHoverIndex) return;

      chart.$currentHoverIndex = newIndex;
      const pt = summary.chart_data[newIndex];

      onHoverPriceChange?.({
        date: pt.date,
        price: pt.close,
        upper: pt.upper,
        lower: pt.lower,
      });
    },
    [summary, onHoverPriceChange]
  );

  // ── Zoom / pan events ──────────────────────────────────────────────────
  const handleZoomComplete = useCallback(
    ({ chart }) => {
      const xScale = chart.scales.x;
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
    chartRef.current?.resetZoom();
    setDragInfo(null);
  }, []);

  const chartOptions = useChartOptions({
    externalTooltipHandler,
    handleHover,
    handleZoomComplete,
    summary,
    tooltipMappingHug,
    tooltipMappingTouch,
  });

  return (
    <Box sx={{ height: 450, mb: 3, position: "relative" }}>
      <PriceChangeInfo dragInfo={dragInfo} onResetZoom={handleResetZoom} />
      <Line ref={chartRef} data={chartData} options={chartOptions} />
    </Box>
  );
}

export default StockChart;
