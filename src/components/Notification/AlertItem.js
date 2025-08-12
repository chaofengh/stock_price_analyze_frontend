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
  Divider,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import SparklineChart from "./SparklineChart";
import BandBreakoutMeter from "./BandBreakoutMeter";
import { fetchCompanyLogo } from "../../API/FetchCompanyLogo";

const formatPrice = (price) =>
  typeof price === "number" ? price.toFixed(2) : price;

const getSideStyles = (theme) => ({
  Upper: {
    tint: alpha(theme.palette.error.main, 0.12),
    color: theme.palette.error.main,
    icon: <ArrowUpward sx={{ color: `${theme.palette.error.main} !important` }} />,
    label: "Overbought",
  },
  Lower: {
    tint: alpha(theme.palette.success.main, 0.12),
    color: theme.palette.success.main,
    icon: <ArrowDownward sx={{ color: `${theme.palette.success.main} !important` }} />,
    label: "Oversold",
  },
});

const AlertItem = ({
  alert,
  touched_side,
  onViewDetails,
  isSmallScreen,
  index,
}) => {
  const theme = useTheme();
  const sideStyles = getSideStyles(theme);
  const styleSet = sideStyles[touched_side] || sideStyles.Upper;

  const {
    symbol,
    close_price,
    low_price,
    high_price,
    bb_upper,
    bb_lower,
    recent_closes = [],
  } = alert || {};

  const [logo, setLogo] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchCompanyLogo(symbol)
      .then((url) => mounted && setLogo(url))
      .catch(() => mounted && setLogo(null));
    return () => {
      mounted = false;
    };
  }, [symbol]);

  return (
    <Grow in timeout={500}>
      <Card
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          backgroundColor:
            index % 2 === 0
              ? alpha(theme.palette.background.paper, 1)
              : alpha(theme.palette.background.paper, 0.96),
          transition: "border-color 150ms ease, background-color 150ms ease",
          "&:hover": {
            borderColor: alpha(theme.palette.primary.main, 0.5),
            backgroundColor: alpha(theme.palette.background.paper, 0.98),
          },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* TOP ROW: Logo, Symbol, Price and Alert Chip */}
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              {logo ? (
                <Avatar src={logo} alt={symbol} sx={{ width: 40, height: 40 }} />
              ) : (
                <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.text.primary, 0.18) }}>
                  {symbol?.[0] ?? "•"}
                </Avatar>
              )}

              <Typography variant="h6" fontWeight={700}>
                {symbol}
              </Typography>

              <Box
                sx={{
                  ml: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.info.main, 0.16),
                }}
              >
                <Typography component="span" variant="h6">
                  ${formatPrice(close_price)}
                </Typography>
              </Box>
            </Box>

            <Chip
              label={styleSet.label}
              size="small"
              icon={styleSet.icon}
              sx={{
                backgroundColor: styleSet.tint,
                color: styleSet.color,
                fontWeight: 600,
              }}
            />
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* MIDDLE ROW: BandBreakoutMeter and Sparkline Chart */}
          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            alignItems={isSmallScreen ? "flex-start" : "center"}
            justifyContent="space-between"
            gap={2.5}
            sx={{ mb: 1.5 }}
          >
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <BandBreakoutMeter
                close={close_price}
                lower={bb_lower}
                upper={bb_upper}
                touched_side={touched_side}
                high_price={high_price}
                low_price={low_price}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 220 }}>
              <SparklineChart data={recent_closes} touched_side={touched_side} />
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* BOTTOM ROW: BB Prices and View Details button */}
          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            justifyContent="space-between"
            alignItems="center"
            gap={1.5}
          >
            <Box display="flex" gap={1.25} flexWrap="wrap">
              <Typography
                variant="body2"
                sx={{
                  backgroundColor: alpha(theme.palette.warning.main, 0.18),
                  color: theme.palette.warning.dark,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 600,
                }}
              >
                <strong>BB Lower:</strong>&nbsp;${formatPrice(bb_lower)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.18),
                  color: theme.palette.success.dark,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 600,
                }}
              >
                <strong>BB Upper:</strong>&nbsp;${formatPrice(bb_upper)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                fontWeight: 700,
                px: 1.5,
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
