import React from "react";
import { Box, Typography, LinearProgress } from "@mui/material";

/**
 * Renders a simple horizontal meter showing how far the close price
 * is above the upper band (overbought) or below the lower band (oversold).
 */
const BandBreakoutMeter = ({ close,high_price,low_price, lower, upper, touched_side }) => {
  if (
    typeof close !== "number" ||
    typeof lower !== "number" ||
    typeof upper !== "number"
  ) {
    return null;
  }

  // We'll calculate how far we are from the relevant band (upper or lower)
  // as a percentage of that band. Then display a bar from 0% to a chosen max (e.g. 20%).
  let diff = 0;
  let base = 0;
  let color = "#1976d2"; // fallback color
  let label = "Band Breakout";

  if (touched_side === "Upper") {
    // Overbought scenario
    diff = high_price - upper; // how far above the upper band
    base = upper;
    color = "#d32f2f"; // red for overbought
    label = "Overbought Meter";
  } else {
    // Lower => Oversold scenario
    diff = lower - low_price; // how far below the lower band
    base = lower;
    color = "#2e7d32"; // green for oversold
    label = "Oversold Meter";
  }

  // Convert to percentage. If the band is zero or negative, just fallback to 0
  const rawPercentage = base !== 0 ? (diff / base) * 100 : 0;
  // If rawPercentage is negative, it means the price is not actually outside the band
  // but since we only get crosses, it should be positive. We'll clamp just in case.
  const positivePercentage = Math.max(0, rawPercentage);

  // We'll cap at 20% for the bar, so it doesn't blow out the design
  const maxBreakout = 20;
  const displayValue = Math.min(positivePercentage, maxBreakout);

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        {label}
      </Typography>

      {/* Horizontal bar */}
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
        {Math.abs(rawPercentage).toFixed(2)}%{" "}
        {touched_side === "Upper" ? "above" : "below"} Bollinger Band
      </Typography>
    </Box>
  );
};

export default BandBreakoutMeter;
