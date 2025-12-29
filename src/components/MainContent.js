import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Avatar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import StockChart from "./Chart/StockChart";
import TradeHistoryList from "./TradeHistoryList";
import KpiTiles from "./KpiTiles"; 
import { ensureLogoForSymbol, selectLogoUrlBySymbol } from "./Redux/logosSlice";
import NumberFlow from "@number-flow/react"; // NEW (already installed)

const MainContent = ({ summary, eventMap }) => {
  const [hoverData, setHoverData] = useState(null);
  const dispatch = useDispatch();
  const symbol = summary?.symbol;
  const logo = useSelector((state) => selectLogoUrlBySymbol(state, symbol));
  const fundamentalsLoading = useSelector((state) => state.summary.fundamentalsLoading);
  const peerAvgLoading = useSelector((state) => state.summary.peerAvgLoading);
  const hasFundamentals = Boolean(
    summary &&
      (summary.marketCap != null ||
        summary.trailingPE != null ||
        summary.forwardPE != null ||
        summary.PEG != null ||
        summary.PGI != null ||
        summary.beta != null ||
        summary.dividendYield != null)
  );
  const kpiLoading = fundamentalsLoading && !hasFundamentals;

  useEffect(() => {
    if (symbol) {
      dispatch(ensureLogoForSymbol(symbol));
    }
  }, [dispatch, symbol]);

  // ── Values that follow the cursor ────────────────────────────────────────
  const latestChartPoint =
    summary?.chart_data?.length
      ? [...summary.chart_data].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )[0]
      : null;

  const rawPrice  = hoverData?.price  ?? summary?.final_price ?? 0;
  const rawUpper  = hoverData?.upper  ?? latestChartPoint?.upper ?? 0;
  const rawLower  = hoverData?.lower  ?? latestChartPoint?.lower ?? 0;

  const priceChange = summary?.price_change_in_dollars ?? 0;
  const priceColor =
    priceChange > 0 ? "green" : priceChange < 0 ? "red" : "textPrimary";

  return (
    <Box>
      {summary && (
        <Paper sx={{ p: 3, mb: 3 }}>
          {/* ── Logo • Symbol • Price ─────────────────────────────────────── */}
          <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
            {logo ? (
              <Avatar src={logo} alt={summary.symbol} sx={{ width: 50, height: 50 }} />
            ) : (
              <Avatar sx={{ width: 50, height: 50, bgcolor: "#e0e0e0" }}>
                {summary.symbol?.charAt(0)}
              </Avatar>
            )}

            <Typography variant="h4" fontWeight="bold">
              {summary.symbol || "Company"} –{" "}
            </Typography>

            <Typography
              variant="h4"
              fontWeight="bold"
              color={priceColor}
              component="span"
            >
              <NumberFlow
                value={rawPrice}
                format={{
                  style: "decimal",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
                trend={0}
                spinTiming={{ duration: 500 }}
                transformTiming={{ duration: 200 }}
                opacityTiming={{ duration: 120 }}
              />
            </Typography>
          </Box>

          {/* ── Bollinger call‑outs ───────────────────────────────────────── */}
          {summary?.chart_data?.length && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              mt={2}
            >
              <Typography variant="body1">
                Lower Bollinger Band:{" "}
                <span
                  style={{
                    fontWeight: "bold",
                    padding: "0.3rem 0.6rem",
                    backgroundColor: "#f8d7da",
                    color: "#dc3545",
                    borderRadius: "6px",
                  }}
                >
                  $
                  <NumberFlow
                    value={rawLower}
                    format={{
                      style: "decimal",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }}
                    trend={0}
                    spinTiming={{ duration: 500 }}
                    transformTiming={{ duration: 200 }}
                    opacityTiming={{ duration: 120 }}
                  />
                </span>
              </Typography>
              <Typography variant="body1">
                Upper Bollinger Band:{" "}
                <span
                  style={{
                    fontWeight: "bold",
                    padding: "0.3rem 0.6rem",
                    backgroundColor: "#d4edda",
                    color: "#28a745",
                    borderRadius: "6px",
                  }}
                >
                  $
                  <NumberFlow
                    value={rawUpper}
                    format={{
                      style: "decimal",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }}
                    trend={0}
                    spinTiming={{ duration: 500 }}
                    transformTiming={{ duration: 200 }}
                    opacityTiming={{ duration: 120 }}
                  />
                </span>
              </Typography>


            </Box>
          )}
        </Paper>
      )}

      {/* ── Chart + other widgets ─────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <StockChart
          summary={summary}
          eventMap={eventMap}
          onHoverPriceChange={setHoverData}
        />
      </Paper>
      <Paper sx={{ p: 3, mb: 3 }}>
        <KpiTiles summary={summary} isLoading={kpiLoading} peerLoading={peerAvgLoading} />
      </Paper>
      <Paper sx={{ p: 3, mb: 0 }}>
        <TradeHistoryList summary={summary} />
      </Paper>

    </Box>
  );
};

export default MainContent;
