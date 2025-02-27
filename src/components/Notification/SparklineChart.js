import React from 'react';
import { Sparklines, SparklinesLine } from 'react-sparklines';

const SparklineChart = ({ data, bandSide }) => {
  // Expecting 7 days (or fewer if not available)
  const lineColor = bandSide === 'Upper' ? '#c62828' : '#2e7d32'; 

  return (
    <Sparklines
      data={data}
      limit={data.length}
      width={120}
      height={40}
      margin={5}
    >
      <SparklinesLine 
        color={lineColor} 
        style={{ strokeWidth: 2, fill: 'none' }} 
      />
    </Sparklines>
  );
};

export default SparklineChart;
