// TooltipHandler.js
// High-contrast external tooltip for Chart.js on dark canvases.
// Styles are applied on every call (so HMR updates correctly).

import { useCallback } from "react";

export function useExternalTooltipHandler() {
  return useCallback((context) => {
    const id = `chartjs-tooltip-${context.chart.id}`;

    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      document.body.appendChild(el);
    }

    // Apply styles every time (prevents stale DOM during hot reloads)
    Object.assign(el.style, {
      background: "#fff",
      color: "#0b0f14",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      boxShadow: "0 8px 24px rgba(0,0,0,.2)",
      padding: "10px 12px",
      position: "absolute",
      pointerEvents: "none",
      zIndex: 10000,
      lineHeight: 1.35,
      font:
        "500 13.5px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      maxWidth: "320px",
      whiteSpace: "normal",
      transform: "translate(-50%, -110%)",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      opacity: 0,
    });

    const { tooltip } = context;
    if (!tooltip || tooltip.opacity === 0) {
      el.style.opacity = "0";
      return;
    }
    el.style.opacity = "1";

    const rect = context.chart.canvas.getBoundingClientRect();
    el.style.left = rect.left + window.pageXOffset + tooltip.caretX + "px";
    el.style.top = rect.top + window.pageYOffset + tooltip.caretY + "px";

    // Build HTML
    const title = (tooltip.title || []).join(" ");
    const blocks = [];
    let current = [];

    (tooltip.body || []).forEach(({ lines }) => {
      lines.forEach((raw) => {
        if (/^Window \d+/.test(raw)) {
          if (current.length) blocks.push(current);
          current = [raw];
        } else current.push(raw);
      });
    });
    if (current.length) blocks.push(current);

    let html = "";
    if (title) {
      html += `<div style="font-weight:700;margin-bottom:6px;font-size:14px">${title}</div>`;
    }

    blocks.forEach((block, i) => {
      const [header, ...rest] = block;

      html += `<div style="padding-bottom:6px;${
        i < blocks.length - 1
          ? "border-bottom:1px solid #e5e7eb;margin-bottom:6px;"
          : ""
      }">
        <div style="font-weight:700;font-size:13.5px;margin-bottom:4px">${header}</div>`;

      rest.forEach((line) => {
        let ln = line.trim();

        // Value "pills" for Bounce/Drop
        if (ln.startsWith("Bounce:") || ln.startsWith("Drop:")) {
          ln = ln.replace(/^([^:]+:\s*)(\$?\s*-?[\d.,]+)/, (_, pre, amt) => {
            const n = parseFloat(amt.replace(/[^0-9.-]/g, ""));
            const bg = n < 0 ? "#ef4444" : n > 0 ? "#22c55e" : "#64748b";
            return `${pre}<span style="background:${bg};color:#fff;border-radius:6px;padding:2px 6px;font-weight:700">${amt}</span>`;
          });
        }

        // Bold label, normal value
        ln = ln.replace(
          /^([^:]+:\s*)/,
          '<span style="color:#334155;font-weight:600">$1</span>'
        );

        html += `<div style="font-size:13.5px;color:#111827;margin-bottom:2px">${ln}</div>`;
      });

      html += `</div>`;
    });

    el.innerHTML = html;
  }, []);
}
