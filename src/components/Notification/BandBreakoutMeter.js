import React from "react";
import { Box, Typography, LinearProgress } from "@mui/material";

/**
 * Renders a simple horizontal meter showing how far the close price
 * is above the upper band (overbought) or below the lower band (oversold).
 */
const BandBreakoutMeter = ({ close, high_price, low_price, lower, upper, touched_side }) => {
  if (
    typeof close !== "number" ||
    typeof lower !== "number" ||
    typeof upper !== "number"
  ) {
    return null;
  }

  let diff = 0;
  let base = 0;
  let color = "#1976d2";
  let label = "Band Breakout";

  if (touched_side === "Upper") {
    diff = high_price - upper;
    base = upper;
    color = "#d32f2f"; // red for overbought
    label = "Overbought Meter";
  } else {
    diff = lower - low_price;
    base = lower;
    color = "#2e7d32"; // green for oversold
    label = "Oversold Meter";
  }

  const rawPercentage = base !== 0 ? (diff / base) * 100 : 0;
  const positivePercentage = Math.max(0, rawPercentage);
  const maxBreakout = 20;
  const displayValue = Math.min(positivePercentage, maxBreakout);

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={(displayValue / maxBreakout) * 100}
        sx={{
          height: 8,
          borderRadius: 4,
          "& .MuiLinearProgress-bar": {
            backgroundColor: color,
          },
        }}
      />
      <Typography variant="caption">
        {Math.abs(rawPercentage).toFixed(2)}% {touched_side === "Upper" ? "above" : "below"} Bollinger Band
      </Typography>
    </Box>
  );
};

export default BandBreakoutMeter;
