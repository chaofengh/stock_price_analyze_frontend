import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Grow,
  Grid,
  Divider,
  Card,
  CardContent,
  Avatar
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import SparklineChart from "./SparklineChart";
import axios from "axios";

// Get Finnhub API Key from .env file
const FINNHUB_API_KEY = process.env.REACT_APP_Finnhub_API_Key;

const formatPrice = (price) =>
  typeof price === "number" ? price.toFixed(2) : price;

// Define color sets for 'Upper' vs. 'Lower'
const sideStyles = {
  Upper: {
    bgColor: "#ffebee",
    textColor: "#c62828",
    icon: <ArrowUpward sx={{ color: "#c62828 !important" }} />,
    label: "Crossed Above Upper Band",
  },
  Lower: {
    bgColor: "#e8f5e9",
    textColor: "#2e7d32",
    icon: <ArrowDownward sx={{ color: "#2e7d32 !important" }} />,
    label: "Crossed Below Lower Band",
  },
};

// Fetch company logo from Finnhub
const fetchCompanyLogo = async (symbol) => {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    return response.data.logo || null;
  } catch (error) {
    console.error(`Error fetching logo for ${symbol}:`, error);
    return null;
  }
};

const AlertItem = ({ alert, bandSide, onViewDetails, isSmallScreen, index }) => {
  const { symbol, close_price, bb_upper, bb_lower, recent_closes = [] } = alert;
  const styleSet = sideStyles[bandSide] || sideStyles.Upper;

  const [logo, setLogo] = useState(null);

  useEffect(() => {
    fetchCompanyLogo(symbol).then(setLogo);
  }, [symbol]);

  return (
    <Grow in timeout={500}>
      <Card
        elevation={3}
        sx={{
          mb: 10, // More vertical spacing
          backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff", // Alternate background
          borderRadius: 2,
        }}
      >
        <CardContent>
          {/* Top row: Logo + Symbol + "Crossed" Chip + Sparkline */}
          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            alignItems={isSmallScreen ? "flex-start" : "center"}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            {/* Logo + Symbol + Chip */}
            <Box display="flex" alignItems="center" gap={2}>
              {/* Logo */}
              {logo ? (
                <Avatar src={logo} alt={symbol} sx={{ width: 40, height: 40 }} />
              ) : (
                <Avatar sx={{ width: 40, height: 40, bgcolor: "#e0e0e0" }}>
                  {symbol[0]}
                </Avatar>
              )}

              {/* Symbol and Chip */}
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: "#333" }} // More distinct heading
                >
                  {symbol}
                </Typography>
                <Chip
                  label={styleSet.label}
                  size="small"
                  sx={{
                    backgroundColor: styleSet.bgColor,
                    color: styleSet.textColor,
                    fontWeight: 500,
                  }}
                  icon={styleSet.icon}
                />
              </Box>
            </Box>

            {/* Mini Sparkline chart */}
            {recent_closes.length > 0 && (
              <Box sx={{ width: isSmallScreen ? "100%" : "120px", mt: isSmallScreen ? 2 : 0 }}>
                <SparklineChart data={recent_closes} bandSide={bandSide} />
              </Box>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Middle row: Key prices */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={3}>
              <Typography variant="body1">
                <strong>Close:</strong> {formatPrice(close_price)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Typography variant="body1">
                <strong>BB Upper:</strong> {formatPrice(bb_upper)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Typography variant="body1">
                <strong>BB Lower:</strong> {formatPrice(bb_lower)}
              </Typography>
            </Grid>
          </Grid>

          {/* Bottom row: "View Details" button */}
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button variant="contained" size="small" onClick={() => onViewDetails(symbol)}>
              View Details
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
};

export default AlertItem;
