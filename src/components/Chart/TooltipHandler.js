// TooltipHandler.js
import { useCallback } from 'react';

export function useExternalTooltipHandler() {
  return useCallback((context) => {
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip';
      tooltipEl.style.background = 'rgba(255, 255, 255, 0.95)';
      tooltipEl.style.border = '1px solid #ddd';
      tooltipEl.style.borderRadius = '8px';
      tooltipEl.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)';
      tooltipEl.style.padding = '8px';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.transition = 'all 0.1s ease';
      document.body.appendChild(tooltipEl);
    }

    const tooltipModel = context.tooltip;
    if (tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    const canvasRect = context.chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left =
      canvasRect.left + window.pageXOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top =
      canvasRect.top + window.pageYOffset + tooltipModel.caretY + 'px';

    let innerHtml = '';

    // Title
    // if (tooltipModel.title) {
    //   innerHtml += `
    //     <div style="font-family: Roboto, sans-serif; font-size: 16px; font-weight: bold; color: #333; margin-bottom: 4px;">
    //   `;
    //   tooltipModel.title.forEach((title) => {
    //     innerHtml += title + '<br/>';
    //   });
    //   innerHtml += `</div>`;
    // }

    // Body
    if (tooltipModel.body) {
      tooltipModel.body.forEach((bodyItem) => {
        bodyItem.lines.forEach((line) => {
          // ----------------------------
          // 1) BOUNCE LOGIC
          // ----------------------------
          if (line.trim().startsWith('Bounce:')) {
            // Matches "Bounce: $-0.29" or "Bounce: $ 1.09", etc.
            line = line.replace(
              /^(Bounce:\s*)(\$?\s*-?[\d.,]+)/,
              (match, prefix, amount) => {
                const numericValue = parseFloat(
                  amount.replace(/[^0-9.-]/g, '')
                );
                // Negative bounce => exclamation + red background
                if (numericValue < 0) {
                  return `
                    ${prefix}
                    <span style="background-color: red; color: white; padding: 2px 4px; border-radius: 4px;">
                      <strong>&#x26A0;</strong> ${amount}
                    </span>
                  `;
                }
                // Positive bounce => green background
                else if (numericValue > 0) {
                  return `
                    ${prefix}
                    <span style="background-color: green; color: white; padding: 2px 4px; border-radius: 4px;">
                      ${amount}
                    </span>
                  `;
                }
                // Zero => no special styling
                else {
                  return `${prefix}${amount}`;
                }
              }
            );
          }

          // ----------------------------
          // 2) DROP LOGIC
          // ----------------------------
          else if (line.trim().startsWith('Drop:')) {
            // Negative => normal red background, Positive => exclamation + green background
            line = line.replace(
              /^(Drop:\s*)(\$?\s*-?[\d.,]+)/,
              (match, prefix, amount) => {
                const numericValue = parseFloat(
                  amount.replace(/[^0-9.-]/g, '')
                );
                if (numericValue < 0) {
                  // Negative drop => red background
                  return `
                    ${prefix}
                    <span style="background-color: red; color: white; padding: 2px 4px; border-radius: 4px;">
                      ${amount}
                    </span>
                  `;
                } else if (numericValue > 0) {
                  // Positive drop => exclamation + green background
                  return `
                    ${prefix}
                    <span style="background-color: green; color: white; padding: 2px 4px; border-radius: 4px;">
                      <strong>&#x26A0;</strong> ${amount}
                    </span>
                  `;
                } else {
                  // Zero => no special styling
                  return `${prefix}${amount}`;
                }
              }
            );
          }

          // Bold the label portion (e.g. "Bounce:", "Drop:", "Event:", etc.)
          line = line.replace(/^([^:]+:\s*)/, "<strong>$1</strong>");

          // Build final HTML for this line
          innerHtml += `
            <div style="font-family: Roboto, sans-serif; font-size: 14px; color: #555; margin-bottom: 2px;">
              ${line}
            </div>
          `;
        });
      });
    }

    tooltipEl.innerHTML = innerHtml;
  }, []);
}
