import React from 'react';
import { Typography } from '@mui/material';
import {
  ChartCanvas,
  Chart,
  CandlestickSeries,
  BarSeries,
  XAxis,
  YAxis,
  discontinuousTimeScaleProvider,
  OHLCTooltip,
  MouseCoordinateX,
  MouseCoordinateY,
  Annotate,
  SvgPathAnnotation,
} from "react-financial-charts";

function CandleChart({ data, width = 800, height = 450, annotations = [] }) {
  if (!data || data.length === 0) {
    return <Typography>No intraday data available for this date.</Typography>;
  }

  const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor(d => d.date);
  const { data: chartData, xScale, xAccessor, displayXAccessor } = xScaleProvider(data);
  const margin = { left: 70, right: 70, top: 20, bottom: 30 };
  const yExtentsCandle = d => [d.high, d.low];
  const yExtentsVolume = d => d.volume;

  return (
    <ChartCanvas
      height={height}
      width={width}
      ratio={1}
      margin={margin}
      data={chartData}
      xScale={xScale}
      xAccessor={xAccessor}
      displayXAccessor={displayXAccessor}
      seriesName="Candles"
      zoomEvent={false}
      panEvent={false}
    >
      <Chart id={1} yExtents={yExtentsCandle} height={height * 0.7}>
        <XAxis showGridLines showTickLabel={false} label="Time" />
        <YAxis showGridLines label="Price" />
        <MouseCoordinateY rectWidth={margin.right} displayFormat={val => val.toFixed(2)} />
        <CandlestickSeries />
        <OHLCTooltip origin={[0, 0]} />
        {annotations.map((ann, idx) => (
          <Annotate
            key={idx}
            with={SvgPathAnnotation}
            when={d => d.date.getTime() === ann.date.getTime()}
            usingProps={{
              y: ({ yScale, datum }) => yScale(datum.high) - 10,
              fill: ann.fill,
              path: ann.path,
              tooltip: ann.tooltip
            }}
          />
        ))}
      </Chart>
      <Chart
        id={2}
        origin={(w, h) => [0, height * 0.7]}
        height={height * 0.3}
        yExtents={yExtentsVolume}
      >
        <XAxis showGridLines />
        <YAxis showGridLines tickFormat={val => (val / 1000).toFixed(0) + 'K'} />
        <MouseCoordinateX displayFormat={val => val.toLocaleString()} />
        <MouseCoordinateY displayFormat={val => val.toFixed(0)} />
        <BarSeries
          yAccessor={d => d.volume}
          fill={d => (d.close > d.open ? "#6BA583" : "#FF0000")}
        />
      </Chart>
    </ChartCanvas>
  );
}

export default CandleChart;
