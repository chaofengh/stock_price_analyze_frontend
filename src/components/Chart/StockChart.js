// StockChart.js
import React, { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { Box, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Chart, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip as ChartTooltip, Legend, Filler,
} from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement,
} from "chartjs-chart-financial/dist/chartjs-chart-financial.esm.js";
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

const toFiniteNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  CandlestickController, CandlestickElement, OhlcController, OhlcElement,
  Title, ChartTooltip, Legend, annotationPlugin, zoomPlugin,
  CrosshairLinePlugin, Filler
);

function StockChart({
  summary,
  eventMap,
  onHoverPriceChange,
  range = "3M",
  onRangeChange,
  predictionMarkers = [],
}) {
  const chartRef = useRef(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [hasZoomed, setHasZoomed] = useState(false);
  const [priceView, setPriceView] = useState("close");

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

  const handlePriceViewChange = useCallback((_, value) => {
    if (!value) return;
    setPriceView(value);
  }, []);

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
  const candleLowerBand = useMemo(
    () =>
      filteredPoints.map((pt, idx) => ({
        x: idx,
        y: toFiniteNumberOrNull(pt.lower),
      })),
    [filteredPoints]
  );
  const candleUpperBand = useMemo(
    () =>
      filteredPoints.map((pt, idx) => ({
        x: idx,
        y: toFiniteNumberOrNull(pt.upper),
      })),
    [filteredPoints]
  );
  const candlestickData = useMemo(
    () => {
      const candles = [];
      let previousClose = null;
      filteredPoints.forEach((pt, idx) => {
        const close = toFiniteNumberOrNull(pt.close);
        const open = toFiniteNumberOrNull(pt.open) ?? previousClose ?? close;
        const high = toFiniteNumberOrNull(pt.high) ?? Math.max(open ?? close ?? 0, close ?? 0);
        const low = toFiniteNumberOrNull(pt.low) ?? Math.min(open ?? close ?? 0, close ?? 0);

        if (close == null || open == null || high == null || low == null) {
          return;
        }

        candles.push({
          // chartjs-chart-financial uses parsing:false; category scales expect x as label index
          x: idx,
          o: open,
          h: high,
          l: low,
          c: close,
        });
        previousClose = close;
      });
      return candles;
    },
    [filteredPoints]
  );

  const predictionByDate = useMemo(() => {
    const out = {};
    predictionMarkers.forEach((marker) => {
      const date = marker?.signal_date || marker?.date;
      if (!date) return;
      out[String(date).slice(0, 10)] = marker;
    });
    return out;
  }, [predictionMarkers]);

  const predictionMarkerDataset = useMemo(() => {
    const markerDates = Object.keys(predictionByDate);
    if (!markerDates.length || !filteredPoints.length) return null;

    const colors = filteredPoints.map((pt) => {
      const marker = predictionByDate?.[String(pt.date).slice(0, 10)];
      if (!marker) return "transparent";
      if (marker.is_correct === true) return "#2e7d32";
      if (marker.is_correct === false) return "#d32f2f";
      return "#90a4ae";
    });
    const radii = filteredPoints.map((pt) => {
      const marker = predictionByDate?.[String(pt.date).slice(0, 10)];
      return marker ? 6 : 0;
    });
    const hoverRadii = radii.map((radius) => (radius ? 8 : 0));
    const pointStyles = filteredPoints.map((pt) => {
      const marker = predictionByDate?.[String(pt.date).slice(0, 10)];
      if (!marker) return "circle";
      return marker.predicted_direction === "reversal" ? "triangle" : "circle";
    });

    const data =
      priceView === "candles"
        ? filteredPoints.map((pt, idx) => ({
            x: idx,
            y: predictionByDate?.[String(pt.date).slice(0, 10)]
              ? toFiniteNumberOrNull(pt.close)
              : null,
          }))
        : filteredPoints.map((pt) =>
            predictionByDate?.[String(pt.date).slice(0, 10)]
              ? toFiniteNumberOrNull(pt.close)
              : null
          );

    return {
      type: "line",
      label: "Predictions",
      data,
      showLine: false,
      borderWidth: 0,
      pointRadius: radii,
      pointHoverRadius: hoverRadii,
      pointStyle: pointStyles,
      pointHitRadius: 10,
      pointBackgroundColor: colors,
      pointBorderColor: "#0b0f14",
      pointBorderWidth: 1.5,
      fill: false,
      parsing: priceView === "candles" ? false : undefined,
      yAxisID: "y",
      order: 0,
    };
  }, [filteredPoints, predictionByDate, priceView]);

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
      data: priceView === "candles" ? candleLowerBand : lowerBand,
      borderColor: "rgba(75,192,192,0.8)",
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      parsing: priceView === "candles" ? false : undefined,
      yAxisID: "y",
      order: 1,
    };

    const upperBB = {
      type: "line",
      label: "Upper BB",
      data: priceView === "candles" ? candleUpperBand : upperBand,
      borderColor: "rgba(75,192,192,0.8)",
      borderWidth: 2,
      pointRadius: 0,
      fill: "-1",
      backgroundColor: "rgba(20,133,203,0.2)",
      parsing: priceView === "candles" ? false : undefined,
      yAxisID: "y",
      order: 1,
    };

    if (priceView === "candles") {
      const candleDataset = {
        type: "candlestick",
        label: "Price",
        data: candlestickData,
        backgroundColors: {
          up: "rgba(46,125,50,0.55)",
          down: "rgba(211,47,47,0.55)",
          unchanged: "rgba(144,164,174,0.55)",
        },
        borderColors: {
          up: "#2e7d32",
          down: "#d32f2f",
          unchanged: "#90a4ae",
        },
        yAxisID: "y",
        order: 2,
      };

      setChartData({
        labels: baseChartData.labels,
        datasets: predictionMarkerDataset
          ? [candleDataset, lowerBB, upperBB, predictionMarkerDataset]
          : [candleDataset, lowerBB, upperBB],
      });
      return;
    }

    setChartData({
      labels: baseChartData.labels,
      datasets: predictionMarkerDataset
        ? [mainDataset, lowerBB, upperBB, predictionMarkerDataset]
        : [mainDataset, lowerBB, upperBB],
    });
  }, [
    baseChartData,
    lowerBand,
    upperBand,
    candleLowerBand,
    candleUpperBand,
    candlestickData,
    predictionMarkerDataset,
    priceView,
  ]);

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
    chartRef.current?.resetZoom?.();
    setDragInfo(null);
    setHasZoomed(false);
  }, []);

  useEffect(() => {
    chartRef.current?.resetZoom?.();
    setDragInfo(null);
    setHasZoomed(false);
  }, [range, filteredPoints.length, priceView]);

  useEffect(() => {
    const tooltips = document.querySelectorAll('[id^="chartjs-tooltip-"]');
    tooltips.forEach((el) => {
      if (el?.style) {
        el.style.opacity = 0;
      }
    });
  }, [priceView]);

  const chartOptions = useChartOptions({
    externalTooltipHandler,
    handleHover,
    handleZoomComplete,
    tooltipMappingTouch, // still needed by TooltipHandler for rows
    zoomEnabled: !hasZoomed,
    priceView,
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
            value={priceView}
            exclusive
            onChange={handlePriceViewChange}
            size="small"
            sx={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: "var(--app-radius)",
              "& .MuiToggleButton-root": {
                py: 0,
                px: 1,
                fontSize: 12,
                minWidth: 68,
                color: "text.secondary",
                "&.Mui-selected": {
                  color: "primary.main",
                  backgroundColor: "rgba(0,123,255,0.15)",
                },
              },
            }}
          >
            <ToggleButton value="close">Close</ToggleButton>
            <ToggleButton value="candles">Candles</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={range}
            exclusive
            onChange={handleRangeChange}
            size="small"
            sx={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: "var(--app-radius)",
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
      {priceView === "candles" ? (
        <Chart ref={chartRef} type="candlestick" data={chartData} options={chartOptions} />
      ) : (
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      )}
    </Box>
  );
}

export default StockChart;
