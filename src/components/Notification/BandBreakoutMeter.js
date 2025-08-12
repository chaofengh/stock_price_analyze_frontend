// BandBreakoutMeter.jsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

/**
 * Center-anchored meter:
 *  - 0% at the center
 *  - Fills to the right (red) when price breaks ABOVE upper band (overbought)
 *  - Fills to the left (green) when price breaks BELOW lower band (oversold)
 */
const BandBreakoutMeter = ({
  close,
  high_price,
  low_price,
  lower,
  upper,
  touched_side,
}) => {
  if (
    typeof close !== "number" ||
    typeof lower !== "number" ||
    typeof upper !== "number"
  ) {
    return null;
  }

  // Compute raw % distance from the touched band
  let diff = 0;
  let base = 0;
  let label = "Band Breakout";

  if (touched_side === "Upper") {
    diff = high_price - upper;
    base = upper;
    label = "Overbought Meter";
  } else {
    diff = lower - low_price;
    base = lower;
    label = "Oversold Meter";
  }

  const rawPct = base !== 0 ? (diff / base) * 100 : 0;
  // Positive -> right (overbought), Negative -> left (oversold)
  const signedPct = touched_side === "Upper" ? +rawPct : -rawPct;

  // Clamp to a symmetric max range
  const maxBreakout = 20; // +/- 20%
  const clamped = Math.max(-maxBreakout, Math.min(maxBreakout, signedPct));

  // How much of HALF the bar to fill (0–50%)
  const fillHalfPct = (Math.abs(clamped) / maxBreakout) * 50;

  const isRight = clamped >= 0; // right = overbought
  const fillColor = (theme) =>
    isRight ? theme.palette.error.main : theme.palette.success.main;

  // End cap (dot) position in % from left of the track
  const endPosPct = 50 + (isRight ? fillHalfPct : -fillHalfPct);

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        {label}
      </Typography>

      {/* Track */}
      <Box
        role="meter"
        aria-valuemin={-maxBreakout}
        aria-valuemax={maxBreakout}
        aria-valuenow={Number(clamped.toFixed(2))}
        sx={(theme) => ({
          position: "relative",
          height: 12,
          borderRadius: 6,
          overflow: "hidden",
          // subtle tinted halves: left (oversold/green) | right (overbought/red)
          background: `linear-gradient(
            90deg,
            ${alpha(theme.palette.success.main, 0.12)} 0%,
            ${alpha(theme.palette.success.main, 0.12)} 50%,
            ${alpha(theme.palette.error.main, 0.12)} 50%,
            ${alpha(theme.palette.error.main, 0.12)} 100%
          )`,
        })}
      >
        {/* Center divider */}
        <Box
          sx={(theme) => ({
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: alpha(theme.palette.text.primary, 0.25),
          })}
        />

        {/* Fill from center */}
        <Box
          sx={(theme) => ({
            position: "absolute",
            top: 0,
            bottom: 0,
            left: isRight ? "50%" : `${50 - fillHalfPct}%`,
            width: `${fillHalfPct}%`,
            backgroundColor: fillColor(theme),
            transition: "left 200ms ease, width 200ms ease",
          })}
        />

        {/* End cap (dot) */}
        <Box
          sx={(theme) => ({
            position: "absolute",
            top: "50%",
            left: `${endPosPct}%`,
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: fillColor(theme),
            border: `2px solid ${alpha(theme.palette.background.paper, 0.9)}`,
            boxShadow: `0 2px 6px ${alpha(fillColor(theme), 0.4)}`,
            transition: "left 200ms ease",
          })}
        />
      </Box>

      <Typography
        variant="caption"
        sx={(theme) => ({
          mt: 0.5,
          display: "inline-block",
          color: isRight
            ? theme.palette.error.main
            : theme.palette.success.main,
        })}
      >
        {`${Math.abs(rawPct).toFixed(2)}% ${
          touched_side === "Upper" ? "above" : "below"
        } Bollinger Band`}
      </Typography>
    </Box>
  );
};

export default BandBreakoutMeter;
