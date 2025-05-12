// CandleChart.jsx – complete, theme‑aware & lint‑clean
import React, { useRef, useState, useEffect, useMemo } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import { Paper, Tooltip } from "@mui/material";

const MARGIN = { top: 24, right: 32, bottom: 40, left: 56 };
const HEIGHT = 420;
const CANDLE_W = 8;
const TICK_MS = 30 * 60 * 1000; // 30‑minute x‑axis ticks

export default function CandleChart({ data = [], annotations = [] }) {
  const theme = useTheme();
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);                                  // fallback

  /* ——— ResizeObserver for fluid width ——— */
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    );
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* ——— Scales (computed every render; safe when data empty) ——— */
  const { scaleX, scaleY, minP, maxP, minT, maxT } = useMemo(() => {
    if (data.length === 0) {
      return {
        minP: 0,
        maxP: 1,
        minT: 0,
        maxT: 1,
        scaleX: () => MARGIN.left,
        scaleY: () => HEIGHT - MARGIN.bottom,
      };
    }
    const prices = data.flatMap(d => [
      d.low,
      d.high,
      d.bbUpper ?? d.high,
      d.bbLower ?? d.low,
    ]);
    const [minP, maxP] = [Math.min(...prices), Math.max(...prices)];

    const times = data.map(d => new Date(d.date).getTime());
    const [minT, maxT] = [Math.min(...times), Math.max(...times)];

    const scaleX = d =>
      MARGIN.left +
      ((new Date(d).getTime() - minT) / (maxT - minT || 1)) *
        (width - MARGIN.left - MARGIN.right);

    const scaleY = p =>
      MARGIN.top +
      ((maxP - p) / (maxP - minP || 1)) *
        (HEIGHT - MARGIN.top - MARGIN.bottom);

    return { scaleX, scaleY, minP, maxP, minT, maxT };
  }, [data, width]);

  /* ——— Bollinger band closed path ——— */
  const bbPath = useMemo(() => {
    if (!data.length) return "";
    const upper = data.filter(d => d.bbUpper != null);
    const lower = data.filter(d => d.bbLower != null);
    if (!upper.length || !lower.length) return "";

    const upPts = upper.map(d => `${scaleX(d.date)},${scaleY(d.bbUpper)}`);
    const loPts = lower
      .slice()
      .reverse()
      .map(d => `${scaleX(d.date)},${scaleY(d.bbLower)}`);

    return `M${upPts[0]} L${upPts.slice(1).join(" L")} L${loPts[0]} L${loPts
      .slice(1)
      .join(" L")} Z`;
  }, [data, scaleX, scaleY]);

  /* ——— Y‑axis ticks ——— */
  const yTicks = useMemo(() => {
    const n = 5;
    return Array.from({ length: n }, (_, i) =>
      minP + (i * (maxP - minP)) / (n - 1)
    );
  }, [minP, maxP]);

  /* ——— X‑axis ticks every 30 min ——— */
  const xTicks = useMemo(() => {
    if (!data.length) return [];
    const start = Math.floor(minT / TICK_MS) * TICK_MS;
    const ticks = [];
    for (let t = start; t <= maxT; t += TICK_MS) ticks.push(t);
    return ticks;
  }, [minT, maxT]);

  /* ——— Render ——— */
  return (
    <Paper ref={containerRef} sx={{ p: 1, overflow: "hidden" }}>
      {data.length === 0 ? (
        "No data"
      ) : (
        <svg width={width} height={HEIGHT}>
          {/* Bollinger channel ‑ behind everything */}
          {bbPath && (
            <path
              d={bbPath}
              fill={alpha(theme.palette.primary.main, 0.1)}      // 10 % opacity
              stroke={theme.palette.primary.main}
              strokeWidth={1}
            />
          )}

          {/* Candlesticks */}
          {data.map(c => {
            const cx = scaleX(c.date);
            const x = cx - CANDLE_W / 2;
            const yHigh = scaleY(c.high);
            const yLow  = scaleY(c.low);
            const yOpen = scaleY(c.open);
            const yClose= scaleY(c.close);
            const bodyTop = Math.min(yOpen, yClose);
            const bodyH   = Math.max(Math.abs(yClose - yOpen), 1);
            const up      = c.close >= c.open;
            const colour  = up
              ? theme.palette.success.main
              : theme.palette.error.main;

            return (
              <g key={c.date}>
                <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={colour} />
                <rect
                  x={x}
                  y={bodyTop}
                  width={CANDLE_W}
                  height={bodyH}
                  fill={colour}
                  rx={1}
                />
              </g>
            );
          })}

          {/* X‑axis line */}
          <line
            x1={MARGIN.left}
            y1={HEIGHT - MARGIN.bottom}
            x2={width - MARGIN.right}
            y2={HEIGHT - MARGIN.bottom}
            stroke={theme.palette.text.primary}
          />

          {/* X‑axis ticks & labels */}
          {xTicks.map((t, i) => {
            const x = scaleX(t);
            const label = new Date(t).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={HEIGHT - MARGIN.bottom}
                  x2={x}
                  y2={HEIGHT - MARGIN.bottom + 5}
                  stroke={theme.palette.text.primary}
                />
                <text
                  x={x}
                  y={HEIGHT - MARGIN.bottom + 17}
                  fontSize="10"
                  textAnchor="middle"
                  fill={theme.palette.text.secondary}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Y‑axis grid & labels */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={scaleY(v)}
                y2={scaleY(v)}
                stroke={theme.palette.divider}
                strokeDasharray="2 2"
              />
              <text
                x={MARGIN.left - 8}
                y={scaleY(v) + 4}
                fontSize="11"
                textAnchor="end"
                fill={theme.palette.text.secondary}
              >
                {v.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Annotations (trade rectangles & entry/exit markers) */}
          {annotations?.map((a, i) => {
            if (a.type === "trade-rectangle") {
              const x1 = scaleX(a.entryDate);
              const x2 = scaleX(a.exitDate);
              return (
                <rect
                  key={i}
                  x={Math.min(x1, x2)}
                  y={MARGIN.top}
                  width={Math.abs(x2 - x1)}
                  height={HEIGHT - MARGIN.top - MARGIN.bottom}
                  fill={alpha(
                    a.fill ?? theme.palette.secondary.main,
                    0.15                                    // 15 % opacity
                  )}
                />
              );
            }
            if (a.type === "entry-marker" || a.type === "exit-marker") {
              const x = scaleX(a.date);
              const y = scaleY(a.direction === "long" ? maxP : minP);
              return (
                <Tooltip key={i} title={a.tooltip} arrow>
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill={
                      a.direction === "long"
                        ? theme.palette.success.main
                        : theme.palette.error.main
                    }
                  />
                </Tooltip>
              );
            }
            return null;
          })}
        </svg>
      )}
    </Paper>
  );
}
