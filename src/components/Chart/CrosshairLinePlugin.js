// CrosshairLinePlugin.js
// Draws only the vertical guideline. (Date pill removed.)
const CrosshairLinePlugin = {
  id: "crosshairLinePlugin",

  afterDatasetsDraw(chart, _args, pluginOpts) {
    const hoverIndex = chart.$currentHoverIndex;
    if (hoverIndex == null) return;

    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;
    const xPixel = xScale.getPixelForValue(hoverIndex);
    if (!isFinite(xPixel)) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(Math.round(xPixel) + 0.5, chartArea.top);
    ctx.lineTo(Math.round(xPixel) + 0.5, chartArea.bottom);
    ctx.lineWidth = pluginOpts?.lineWidth ?? 1;
    ctx.setLineDash(pluginOpts?.lineDash ?? [3, 3]);
    ctx.strokeStyle = pluginOpts?.lineColor ?? "rgba(255,255,255,0.25)";
    ctx.stroke();
    ctx.restore();
  },
};

export default CrosshairLinePlugin;
