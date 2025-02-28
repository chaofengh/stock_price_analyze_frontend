import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";

// A component that animates a single digit
const RollingDigit = ({ digit, animationDuration = 500, priceColor }) => {
  const [prevDigit, setPrevDigit] = useState(digit);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (digit !== prevDigit) {
      setAnimate(true);
      const timer = setTimeout(() => {
        setAnimate(false);
        setPrevDigit(digit);
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [digit, prevDigit, animationDuration]);

  return (
    <Box
      sx={{
        display: "inline-block",
        position: "relative",
        width: "1ch",
        height: "1em",
        overflow: "hidden",
        color: priceColor,
      }}
    >
      {/* Previous digit sliding up */}
      <Box
        sx={{
          position: "absolute",
          top: animate ? "-100%" : "0",
          transition: `top ${animationDuration}ms ease-in-out`,
          width: "100%",
          textAlign: "center",
          color: priceColor,
        }}
      >
        {prevDigit}
      </Box>
      {/* New digit sliding in */}
      <Box
        sx={{
          position: "absolute",
          top: animate ? "0" : "100%",
          transition: `top ${animationDuration}ms ease-in-out`,
          width: "100%",
          textAlign: "center",
          color: priceColor,
        }}
      >
        {digit}
      </Box>
    </Box>
  );
};

// A component that formats the full number and renders each digit with the RollingDigit component
const RollingNumber = ({ value, animationDuration = 500, priceColor }) => {
  // Format the number to always show two decimals (or adjust formatting as needed)
  const formattedValue = parseFloat(value).toFixed(2);

  return (
    <Typography variant="h4" component="span">
      {formattedValue.split("").map((char, index) => {
        // Render non-digit characters (like "." or commas) directly
        if (!/\d/.test(char)) {
          return <span key={index}>{char}</span>;
        }
        return (
          <RollingDigit
            key={index}
            digit={char}
            animationDuration={animationDuration}
            priceColor={priceColor}
          />
        );
      })}
    </Typography>
  );
};

export default RollingNumber;
