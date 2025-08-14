import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler, // ← make sure Filler is registered
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const SparklineChart = ({ closes = [], bbUpper = [], bbLower = [], touched_side }) => {
  const theme = useTheme();

  const closeColor =
    touched_side === "Upper" ? theme.palette.success.main : theme.palette.error.main;
  const upperColor = theme.palette.error.main;
  const lowerColor = theme.palette.success.main;
  const bandFill = alpha(theme.palette.info.main, 0.16); // translucent band fill

  const sanitize = (arr) =>
    (arr || []).map((v) =>
      v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v)
    );

  const [cl, up, lo, labels, yDomain, pctIsUp] = useMemo(() => {
    const s1 = sanitize(closes);
    const s2 = sanitize(bbUpper);
    const s3 = sanitize(bbLower);
    const maxLen = Math.max(s1.length, s2.length, s3.length, 0);

    const pad = (s) => Array(Math.max(0, maxLen - s.length)).fill(null).concat(s);
    const a1 = pad(s1);
    const a2 = pad(s2);
    const a3 = pad(s3);

    const labels = Array.from({ length: maxLen }, () => "");

    const nums = [...a1, ...a2, ...a3].filter((v) => v !== null);
    const min = nums.length ? Math.min(...nums) : 0;
    const max = nums.length ? Math.max(...nums) : 1;
    const padY = (max - min) * 0.05 || 0.5;
    const domain = { min: min - padY, max: max + padY };

    const firstIdx = a1.findIndex((v) => v !== null);
    const lastIdxFromEnd = [...a1].reverse().findIndex((v) => v !== null);
    const lastIdx = lastIdxFromEnd === -1 ? -1 : a1.length - 1 - lastIdxFromEnd;

    let pct = "0.00";
    let isUp = false;
    if (firstIdx !== -1 && lastIdx !== -1 && firstIdx < lastIdx) {
      const start = a1[firstIdx];
      const end = a1[lastIdx];
      if (start !== 0) {
        const change = ((end - start) / start) * 100;
        pct = change.toFixed(2);
        isUp = change >= 0;
      }
    }

    return [a1, a2, a3, labels, domain, pct, isUp];
  }, [closes, bbUpper, bbLower]);

  if (!cl.length) return null;

  const data = {
    labels,
    datasets: [
      // Keep Close on top visually
      {
        label: "Close",
        data: cl,
        borderColor: closeColor,
        backgroundColor: alpha(closeColor, 0.1),
        pointRadius: 0,
        borderWidth: 1.8,
        tension: 0.25,
        fill: false,
        order: 3,
      },
      // BB Upper (no fill)
      {
        label: "BB Upper",
        data: up,
        borderColor: upperColor,
        pointRadius: 0,
        borderWidth: 1.2,
        tension: 0.2,
        borderDash: [4, 4],
        fill: false,
        order: 1,
      },
      // BB Lower fills to BB Upper (dataset index 1)
      {
        label: "BB Lower",
        data: lo,
        borderColor: lowerColor,
        pointRadius: 0,
        borderWidth: 1.2,
        tension: 0.2,
        borderDash: [4, 4],
        // ↓ This creates the band between lower and upper
        fill: { target: 1 },
        backgroundColor: bandFill,
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    spanGaps: false, // don't fill across nulls/gaps
    plugins: {
      legend: { display: false },
      tooltip: {
        intersect: false,
        mode: "index",
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            return `${ctx.dataset.label}: ${v == null ? "—" : `$${v.toFixed(2)}`}`;
          },
        },
      },
    },
    elements: { point: { radius: 0 } },
    scales: {
      x: { display: false },
      y: {
        display: false,
        min: yDomain.min,
        max: yDomain.max,
      },
    },
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Box sx={{ width: "100%", height: 64 }}>
        <Line data={data} options={options} />
      </Box>
      <Typography
        variant="caption"
        sx={{ color: pctIsUp ? theme.palette.success.main : theme.palette.error.main }}
      >
      </Typography>
    </Box>
  );
};

export default SparklineChart;
