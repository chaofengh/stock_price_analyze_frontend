import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Grid, Avatar } from "@mui/material";
import StockChart from "./Chart/StockChart";
import GroupedStats from "./GroupedStats";
import AdvancedMetrics from "./AdvancedMetrics";
import MarketSentiment from "./MarketSentiment";
import FinancialWidget from "./FinancialWidget";
import { fetchCompanyLogo } from '../API/FetchCompanyLogo'
import { useAnimatedNumber } from "../utils/NumberAnimation";
import RollingNumber from "../utils/RollingDigit";
import PeopleAlsoView from "./PeopleAlsoView";


const MainContent = ({ summary, eventMap }) => {
  // State to store hovered price/date from the chart
  const [hoverData, setHoverData] = useState(null);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    if (summary?.symbol) {
      fetchCompanyLogo(summary.symbol).then(setLogo);
    }
  }, [summary?.symbol]);

  // Use hovered price if available, otherwise fallback to final price
  const rawPrice = hoverData?.price ?? summary?.final_price ?? 0;
  const animatedPrice = useAnimatedNumber(rawPrice);

  // Determine price color based on daily change
  const priceChange = summary?.price_change_in_dollars ?? 0;
  const priceColor =
    priceChange > 0 ? "green" : priceChange < 0 ? "red" : "textPrimary";

  // Get latest chart data (for Bollinger bands)
  let latestChartData = null;
  if (summary?.chart_data?.length > 0) {
    latestChartData = [...summary.chart_data].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];
  }

  return (
    <Box>
      {summary && (
        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Logo + Ticker Symbol + Price */}
          <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
            {/* Company Logo */}
            {logo ? (
              <Avatar src={logo} alt={summary.symbol} sx={{ width: 50, height: 50 }} />
            ) : (
              <Avatar sx={{ width: 50, height: 50, bgcolor: "#e0e0e0" }}>
                {summary.symbol?.charAt(0)}
              </Avatar>
            )}

            {/* Symbol and Price */}
            <Typography variant="h4" fontWeight="bold">
              {summary.symbol || "Company Name"} -{" "}
            </Typography>
            <Typography variant="h4" fontWeight='bold' color={priceColor}>
              <RollingNumber number={animatedPrice} />
            </Typography>
          </Box>

          {latestChartData && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              mt={2}
            >
              <Typography variant="body1">
                Upper Bollinger Band:{" "}
                <span
                  style={{
                    fontWeight: "bold",
                    padding: "0.3rem 0.6rem",
                    backgroundColor: "#d4edda",
                    color: "#28a745",
                    borderRadius: "6px",
                  }}
                >
                  ${latestChartData.upper.toFixed(2)}
                </span>
              </Typography>
              <Typography variant="body1">
                Lower Bollinger Band:{" "}
                <span
                  style={{
                    fontWeight: "bold",
                    padding: "0.3rem 0.6rem",
                    backgroundColor: "#f8d7da",
                    color: "#dc3545",
                    borderRadius: "6px",
                  }}
                >
                  ${latestChartData.lower.toFixed(2)}
                </span>
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <StockChart
          summary={summary}
          eventMap={eventMap}
          // onHoverPriceChange is called by StockChart when the cursor hovers a point
          onHoverPriceChange={(data) => setHoverData(data)}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <GroupedStats summary={summary} />
      </Paper >

      <Paper sx={{ p: 3, mb: 3 }}>
        <PeopleAlsoView summary={summary} />
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <AdvancedMetrics />
        </Grid>
        <Grid item xs={12} md={4}>
          <MarketSentiment />
        </Grid>
        <Grid item xs={12} md={4}>
          <FinancialWidget  income_statement={summary.income_statement}/>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MainContent;
