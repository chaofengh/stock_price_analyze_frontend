import { useState, useRef, useEffect } from "react";

// Custom hook: Animate a number from its previous value to a new one
export function useAnimatedNumber(value, duration = 500) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startValue = prevValueRef.current;
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = startValue + (value - startValue) * progress;
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = value;
      }
    }

    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
}