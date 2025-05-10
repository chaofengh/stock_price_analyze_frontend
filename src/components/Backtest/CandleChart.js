import React, { useRef, useState, useEffect } from 'react';

function CandleChart({ data, annotations }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800); // fallback
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const candleWidth = 10;

  /* ------------------------------------------------------------
     Resize once on mount so SVG fills the parent flex box
  ------------------------------------------------------------ */
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, []);

  if (!data || data.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{ width: '100%', height: '400px' }}
      >
        No data
      </div>
    );
  }

  /* ------------------------------------------------------------
     Scales
  ------------------------------------------------------------ */

  // (1) Price scale — include Bollinger bands so they fit
  const prices = data.flatMap((d) => [
    d.low,
    d.high,
    d.bbUpper ?? d.high,
    d.bbLower ?? d.low,
  ]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);


  const scaleY = (price) =>
    margin.top +
    ((maxPrice - price) / (maxPrice - minPrice)) *
      (height - margin.top - margin.bottom);

  // (2) Time scale
  const dateValues = data.map((d) => d.date.getTime());
  const minDate = Math.min(...dateValues);
  const maxDate = Math.max(...dateValues);

  const scaleX = (date) => {
    const time = date.getTime();
    if (maxDate === minDate) return margin.left; // single point fallback
    return (
      margin.left +
      ((time - minDate) / (maxDate - minDate)) *
        (containerWidth - margin.left - margin.right)
    );
  };

  /* ------------------------------------------------------------
     Axis ticks
  ------------------------------------------------------------ */
  // X‑axis ticks every 30 min
  const tickInterval = 30 * 60 * 1000;
  const startTick = Math.floor(minDate / tickInterval) * tickInterval;
  const tickDates = [];
  for (let t = startTick; t <= maxDate; t += tickInterval) {
    tickDates.push(new Date(t));
  }

  // Y‑axis ticks (5)
  const yTickCount = 5;
  const yTicks = [];
  for (let i = 0; i < yTickCount; i++) {
    yTicks.push(
      minPrice + (i * (maxPrice - minPrice)) / (yTickCount - 1)
    );
  }

  /* ------------------------------------------------------------
     Bollinger band polylines
  ------------------------------------------------------------ */
  const upperPoints = data
    .filter((d) => d.bbUpper != null)
    .map((d) => `${scaleX(d.date)},${scaleY(d.bbUpper)}`)
    .join(' ');

  const lowerPoints = data
    .filter((d) => d.bbLower != null)
    .map((d) => `${scaleX(d.date)},${scaleY(d.bbLower)}`)
    .join(' ');

  /* ------------------------------------------------------------
     Annotation helpers (unchanged)
  ------------------------------------------------------------ */
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

  const renderMarker = (anno, i) => {
    const { date, tooltip, direction } = anno;
    const x = scaleX(date);
    const y = scaleY(direction === 'long' ? maxPrice : minPrice);

    return (
      <g key={`marker-${i}`}>
        <circle
          cx={x}
          cy={y}
          r={5}
          fill={direction === 'long' ? 'green' : 'red'}
        />
        <title>{tooltip}</title>
      </g>
    );
  };

  const renderedAnnotations = annotations.map((anno, i) => {
    if (anno.type === 'trade-rectangle') return renderTradeRectangle(anno, i);
    if (anno.type === 'entry-marker' || anno.type === 'exit-marker')
      return renderMarker(anno, i);
    return null;
  });

  /* ------------------------------------------------------------
     Render
  ------------------------------------------------------------ */
  return (
    <div ref={containerRef}>
      <svg width={containerWidth} height={height}>
        {/* Bollinger bands – dashed blue */}
        {upperPoints && (
          <polyline
            points={upperPoints}
            fill="none"
            stroke="blue"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        )}
        {lowerPoints && (
          <polyline
            points={lowerPoints}
            fill="none"
            stroke="blue"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        )}

        {/* Candlesticks */}
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
              <line
                x1={centerX}
                y1={yHigh}
                x2={centerX}
                y2={yLow}
                stroke="black"
              />
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

        {/* X‑axis */}
        <line
          x1={margin.left}
          y1={height - margin.bottom}
          x2={containerWidth - margin.right}
          y2={height - margin.bottom}
          stroke="black"
        />
        {tickDates.map((tickDate, idx) => {
          const xPos = scaleX(tickDate);
          const label = tickDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
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

        {/* Y‑axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={height - margin.bottom}
          stroke="black"
        />
        {yTicks.map((tickValue, idx) => (
          <g key={idx}>
            <line
              x1={margin.left - 5}
              y1={scaleY(tickValue)}
              x2={margin.left}
              y2={scaleY(tickValue)}
              stroke="black"
            />
            <text
              x={margin.left - 10}
              y={scaleY(tickValue) + 3}
              textAnchor="end"
              fontSize="10"
              fill="black"
            >
              {tickValue.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Annotations */}
        {renderedAnnotations}
      </svg>
    </div>
  );
}

export default CandleChart;
