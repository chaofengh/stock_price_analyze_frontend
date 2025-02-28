import { useState, useEffect, useRef } from "react";

/**
 * Breaks down two *stringified* numbers (startStr & endStr)
 * into an array of intermediate "stepped" string values.
 * E.g. "100" -> "212" => ["100", "200", "210", "212"].
 */
function buildNumberSteps(startStr, endStr) {
  const maxLen = Math.max(startStr.length, endStr.length);
  // Pad the shorter string on the left with zeros so they’re the same length
  const sPadded = startStr.padStart(maxLen, "0");
  const ePadded = endStr.padStart(maxLen, "0");

  const steps = [sPadded]; // Start with the initial (padded) string
  let current = sPadded.split("");

  // Iterate digit by digit from left (most significant) to right (least)
  for (let i = 0; i < maxLen; i++) {
    if (current[i] !== ePadded[i]) {
      current[i] = ePadded[i];
      // Join back into a string and push
      steps.push(current.join(""));
    }
  }

  return steps;
}


export function useAnimatedNumber(value, duration = 100, decimals = 2) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const timeoutsRef = useRef([]); // Track timeouts so we can clear if needed

  useEffect(() => {
    // Clear any queued timeouts from a previous animation if the value changed
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    // If value is numerically the same as our old one, do nothing
    if (prevValueRef.current === value) {
      return;
    }

    // Convert old & new to string forms (rounded if needed)
    const startNum = parseFloat(prevValueRef.current.toFixed(decimals));
    const endNum = parseFloat(value.toFixed(decimals));
    // If still no change, bail out
    if (startNum === endNum) {
      return;
    }

    const startStr = String(startNum);
    const endStr = String(endNum);

    // Build array of stepped "strings" (padded). E.g. ["100","200","210","212"]
    const stepsStr = buildNumberSteps(startStr, endStr);
    const stepCount = stepsStr.length;

    // We’ll spend equal time on each step
    const stepDuration = duration / Math.max(stepCount - 1, 1);

    let currentStep = 0;

    // Animate through each step with setTimeout
    function runStep() {
      const numericVal = parseFloat(stepsStr[currentStep]);
      setDisplayValue(numericVal);

      currentStep++;
      if (currentStep < stepCount) {
        const to = setTimeout(runStep, stepDuration);
        timeoutsRef.current.push(to);
      } else {
        // Done animating
        prevValueRef.current = value;
      }
    }

    runStep();

    // Cleanup on unmount or if value changes mid-animation
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, [value, duration, decimals]);

  return displayValue;
}
