// TooltipHandler.js
// Visual external tooltip with zero-centered P&L micro-bars.
// Appends to document.body, positions/clamps in page coords.
// Colors & signs are based on PROFIT (pnl), not raw price delta.
// For upper-band pullbacks (short), pnl = -(delta).

import { useCallback } from "react";

export function useExternalTooltipHandler() {
  return useCallback((context) => {
    const { chart, tooltip } = context;

    // Create/reuse container on BODY
    const id = `chartjs-tooltip-${chart.id}`;
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      document.body.appendChild(el);
    }

    // Base styles
    Object.assign(el.style, {
      position: "absolute",
      pointerEvents: "none",
      zIndex: 10000,
      background: "#fff",
      color: "#0b0f14",
      border: "1px solid #e5e7eb",
      borderRadius: "var(--app-radius)",
      boxShadow: "0 8px 24px rgba(0,0,0,.2)",
      padding: "10px 12px",
      lineHeight: 1.35,
      font: "600 13px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      width: "max-content",
      minWidth: "440px",
      maxWidth: "560px",
      whiteSpace: "normal",
      overflow: "hidden",
      transform: "translate(-50%, 0)",
      opacity: 0,
    });

    if (!tooltip || tooltip.opacity === 0) {
      el.style.opacity = 0;
      return;
    }

    // Mapping stashed in options
    const mapping = chart?.options?.plugins?.tooltip?._touchMapping || {};

    // Normalize hovered label -> YYYY-MM-DD
    const dp = tooltip.dataPoints?.[0];
    const rawLabel =
      (tooltip.title && tooltip.title[0]) ??
      (dp && chart.data.labels?.[dp.dataIndex]) ??
      "";

    const toISO = (v) => {
      if (!v) return "";
      if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
      const d = new Date(v);
      return isNaN(d) ? String(v) : d.toISOString().slice(0, 10);
    };
    const dateKey = toISO(rawLabel);
    const items = mapping[dateKey] || mapping[rawLabel] || [];

    // ---------- P&L-first helpers ----------
    const money = (pnl) => `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`;
    const pct = (pnl, start) => {
      if (!start || !isFinite(start)) return "—";
      const p = (pnl / start) * 100;
      return `${p >= 0 ? "+" : "-"}${Math.abs(p).toFixed(2)}%`;
    };
    const prettyWin = (w) => (/^\d+$/.test(String(w)) ? `${w}-Day` : String(w));

    // Compute profit per row: long on lower (bounce), short on upper (pullback)
    // delta here is from your mapping (peak-touch for bounce; trough-touch or drop_dollars for pullback).
    const rows = items.map((it) => {
      const delta = Number(it.delta ?? 0);
      const pnl = it.kind === "pullback" ? -delta : delta; // <-- flip for upper-band shorts
      return { ...it, pnl };
    });

    const maxAbs = Math.max(1e-9, ...rows.map((r) => Math.abs(r.pnl)));

    // Wider zero-centered micro-bar colored by PROFIT
    const microBar = (pnl) => {
      const W = 190, H = 12, mid = W / 2, pad = 1.5;
      const mag = Math.min(1, Math.abs(pnl) / maxAbs);
      const len = Math.max(2, Math.round((W / 2 - 6) * mag));
      const isLoss = pnl < 0;

      const stroke = isLoss ? "rgba(231,76,60,0.95)" : "rgba(46,204,113,0.95)";
      const fill   = isLoss ? "rgba(231,76,60,0.16)" : "rgba(46,204,113,0.16)";
      const x = isLoss ? mid - len : mid;

      return `
        <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="flex:0 0 ${W}px">
          <rect x="${pad}" y="${(H-6)/2}" width="${W - pad*2}" height="6" rx="3" fill="rgba(0,0,0,0.06)"/>
          <rect x="${mid-0.5}" y="${(H-8)/2}" width="1" height="8" fill="rgba(0,0,0,0.22)"/>
          <rect x="${x}" y="${(H-8)/2}" width="${len}" height="8" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
        </svg>
      `;
    };

    const chip = (text) =>
      `<span style="
        display:inline-flex;align-items:center;justify-content:center;
        min-width:60px;height:22px;border-radius:var(--app-radius);padding:0 12px;
        background:rgba(0,0,0,0.06);color:#0b1220;font-weight:800;white-space:nowrap;">${text}</span>`;

    const badge = (pnl) => {
      const ok = pnl >= 0;
      const bg = ok ? "rgba(46,204,113,0.12)" : "rgba(231,76,60,0.12)";
      const fg = ok ? "#2ecc71" : "#e74c3c";
      return `<span style="
        display:inline-flex;align-items:center;height:22px;border-radius:var(--app-radius);padding:0 8px;
        font-weight:900;background:${bg};color:${fg};white-space:nowrap;">${money(pnl)}</span>`;
    };

    const daysChip = (days) =>
      `<span style="opacity:.85;font-weight:700;letter-spacing:.2px;white-space:nowrap;">⏱ ${days}d</span>`;

    // ---------- Build HTML ----------
    let html = "";
    const header = dateKey || rawLabel;
    if (header) {
      html += `<div style="font-weight:800;margin-bottom:${rows.length ? 6 : 0}px;font-size:14px">${header}</div>`;
    }

    if (rows.length) {
      rows.forEach((r, idx) => {
        const rowPct = pct(r.pnl, r.startPrice);

        html += `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;
                      ${idx < rows.length - 1 ? "border-bottom:1px solid #e5e7eb;" : ""}">
            ${chip(prettyWin(r.windowLabel))}
            ${microBar(r.pnl)}
            ${badge(r.pnl)}
            <span style="opacity:.9;font-weight:700;white-space:nowrap;">${rowPct}</span>
            ${daysChip(r.days)}
          </div>
        `;
      });
    } else if (dp) {
      html += `
        <div style="display:flex;gap:12px;">
          <div style="opacity:.85;font-weight:700;">${header}</div>
          <div>Close: ${dp.formattedValue ?? dp.raw}</div>
        </div>`;
    }

    el.innerHTML = html;

    // ---------- Position & clamp in PAGE COORDS ----------
    const rect = chart.canvas.getBoundingClientRect();
    const pageX = window.pageXOffset;
    const pageY = window.pageYOffset;

    const caretX = rect.left + pageX + tooltip.caretX;
    const caretY = rect.top  + pageY + tooltip.caretY;

    const ca = chart.chartArea;
    const areaLeft   = rect.left + pageX + ca.left;
    const areaRight  = rect.left + pageX + ca.right;
    const areaTop    = rect.top  + pageY + ca.top;
    const areaBottom = rect.top  + pageY + ca.bottom;

    const w = el.offsetWidth || 1;
    const h = el.offsetHeight || 1;
    const half = w / 2;
    const margin = 10;

    let left = caretX;
    left = Math.max(areaLeft + half + 6, Math.min(left, areaRight - half - 6));

    let top = caretY - h - margin;
    if (top < areaTop + 6) top = caretY + margin;
    if (top + h > areaBottom - 6) top = Math.max(areaTop + 6, areaBottom - 6 - h);

    el.style.left = `${left}px`;
    el.style.top  = `${top}px`;
    el.style.opacity = 1;
  }, []);
}
