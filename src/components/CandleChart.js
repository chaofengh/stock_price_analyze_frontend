import React, { useRef, useState, useEffect } from 'react';

function CandleChart({ data, annotations }) {
  // Responsive width: measure parent's width using a ref.
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800); // fallback value
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 }; // increased left margin for y-axis labels
  const candleWidth = 10;

  console.log('CandleChart data:', data);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, []);

  // Vertical (price) scale: compute min and max prices.
  const prices = data.flatMap(d => [d.low, d.high]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const scaleY = price =>
    margin.top +
    ((maxPrice - price) / (maxPrice - minPrice)) *
      (height - margin.top - margin.bottom);

  // Horizontal (time) scale based on each data point's date.
  const dateValues = data.map(d => new Date(d.date).getTime());
  const minDate = Math.min(...dateValues);
  const maxDate = Math.max(...dateValues);
  const scaleX = date => {
    const time = new Date(date).getTime();
    return margin.left +
      ((time - minDate) / (maxDate - minDate)) *
      (containerWidth - margin.left - margin.right);
  };

  // Create x-axis ticks every 30 minutes.
  const tickInterval = 30 * 60 * 1000; // 30 minutes in milliseconds
  // Floor minDate to the nearest half-hour.
  const startTick = Math.floor(minDate / tickInterval) * tickInterval;
  const tickDates = [];
  for (let t = startTick; t <= maxDate; t += tickInterval) {
    tickDates.push(new Date(t));
  }

  // Prepare y-axis tick values. In this example we choose 5 ticks.
  const yTickCount = 5;
  const yTicks = [];
  for (let i = 0; i < yTickCount; i++) {
    const tickValue = minPrice + (i * (maxPrice - minPrice)) / (yTickCount - 1);
    yTicks.push(tickValue);
  }

  // Render annotation rectangle with trade direction if at least two annotations are present.
  let annotationRect = null;
  if (annotations && annotations.length >= 2) {
    const tradeDirection = annotations[0].direction;
    // Use a translucent green for "long" and translucent red for "short"
    const annotationFill =
      tradeDirection === 'long' ? 'rgba(0,128,0,0.2)' : 'rgba(255,0,0,0.2)';
    const annotationX = scaleX(annotations[0].date);
    const annotationWidth = scaleX(annotations[1].date) - scaleX(annotations[0].date);
    annotationRect = (
      <g>
        <rect
          x={annotationX}
          y={margin.top}
          width={annotationWidth}
          height={height - margin.top - margin.bottom}
          fill={annotationFill}
        />
        <text
          x={annotationX + annotationWidth / 2}
          y={margin.top + 20}
          textAnchor="middle"
          fontSize="14"
          fill={tradeDirection === 'long' ? 'green' : 'red'}
        >
          {tradeDirection.toUpperCase()}
        </text>
      </g>
    );
  }

  return (
    <div ref={containerRef}>
      <svg width={containerWidth} height={height}>
        {/* Annotation Rectangle */}
        {annotationRect}

        {/* Draw the candlesticks */}
        {data.map((d, i) => {
          const centerX = scaleX(d.date);
          const x = centerX - candleWidth / 2;
          const yHigh = scaleY(d.high);
          const yLow = scaleY(d.low);
          const yOpen = scaleY(d.open);
          const yClose = scaleY(d.close);
          const bodyTop = Math.min(yOpen, yClose);
          const bodyBottom = Math.max(yOpen, yClose);
          const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
          const color = d.close >= d.open ? 'green' : 'red';

          return (
            <g key={i}>
              {/* Draw the wick */}
              <line x1={centerX} y1={yHigh} x2={centerX} y2={yLow} stroke="black" />
              {/* Draw the candle body */}
              <rect x={x} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} />
            </g>
          );
        })}

        {/* Draw the x-axis */}
        <line
          x1={margin.left}
          y1={height - margin.bottom}
          x2={containerWidth - margin.right}
          y2={height - margin.bottom}
          stroke="black"
        />

        {/* Draw x-axis tick marks and time labels */}
        {tickDates.map((tickDate, idx) => {
          const xPos = scaleX(tickDate);
          // Format the label to show time (HH:MM AM/PM)
          const label = tickDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <g key={idx}>
              <line
                x1={xPos}
                y1={height - margin.bottom}
                x2={xPos}
                y2={height - margin.bottom + 5}
                stroke="black"
              />
              <text
                x={xPos}
                y={height - margin.bottom + 15}
                textAnchor="middle"
                fontSize="10"
                fill="black"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Draw the y-axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={height - margin.bottom}
          stroke="black"
        />
        {/* Draw y-axis tick marks and labels */}
        {yTicks.map((tickValue, idx) => {
          const yPos = scaleY(tickValue);
          return (
            <g key={idx}>
              <line
                x1={margin.left - 5}
                y1={yPos}
                x2={margin.left}
                y2={yPos}
                stroke="black"
              />
              <text
                x={margin.left - 10}
                y={yPos + 3}
                textAnchor="end"
                fontSize="10"
                fill="black"
              >
                {tickValue.toFixed(2)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default CandleChart;
