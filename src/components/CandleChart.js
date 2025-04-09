import React from "react";
import { Typography } from "@mui/material";
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
  GenericChartComponent,
  withDeviceRatio,
} from "react-financial-charts";

/**
 * Custom component that draws a semi-transparent rectangle
 * from the entry date to the exit date behind the candlesticks.
 */
function TradeHighlight({ entryDate, exitDate }) {
  return (
    <GenericChartComponent
      clip={false}
      svgDraw={info => {
        const { xScale, chartConfig } = info;
        const { height } = chartConfig;

        if (!entryDate || !exitDate) return null;

        const x1 = xScale(entryDate);
        const x2 = xScale(exitDate);

        if (x1 == null || x2 == null) return null;

        const left = Math.min(x1, x2);
        const right = Math.max(x1, x2);
        const width = right - left;

        // Draw a translucent green rectangle
        return (
          <rect
            x={left}
            y={0}
            width={width}
            height={height}
            fill="rgba(46, 204, 113, 0.1)"
          />
        );
      }}
    />
  );
}

function CandleChart({
  data,
  width = 1450,
  height = 650,
  annotations = [],
}) {
  if (!data || data.length === 0) {
    return <Typography>No intraday data available for this date.</Typography>;
  }

  // Typically the first annotation is entry, second is exit.
  const entry = annotations[0];
  const exit = annotations[1];

  const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor(
    (d) => d.date
  );
  const { data: chartData, xScale, xAccessor, displayXAccessor } =
    xScaleProvider(data);

  const margin = { left: 70, right: 70, top: 20, bottom: 30 };
  const yExtentsCandle = (d) => [d.high, d.low];
  const yExtentsVolume = (d) => d.volume;

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
      style={{ backgroundColor: "#fafafa" }}
    >
      {/* MAIN CANDLE CHART */}
      <Chart id={1} yExtents={yExtentsCandle} height={height * 0.7}>
        <XAxis
          showGridLines
          gridLinesStrokeStyle="#eaeaea"
          tickLabelFill="#666"
          axisLine={{ stroke: "#999" }}
          tickLine={{ stroke: "#999" }}
        />
        <YAxis
          showGridLines
          gridLinesStrokeStyle="#eaeaea"
          tickLabelFill="#666"
          axisLine={{ stroke: "#999" }}
          tickLine={{ stroke: "#999" }}
        />

        {/* Light green highlight between entry and exit */}
        {entry && exit && (
          <TradeHighlight entryDate={entry.date} exitDate={exit.date} />
        )}

        <MouseCoordinateY
          rectWidth={margin.right}
          displayFormat={(val) => val.toFixed(2)}
        />

        <CandlestickSeries
          wickStroke={(d) => (d.close > d.open ? "#27ae60" : "#c0392b")}
          fill={(d) => (d.close > d.open ? "#2ecc71" : "#e74c3c")}
          stroke={(d) => (d.close > d.open ? "#27ae60" : "#c0392b")}
        />

        {/* Show OHLC in top-left corner */}
        <OHLCTooltip origin={[5, 0]} textFill="#333" />

        {/* Entry/Exit Annotations */}
        {annotations.map((ann, idx) => (
          <Annotate
            key={idx}
            with={SvgPathAnnotation}
            when={(d) => d.date.getTime() === ann.date.getTime()}
            usingProps={{
              y: ({ yScale, datum }) => yScale(datum.high) - 10,
              fill: ann.fill,
              path: ann.path,
              tooltip: ann.tooltip,
              tooltipBgColor: "#333",
              tooltipTextColor: "#fff",
              tooltipFontSize: 14,
            }}
          />
        ))}
      </Chart>

      {/* VOLUME CHART */}
      <Chart
        id={2}
        origin={(w, h) => [0, height * 0.7]}
        height={height * 0.3}
        yExtents={yExtentsVolume}
      >
        <XAxis
          showGridLines
          gridLinesStrokeStyle="#eaeaea"
          tickLabelFill="#666"
          axisLine={{ stroke: "#999" }}
          tickLine={{ stroke: "#999" }}
        />
        <YAxis
          showGridLines
          gridLinesStrokeStyle="#eaeaea"
          tickFormat={(val) => (val / 1000).toFixed(0) + "K"}
          tickLabelFill="#666"
          axisLine={{ stroke: "#999" }}
          tickLine={{ stroke: "#999" }}
        />
        <MouseCoordinateX displayFormat={(val) => val.toLocaleString()} />
        <MouseCoordinateY displayFormat={(val) => val.toFixed(0)} />

        <BarSeries
          yAccessor={(d) => d.volume}
          fill={(d) =>
            d.close > d.open ? "rgba(46,204,113,0.7)" : "rgba(231,76,60,0.7)"
          }
        />
      </Chart>
    </ChartCanvas>
  );
}

export default withDeviceRatio()(CandleChart);
