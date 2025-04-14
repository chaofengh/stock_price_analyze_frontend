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
  const { symbol, close_price, low_price, high_price, bb_upper, bb_lower, recent_closes = [] } = alert;
  const styleSet = sideStyles[touched_side] || sideStyles.Upper;
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    fetchCompanyLogo(symbol).then(setLogo);
  }, [symbol]);

  return (
    <Grow in timeout={500}>
      <Card
        elevation={4}
        sx={{
          mb: 2,
          borderRadius: 2,
          background: index % 2 === 0
            ? 'linear-gradient(90deg, #ffffff, #f9f9f9)'
            : 'linear-gradient(90deg, #f9f9f9, #ffffff)',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        }}
      >
        <CardContent>
          {/* TOP ROW: Logo, Symbol, Price and Alert Chip */}
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
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
                sx={{
                  color: "#333",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: "#e0f7fa",
                }}
              >
                ${formatPrice(close_price)}
              </Typography>
            </Box>
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

          {/* MIDDLE ROW: BandBreakoutMeter and Sparkline Chart */}
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

          {/* BOTTOM ROW: BB Prices and View Details button */}
          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            justifyContent="space-between"
            alignItems="center"
            gap={2}
          >
            <Box display="flex" gap={2} flexWrap="wrap">
              <Typography
                variant="body2"
                sx={{
                  backgroundColor: "#fff3cd",
                  color: "#856404",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                <strong>BB Lower:</strong> ${formatPrice(bb_lower)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                <strong>BB Upper:</strong> ${formatPrice(bb_upper)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              sx={{
                textTransform: 'none',
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                transition: 'box-shadow 0.2s',
                ':hover': {
                  boxShadow: "0 4px 8px rgba(0,0,0,0.25)",
                },
              }}
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
