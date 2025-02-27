import React from "react";
import { Box, Typography } from "@mui/material";
import { Sparklines, SparklinesLine, SparklinesReferenceLine } from "react-sparklines";

const SparklineChart = ({ data, bandSide }) => {
  if (!data || data.length === 0) return null;

  const lineColor = bandSide === "Upper" ? "#d32f2f" : "#2e7d32";

  const firstVal = data[0];
  const lastVal = data[data.length - 1];
  const netChange = lastVal - firstVal;
  const percentageChange = firstVal !== 0 ? ((netChange / firstVal) * 100).toFixed(2) : 0;

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Sparklines data={data} width={100} height={40} margin={5}>
        <SparklinesLine color={lineColor} style={{ strokeWidth: 2, fill: "none" }} />
        <SparklinesReferenceLine type="mean" />
      </Sparklines>
      <Typography variant="caption" color={netChange >= 0 ? "green" : "red"}>
        {netChange >= 0 ? "+" : ""}
        {percentageChange}%
      </Typography>
    </Box>
  );
};

export default SparklineChart;
