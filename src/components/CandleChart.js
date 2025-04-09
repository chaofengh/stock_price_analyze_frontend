import React from 'react';

function CandleChart({ data, annotations }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div>No data available</div>;
  }

  console.log(annotations)

  // Define chart dimensions and margins
  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const candleWidth = 10;

  // Determine the overall min and max price for vertical scaling
  const prices = data.flatMap(d => [d.low, d.high]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Define the vertical scale function
  const scaleY = price =>
    margin.top + ((maxPrice - price) / (maxPrice - minPrice)) * (height - margin.top - margin.bottom);

  // Compute the time domain from the data dates (as timestamps)
  const dateValues = data.map(d => new Date(d.date).getTime());
  const minDate = Math.min(...dateValues);
  const maxDate = Math.max(...dateValues);

  // Define a horizontal time scale based on the date value.
  // This maps a given date to an x coordinate within the margins.
  const scaleX = (date) => {
    const time = new Date(date).getTime();
    return margin.left + ((time - minDate) / (maxDate - minDate)) * (width - margin.left - margin.right);
  };

  // Prepare a few tick marks for the x-axis: min, mid, and max dates.
  const midDate = new Date((minDate + maxDate) / 2);
  const tickDates = [new Date(minDate), midDate, new Date(maxDate)];

  return (
    <svg width={width} height={height}>
      {/* Draw a translucent annotation rectangle if annotations are provided */}
      {annotations && annotations.length >= 2 && (
        <rect
          x={scaleX(annotations[0].date)}
          y={margin.top}
          width={scaleX(annotations[1].date) - scaleX(annotations[0].date)}
          height={height - margin.top - margin.bottom}
          fill="rgba(100, 149, 237, 0.2)"  // light, transparent color
        />
      )}

      {/* Draw the candlesticks */}
      {data.map((d, i) => {
        // Use the date from each data item to compute its position (centered on the x-axis)
        const centerX = scaleX(d.date);
        // Subtract half the candle width for proper centering of the rectangle
        const x = centerX - candleWidth / 2;

        // Compute vertical positions using the price scale
        const yHigh = scaleY(d.high);
        const yLow = scaleY(d.low);
        const yOpen = scaleY(d.open);
        const yClose = scaleY(d.close);
        const bodyTop = Math.min(yOpen, yClose);
        const bodyBottom = Math.max(yOpen, yClose);
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);  // Ensure a minimum height if prices are equal

        // Determine color: green if the price went up, red if it went down
        const color = d.close >= d.open ? 'green' : 'red';

        return (
          <g key={i}>
            {/* Draw the wick */}
            <line
              x1={centerX}
              y1={yHigh}
              x2={centerX}
              y2={yLow}
              stroke="black"
            />
            {/* Draw the candle body */}
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

      {/* Draw the x-axis line */}
      <line
        x1={margin.left}
        y1={height - margin.bottom}
        x2={width - margin.right}
        y2={height - margin.bottom}
        stroke="black"
      />

      {/* Draw x-axis tick marks and labels */}
      {tickDates.map((tickDate, idx) => {
        const xPos = scaleX(tickDate);
        // Format the tick label (for example, as MM/DD/YYYY)
        const label = tickDate.toLocaleDateString();
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
    </svg>
  );
}

export default CandleChart;
