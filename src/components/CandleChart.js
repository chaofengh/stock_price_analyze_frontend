import React, { useRef, useState, useEffect } from 'react';

function CandleChart({ data, annotations }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800); // fallback
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const candleWidth = 10;

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, []);

  if (!data || data.length === 0) {
    return <div ref={containerRef} style={{ width: '100%', height: '400px' }}>No data</div>;
  }

  // Price scale
  const prices = data.flatMap(d => [d.low, d.high]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const scaleY = price =>
    margin.top +
    ((maxPrice - price) / (maxPrice - minPrice)) *
      (height - margin.top - margin.bottom);

  // Time scale
  const dateValues = data.map(d => d.date.getTime());
  const minDate = Math.min(...dateValues);
  const maxDate = Math.max(...dateValues);
  const scaleX = date => {
    const time = date.getTime();
    if (maxDate === minDate) return margin.left; // fallback if single point
    return (
      margin.left +
      ((time - minDate) / (maxDate - minDate)) *
        (containerWidth - margin.left - margin.right)
    );
  };

  // X-axis ticks every 30 minutes
  const tickInterval = 30 * 60 * 1000; // 30 minutes in ms
  const startTick = Math.floor(minDate / tickInterval) * tickInterval;
  const tickDates = [];
  for (let t = startTick; t <= maxDate; t += tickInterval) {
    tickDates.push(new Date(t));
  }

  // Y-axis ticks (e.g. 5)
  const yTickCount = 5;
  const yTicks = [];
  for (let i = 0; i < yTickCount; i++) {
    const tickValue = minPrice + (i * (maxPrice - minPrice)) / (yTickCount - 1);
    yTicks.push(tickValue);
  }

  // Helper to draw annotation rectangles
  // from entryDate -> exitDate
  const renderTradeRectangle = (anno, i) => {
    const { entryDate, exitDate, fill, label, direction } = anno;
    const x1 = scaleX(entryDate);
    const x2 = scaleX(exitDate);
    const rectX = Math.min(x1, x2);
    const rectWidth = Math.abs(x2 - x1);

    return (
      <g key={`tradeRect-${i}`}>
        <rect
          x={rectX}
          y={margin.top}
          width={rectWidth}
          height={height - margin.top - margin.bottom}
          fill={fill}
        />
        {/* Label near the top center */}
        <text
          x={rectX + rectWidth / 2}
          y={margin.top + 15}
          textAnchor="middle"
          fontSize="12"
          fill={direction === 'long' ? 'green' : 'red'}
        >
          {label}
        </text>
      </g>
    );
  };

  // Helper to render a small marker/circle for entry/exit
  const renderMarker = (anno, i) => {
    const { date, tooltip, direction } = anno;
    const x = scaleX(date);
    const y = scaleY(
      direction === 'long' ? maxPrice : minPrice
    ); 
    // put the marker near top if long, near bottom if short
    // or you could also put it at the candle's close if you prefer

    return (
      <g key={`marker-${i}`}>
        <circle cx={x} cy={y} r={5} fill={direction === 'long' ? 'green' : 'red'} />
        <title>{tooltip}</title>
      </g>
    );
  };

  // We'll break the annotations array into multiple elements
  const renderedAnnotations = annotations.map((anno, i) => {
    if (anno.type === 'trade-rectangle') {
      return renderTradeRectangle(anno, i);
    } else if (anno.type === 'entry-marker' || anno.type === 'exit-marker') {
      return renderMarker(anno, i);
    }
    // fallback
    return null;
  });

  return (
    <div ref={containerRef}>
      <svg width={containerWidth} height={height}>
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
              {/* Wick */}
              <line
                x1={centerX}
                y1={yHigh}
                x2={centerX}
                y2={yLow}
                stroke="black"
              />
              {/* Candle body */}
              <rect
                x={x}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
              />
            </g>
          );
        })}

        {/* X-axis */}
        <line
          x1={margin.left}
          y1={height - margin.bottom}
          x2={containerWidth - margin.right}
          y2={height - margin.bottom}
          stroke="black"
        />
        {/* X-axis ticks/labels */}
        {tickDates.map((tickDate, idx) => {
          const xPos = scaleX(tickDate);
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

        {/* Y-axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={height - margin.bottom}
          stroke="black"
        />
        {/* Y-axis ticks/labels */}
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

        {/* Annotations (trade rectangles + markers) */}
        {renderedAnnotations}
      </svg>
    </div>
  );
}

export default CandleChart;
