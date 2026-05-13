import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";

vi.mock("react-chartjs-2", () => {
  let lastLineProps = null;
  let lastChartProps = null;

  return {
    Line: React.forwardRef((props, _ref) => {
      lastLineProps = props;
      return <div data-testid="line-chart" />;
    }),
    Chart: React.forwardRef((props, _ref) => {
      if (props.type === "candlestick" && props.data.datasets[0]?.type !== "candlestick") {
        throw new Error("Candlestick chart rendered before candle data was ready.");
      }
      lastChartProps = props;
      return <div data-testid="generic-chart" data-type={props.type} />;
    }),
    __getLastLineProps: () => lastLineProps,
    __getLastChartProps: () => lastChartProps,
  };
});

import { __getLastChartProps, __getLastLineProps } from "react-chartjs-2";
import StockChart from "./StockChart";

const summary = {
  symbol: "TEST",
  chart_data: [
    {
      date: "2026-01-02",
      open: 100,
      high: 103,
      low: 99,
      close: 102,
      upper: 110,
      lower: 90,
      isTouch: true,
    },
    {
      date: "2026-01-03",
      open: 102,
      high: 104,
      low: 101,
      close: 103,
      upper: 111,
      lower: 91,
      isTouch: false,
    },
    {
      date: "2026-01-04",
      open: 103,
      high: 105,
      low: 100,
      close: 101,
      upper: 112,
      lower: 92,
      isTouch: true,
    },
  ],
  window_5: {
    lower_touch_bounces: [
      {
        touch_date: "2026-01-02",
        touch_price: 100,
        peak_price: 104,
        trading_days: 3,
      },
    ],
    upper_touch_pullbacks: [],
  },
  window_10: {
    lower_touch_bounces: [],
    upper_touch_pullbacks: [],
  },
};

describe("StockChart price view toggle", () => {
  it("defaults to close line mode with existing touch cue dataset behavior", async () => {
    render(
      <StockChart
        summary={summary}
        eventMap={{}}
        onHoverPriceChange={vi.fn()}
        range="3M"
        onRangeChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Candles" })).toHaveAttribute("aria-pressed", "false");

    const lineProps = __getLastLineProps();
    expect(lineProps.data.datasets[0].type).toBe("line");
    expect(Array.isArray(lineProps.data.datasets[0].pointRadius)).toBe(true);
    expect(lineProps.data.datasets[1].label).toBe("Lower BB");
    expect(lineProps.data.datasets[2].label).toBe("Upper BB");
    expect(lineProps.options.plugins.tooltip.enabled).toBe(false);
    expect(typeof lineProps.options.plugins.tooltip.external).toBe("function");
  });

  it("switches to candlestick mode with standard candle dataset and neutral tooltip config", async () => {
    render(
      <StockChart
        summary={summary}
        eventMap={{}}
        onHoverPriceChange={vi.fn()}
        range="3M"
        onRangeChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Candles" }));

    await waitFor(() => {
      expect(screen.getByTestId("generic-chart")).toBeInTheDocument();
    });

    const chartProps = __getLastChartProps();
    expect(chartProps.type).toBe("candlestick");
    expect(chartProps.data.datasets[0].type).toBe("candlestick");
    expect(chartProps.data.datasets[0].pointRadius).toBeUndefined();
    expect(chartProps.data.datasets[0].data[0]).toMatchObject({
      o: 100,
      h: 103,
      l: 99,
      c: 102,
    });
    expect(chartProps.data.datasets[1].label).toBe("Lower BB");
    expect(chartProps.data.datasets[2].label).toBe("Upper BB");

    expect(chartProps.options.plugins.tooltip.enabled).toBe(true);
    expect(chartProps.options.plugins.tooltip.external).toBeUndefined();
    expect(typeof chartProps.options.plugins.tooltip.callbacks.label).toBe("function");
  });

  it("adds optional prediction marker dataset with status colors and direction shapes", async () => {
    render(
      <StockChart
        summary={summary}
        eventMap={{}}
        onHoverPriceChange={vi.fn()}
        range="3M"
        onRangeChange={vi.fn()}
        predictionMarkers={[
          { signal_date: "2026-01-02", predicted_direction: "reversal", is_correct: true },
          { signal_date: "2026-01-04", predicted_direction: "continuation", is_correct: false },
        ]}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    const lineProps = __getLastLineProps();
    const markerDataset = lineProps.data.datasets[3];
    expect(markerDataset.label).toBe("Prediction signals");
    expect(markerDataset.parsing).toBe(false);
    expect(markerDataset.data).toEqual([
      { x: 0, y: 102 },
      { x: 2, y: 101 },
    ]);
    expect(markerDataset.pointRadius).toEqual([3.75, 3.75]);
    expect(markerDataset.pointBackgroundColor).toEqual(["#34c759", "#ff453a"]);
    expect(markerDataset.pointStyle).toEqual(["triangle", "rectRounded"]);
  });

  it("stacks multiple open prediction markers on the same trading day", async () => {
    render(
      <StockChart
        summary={summary}
        eventMap={{}}
        onHoverPriceChange={vi.fn()}
        range="3M"
        onRangeChange={vi.fn()}
        predictionMarkers={[
          {
            signal_date: "2026-01-02",
            predicted_direction: "reversal",
            marker_status: "open",
            horizon: "5d",
            is_active_horizon: true,
            is_correct: null,
          },
          {
            signal_date: "2026-01-02",
            predicted_direction: "continuation",
            marker_status: "open",
            horizon: "10d",
            is_correct: null,
          },
        ]}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    const lineProps = __getLastLineProps();
    const markerDataset = lineProps.data.datasets[3];
    expect(markerDataset.data).toHaveLength(2);
    expect(markerDataset.data[0].x).toBe(0);
    expect(markerDataset.data[1].x).toBe(0);
    expect(markerDataset.data[0].y).not.toBe(markerDataset.data[1].y);
    expect(markerDataset.pointRadius).toEqual([5.5, 4.75]);
    expect(markerDataset.pointBackgroundColor).toEqual(["#ff9f0a", "#ff9f0a"]);
    expect(markerDataset.pointBorderColor).toEqual(["#24180a", "#24180a"]);
    expect(markerDataset.pointStyle).toEqual(["triangle", "rectRounded"]);
  });

  it("can mute Bollinger touch markers so they do not look like predictions", async () => {
    render(
      <StockChart
        summary={summary}
        eventMap={{}}
        onHoverPriceChange={vi.fn()}
        range="3M"
        onRangeChange={vi.fn()}
        touchMarkerVariant="neutral"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    const lineProps = __getLastLineProps();
    const closeDataset = lineProps.data.datasets[0];
    expect(closeDataset.pointBackgroundColor[0]).toBe("rgba(148,163,184,0.58)");
    expect(closeDataset.pointBackgroundColor[2]).toBe("rgba(148,163,184,0.58)");
    expect(closeDataset.pointBorderColor[0]).toBe("rgba(227,236,255,0.34)");
    expect(closeDataset.pointBackgroundColor[1]).toBe("rgba(25,118,210,0.9)");
  });
});
