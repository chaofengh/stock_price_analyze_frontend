import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Grid, Avatar } from "@mui/material";
import StockChart from "./Chart/StockChart";
import GroupedStats from "./GroupedStats";
import AdvancedMetrics from "./AdvancedMetrics";
import MarketSentiment from "./MarketSentiment";
import FinancialWidget from "./FinancialWidget";
import PeopleAlsoView from "./PeopleAlsoView";
import { fetchCompanyLogo } from "../API/FetchCompanyLogo";
import NumberFlow from "@number-flow/react";                 // NEW ⬅️

const MainContent = ({ summary, eventMap }) => {
  const [hoverData, setHoverData] = useState(null);
  const [logo, setLogo]           = useState(null);

  useEffect(() => {
    if (summary?.symbol) {
      fetchCompanyLogo(summary.symbol).then(setLogo);
    }
  }, [summary?.symbol]);

  // Price from hover, or last close
  const rawPrice = hoverData?.price ?? summary?.final_price ?? 0;

  // Colour the price
  const priceChange = summary?.price_change_in_dollars ?? 0;
  const priceColor =
    priceChange > 0 ? "green" : priceChange < 0 ? "red" : "textPrimary";

  // Latest Bollinger data
  let latestChartData = null;
  if (summary?.chart_data?.length) {
    latestChartData = [...summary.chart_data].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];
  }

  return (
    <Box>
      {summary && (
        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Logo • Symbol • Price */}
          <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
            {/* Company logo */}
            {logo ? (
              <Avatar src={logo} alt={summary.symbol} sx={{ width: 50, height: 50 }} />
            ) : (
              <Avatar sx={{ width: 50, height: 50, bgcolor: "#e0e0e0" }}>
                {summary.symbol?.charAt(0)}
              </Avatar>
            )}

            <Typography variant="h4" fontWeight="bold">
              {summary.symbol || "Company Name"} –{" "}
            </Typography>

            {/* Animated price */}
            <Typography
              variant="h4"
              fontWeight="bold"
              color={priceColor}
              component="span"
            >
              <NumberFlow
                value={rawPrice}
                format={{ style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                trend={0}                         // per‑digit up/down
                spinTiming={{ duration: 500 }}    // ms for rolling
                transformTiming={{ duration: 200 }}
                opacityTiming={{ duration: 120 }}
              />
            </Typography>
          </Box>

          {/* Bollinger call‑outs */}
          {latestChartData && (
            <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={2}>
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
          onHoverPriceChange={setHoverData}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <GroupedStats summary={summary} />
      </Paper>

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
          <FinancialWidget income_statement={summary.income_statement} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MainContent;
