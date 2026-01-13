// StockChart.js
import React, { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { Box, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip as ChartTooltip, Legend, Filler,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";

import { useTouchEventTypes, useTouchTooltipMappings } from "./useTouchMappings";
import { useExternalTooltipHandler } from "./TooltipHandler";
import { useChartData } from "./useChartData";

import CrosshairLinePlugin from "./CrosshairLinePlugin";
import PriceChangeInfo from "./PriceChangeInfo";
import useChartOptions from "./useChartOptions";
import { formatDate } from "../../utils/formatDate";

const EMPTY_POINTS = [];

const parseTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, ChartTooltip, Legend, annotationPlugin, zoomPlugin,
  CrosshairLinePlugin, Filler
);

function StockChart({ summary, eventMap, onHoverPriceChange, range = "3M", onRangeChange }) {
  const chartRef = useRef(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [hasZoomed, setHasZoomed] = useState(false);

  const chartPoints = useMemo(
    () => summary?.chart_data ?? EMPTY_POINTS,
    [summary?.chart_data]
  );

  const handleRangeChange = useCallback(
    (_, value) => {
      if (!value) return;
      onRangeChange?.(value);
    },
    [onRangeChange]
  );

  const latestTimestamp = useMemo(() => {
    if (!chartPoints.length) return null;
    return parseTimestamp(chartPoints[chartPoints.length - 1].date);
  }, [chartPoints]);

  const rangeStartTimestamp = useMemo(() => {
    if (latestTimestamp == null) return null;
    if (range === "YTD") {
      const latest = new Date(latestTimestamp);
      return new Date(latest.getFullYear(), 0, 1).getTime();
    }
    const start = new Date(latestTimestamp);
    if (range === "1M") {
      start.setMonth(start.getMonth() - 1);
    } else if (range === "3M") {
      start.setMonth(start.getMonth() - 3);
    } else if (range === "1Y") {
      start.setFullYear(start.getFullYear() - 1);
    }
    return start.getTime();
  }, [latestTimestamp, range]);

  const filteredPoints = useMemo(() => {
    if (!chartPoints.length) return chartPoints;
    if (rangeStartTimestamp == null) return chartPoints;
    const filtered = chartPoints.filter((pt) => {
      const ts = parseTimestamp(pt.date);
      return ts == null ? true : ts >= rangeStartTimestamp;
    });
    return filtered.length ? filtered : chartPoints;
  }, [chartPoints, rangeStartTimestamp]);

  const rangeChange = useMemo(() => {
    if (filteredPoints.length < 2) return null;
    const firstPrice = filteredPoints[0].close;
    const lastPrice = filteredPoints[filteredPoints.length - 1].close;
    if (firstPrice == null || lastPrice == null || firstPrice === 0) return null;
    const diff = lastPrice - firstPrice;
    const pct = (diff / firstPrice) * 100;
    return { diff, pct };
  }, [filteredPoints]);

  // ── Data prep ───────────────────────────────────────────────────────────
  const eventTypeMappingTouch = useTouchEventTypes(summary, formatDate);
  const tooltipMappingTouch   = useTouchTooltipMappings(summary, formatDate);

  // Build P&L status per touch date from the tooltip mapping
  const pnlStatusByDate = useMemo(() => {
    const out = {};
    for (const [date, items] of Object.entries(tooltipMappingTouch || {})) {
      if (!Array.isArray(items) || !items.length) continue;
      const profits = items.map(it => {
        const d = Number(it.delta ?? 0);
        return it.kind === "pullback" ? -d : d; // short: touch→trough (profit when delta<0)
      });
      const hasPos = profits.some(p => p > 0);
      const hasNeg = profits.some(p => p < 0);
      let status = null;
      if (hasPos && !hasNeg) status = "profit";
      else if (hasNeg && !hasPos) status = "loss";
      else if (hasPos && hasNeg) status = "mixed";
      if (status) out[date] = { status, profits };
    }
    return out;
  }, [tooltipMappingTouch]);

  const chartSummary = useMemo(() => {
    if (!summary) return summary;
    if (filteredPoints === summary.chart_data) return summary;
    return { ...summary, chart_data: filteredPoints };
  }, [summary, filteredPoints]);

  const baseChartData = useChartData(chartSummary, eventTypeMappingTouch, pnlStatusByDate);

  const upperBand = useMemo(
    () => filteredPoints.map((pt) => pt.upper ?? null),
    [filteredPoints]
  );
  const lowerBand = useMemo(
    () => filteredPoints.map((pt) => pt.lower ?? null),
    [filteredPoints]
  );

  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    if (!baseChartData?.labels?.length) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

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
      if (!filteredPoints.length) return;

      if (event.type === "mouseout" || !chartElements.length) {
        if (chart.$currentHoverIndex != null) {
          chart.$currentHoverIndex = null;
          onHoverPriceChange?.(null);
          chart.draw();
        }
        return;
      }

      const newIndex = chartElements[0].index;
      if (newIndex === chart.$currentHoverIndex) return;

      chart.$currentHoverIndex = newIndex;
      const pt = filteredPoints[newIndex];

      onHoverPriceChange?.({
        date: pt.date,
        price: pt.close,
        upper: pt.upper,
        lower: pt.lower,
      });

      chart.draw();
    },
    [filteredPoints, onHoverPriceChange]
  );

  // ── Zoom / pan events ──────────────────────────────────────────────────
  const handleZoomComplete = useCallback(
    ({ chart }) => {
      if (!filteredPoints.length) return;
      const xScale = chart.scales.x;
      const minIndex = Math.floor(xScale.min);
      const maxIndex = Math.ceil(xScale.max);
      const clampedMin = Math.max(0, minIndex);
      const clampedMax = Math.min(filteredPoints.length - 1, maxIndex);
      const fullRange = filteredPoints.length - 1;
      const isZoomed = clampedMax - clampedMin < fullRange;
      if (!isZoomed) {
        setDragInfo(null);
        setHasZoomed(false);
        return;
      }

      setHasZoomed(true);
      const points = filteredPoints.slice(clampedMin, clampedMax + 1);
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
    [filteredPoints]
  );

  const handleResetZoom = useCallback(() => {
    chartRef.current?.resetZoom();
    setDragInfo(null);
    setHasZoomed(false);
  }, []);

  useEffect(() => {
    chartRef.current?.resetZoom();
    setDragInfo(null);
    setHasZoomed(false);
  }, [range, filteredPoints.length]);

  const chartOptions = useChartOptions({
    externalTooltipHandler,
    handleHover,
    handleZoomComplete,
    tooltipMappingTouch, // still needed by TooltipHandler for rows
    zoomEnabled: !hasZoomed,
  });

  const formattedRangePct = rangeChange
    ? `${rangeChange.pct >= 0 ? "+" : ""}${rangeChange.pct.toFixed(2)}%`
    : "—";
  const rangeColor = rangeChange
    ? rangeChange.pct >= 0
      ? "success.main"
      : "error.main"
    : "text.secondary";

  return (
    <Box sx={{ height: 450, mb: 3, position: "relative" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Price Movement
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: rangeColor }}>
            {formattedRangePct}
          </Typography>
          <ToggleButtonGroup
            value={range}
            exclusive
            onChange={handleRangeChange}
            size="small"
            sx={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 2,
              "& .MuiToggleButton-root": {
                py: 0,
                px: 1,
                fontSize: 12,
                minWidth: 44,
                color: "text.secondary",
                "&.Mui-selected": {
                  color: "primary.main",
                  backgroundColor: "rgba(0,123,255,0.15)",
                },
              },
            }}
          >
            <ToggleButton value="1M">1M</ToggleButton>
            <ToggleButton value="3M">3M</ToggleButton>
            <ToggleButton value="YTD">YTD</ToggleButton>
            <ToggleButton value="1Y">1Y</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      <PriceChangeInfo dragInfo={dragInfo} onResetZoom={handleResetZoom} />
      <Line ref={chartRef} data={chartData} options={chartOptions} />
    </Box>
  );
}

export default StockChart;
