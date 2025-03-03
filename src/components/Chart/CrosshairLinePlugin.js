const CrosshairLinePlugin = {
    id: 'crosshairLinePlugin',
    afterDatasetsDraw(chart) {
      if (chart.$currentHoverIndex == null) return;
  
      const { ctx, chartArea, scales } = chart;
      const hoverIndex = chart.$currentHoverIndex;
      const xScale = scales.x;
      const xPixel = xScale.getPixelForValue(hoverIndex);
      if (Number.isNaN(xPixel)) return;
  
      // Draw vertical line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xPixel, chartArea.top);
      ctx.lineTo(xPixel, chartArea.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.stroke();
      ctx.restore();
  
      // Draw date label
      const rawDate = chart.data.labels?.[hoverIndex];
      if (!rawDate) return;
      ctx.save();
      ctx.font = 'bold 14px Roboto, sans-serif';
      ctx.fillStyle = '#333';
      const textWidth = ctx.measureText(rawDate).width;
      const textX = xPixel - textWidth / 2;
      const textY = chartArea.top + 14;
      ctx.fillText(rawDate, textX, textY);
      ctx.restore();
    },
  };
  
  export default CrosshairLinePlugin;
  