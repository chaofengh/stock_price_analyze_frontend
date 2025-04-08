// AlertItem.jsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Grow,
  Card,
  CardContent,
  Avatar,
  Divider
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";

// Import new visual components
import SparklineChart from "./SparklineChart";
import BandBreakoutMeter from "./BandBreakoutMeter";

import { fetchCompanyLogo } from "../../API/FetchCompanyLogo";


const formatPrice = (price) =>
  typeof price === "number" ? price.toFixed(2) : price;

const sideStyles = {
  Upper: {
    bgColor: "#ffebee",
    textColor: "#d32f2f",
    icon: <ArrowUpward sx={{ color: "#d32f2f !important" }} />,
    label: "Overbought",
  },
  Lower: {
    bgColor: "#e8f5e9",
    textColor: "#2e7d32",
    icon: <ArrowDownward sx={{ color: "#2e7d32 !important" }} />,
    label: "Oversold",
  },
};


const AlertItem = ({ alert, touched_side, onViewDetails, isSmallScreen, index }) => {
  const { symbol, close_price,low_price,high_price, bb_upper, bb_lower, recent_closes = [] } = alert;
  const styleSet = sideStyles[touched_side] || sideStyles.Upper;

  const [logo, setLogo] = useState(null);

  useEffect(() => {
    fetchCompanyLogo(symbol).then(setLogo);
  }, [symbol]);

  return (
    <Grow in timeout={500}>
      <Card
        elevation={3}
        sx={{
          mb: 10,
          borderRadius: 2,
          backgroundColor: index % 2 === 0 ? "#fafafa" : "#ffffff",
        }}
      >
        <CardContent>
          {/* TOP ROW: Logo + Symbol + Overbought/Oversold Chip */}
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            {/* Left side: Logo + Symbol */}
            <Box display="flex" alignItems="center" gap={2}>
              {logo ? (
                <Avatar src={logo} alt={symbol} sx={{ width: 40, height: 40 }} />
              ) : (
                <Avatar sx={{ width: 40, height: 40, bgcolor: "#bdbdbd" }}>
                  {symbol[0]}
                </Avatar>
              )}
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#333" }}>
                {symbol}
              </Typography>
              <Typography
                variant="h6"
                style={{
                  color: "#333",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px"
                }}
              >
            ${formatPrice(close_price)}
              </Typography>
            </Box>

            {/* Right side: Overbought / Oversold Chip */}
            <Chip
              label={styleSet.label}
              size="small"
              icon={styleSet.icon}
              sx={{
                backgroundColor: styleSet.bgColor,
                color: styleSet.textColor,
                fontWeight: 500,
              }}
            />
            
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* MIDDLE ROW: BandBreakoutMeter + Sparkline side by side */}
          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            alignItems={isSmallScreen ? "flex-start" : "center"}
            justifyContent="space-between"
            gap={3}
            sx={{ mb: 2 }}
          >
            <Box sx={{ flex: 1 }}>
              <BandBreakoutMeter
                close={close_price}
                lower={bb_lower}
                upper={bb_upper}
                touched_side={touched_side}
                high_price={high_price}
                low_price={low_price}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <SparklineChart data={recent_closes} touched_side={touched_side} />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* BOTTOM ROW: Key Prices + View Details Button */}
          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            justifyContent="space-between"
            alignItems="center"
            gap={2}
          >
            <Box display="flex" gap={3} flexWrap="wrap">
              <Typography
                variant="body2"
                style={{
                  backgroundColor: "#f8d7da",
                  color: "#dc3545",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px"
                }}
              >
                <strong>BB Lower Price:</strong> {formatPrice(bb_lower)}
              </Typography>

              <Typography
                variant="body2"
                style={{
                  backgroundColor: "#d4edda",
                  color: "#28a745",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px"
                }}
              >
                <strong>BB Upper Price:</strong> {formatPrice(bb_upper)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="small"
              // 1) Add slight elevation via boxShadow
              sx={{
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                ":hover": {
                  boxShadow: "0 4px 8px rgba(0,0,0,0.25)",
                },
              }}
              // 2) On click, call parent's onViewDetails function
              onClick={() => onViewDetails(symbol)}
            >
              View Details
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
};

export default AlertItem;
