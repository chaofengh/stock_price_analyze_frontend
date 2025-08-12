// CrosshairLinePlugin.js
// Draws a vertical crosshair + a readable, clamped date pill.

const CrosshairLinePlugin = {
  id: "crosshairLinePlugin",

  afterDatasetsDraw(chart, _args, pluginOpts) {
    const hoverIndex = chart.$currentHoverIndex;
    if (hoverIndex == null) return;

    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;
    const xPixel = xScale.getPixelForValue(hoverIndex);
    if (!isFinite(xPixel)) return;

    /* ── vertical guideline ── */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(Math.round(xPixel) + 0.5, chartArea.top);
    ctx.lineTo(Math.round(xPixel) + 0.5, chartArea.bottom);
    ctx.lineWidth = pluginOpts?.lineWidth ?? 1;
    ctx.setLineDash(pluginOpts?.lineDash ?? [3, 3]);
    ctx.strokeStyle = pluginOpts?.lineColor ?? "rgba(255,255,255,0.25)";
    ctx.stroke();
    ctx.restore();

    /* ── human-friendly date pill ── */
    const raw = chart.data.labels?.[hoverIndex];
    if (raw == null) return;

    // Format to "Jul 8, 2025" if it's a date-like string
    let text = String(raw);
    const d = new Date(raw);
    if (!isNaN(d)) {
      text = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const padX = pluginOpts?.labelPadX ?? 8;
    const padY = pluginOpts?.labelPadY ?? 4;
    const radius = pluginOpts?.labelRadius ?? 6;
    const bg = pluginOpts?.labelBg ?? "rgba(16,18,21,0.92)";
    const fg = pluginOpts?.labelColor ?? "#fff";
    const topOffset = pluginOpts?.labelTop ?? 8;

    ctx.save();
    ctx.font =
      "600 12.5px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.textBaseline = "middle";
    const textW = ctx.measureText(text).width;
    const pillW = Math.ceil(textW + padX * 2);
    const pillH = Math.ceil(12.5 + padY * 2);

    // Clamp inside plot area so it never overflows
    let left = xPixel - pillW / 2;
    left = Math.min(
      Math.max(left, chartArea.left + 4),
      chartArea.right - pillW - 4
    );
    const top = chartArea.top + topOffset;

    // Rounded rectangle
    (function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();
    })(left, top, pillW, pillH, radius);

    ctx.fillStyle = fg;
    ctx.fillText(text, left + padX, top + pillH / 2);
    ctx.restore();
  },
};

export default CrosshairLinePlugin;
