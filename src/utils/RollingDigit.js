import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import "./RollingDigit.css"; // We’ll define CSS below

/**
 * Single digit that "rolls" from old digit to new digit.
 */
function RollingDigit({ digit }) {
  const [previousDigit, setPreviousDigit] = useState(digit);
  const [currentDigit, setCurrentDigit] = useState(digit);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (digit !== currentDigit) {
      setPreviousDigit(currentDigit);
      setCurrentDigit(digit);
      setAnimating(true);
    }
  }, [digit, currentDigit]);

  const handleAnimationEnd = () => {
    setAnimating(false);
  };

  return (
    <Box className="rolling-digit">
      <Box
        className={`digit previous-digit ${animating ? "animate-out" : ""}`}
        onAnimationEnd={handleAnimationEnd}
      >
        {previousDigit}
      </Box>
      <Box className={`digit current-digit ${animating ? "animate-in" : ""}`}>
        {currentDigit}
      </Box>
    </Box>
  );
}

/**
 * Splits the (numeric) value into digits and renders each with <RollingDigit/>.
 * E.g. 123.45 => [1,2,3, ".", 4,5]
 */
export default function RollingNumber({ number, decimals = 2 }) {
  // Convert to a string with desired decimals, e.g. "123.45"
  const strValue = parseFloat(number).toFixed(decimals);
  // Split into array of single characters
  const chars = strValue.split("");

  return (
    <Box component="span" display="inline-flex" gap={0.2}>
      {chars.map((char, idx) => {
        // If it's a decimal point, just render it plainly; no "roll" needed.
        if (char === ".") {
          return (
            <Box key={idx} component="span" sx={{ position: "relative" }}>
              {char}
            </Box>
          );
        }
        return <RollingDigit key={idx} digit={char} />;
      })}
    </Box>
  );
}
