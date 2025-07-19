const useChartOptions = ({
    externalTooltipHandler,
    handleHover,
    handleZoomComplete,
    summary,
    tooltipMappingHug,
    tooltipMappingTouch,
  }) => {
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 20, right: 10, left: 10 } },
      scales: {
        x: {
          type: 'category',
          grid: { display: false },
          ticks: {
            color: '#666',
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            color: '#666',
            callback: (value) => `$${value}`,
          },
        },
      },
      interaction: {
        // Available modes include: 'point', 'nearest', 'index', 'dataset', 'x', 'y'
        mode: 'point', // changed from 'point'
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: { boxWidth: 12 },
        },
        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
          callbacks: {
            label: (context) => {
              const dataIndex = context.dataIndex;
              const chartPoint = summary.chart_data[dataIndex];
              const pointDate = chartPoint?.date;
              if (chartPoint.isHug && tooltipMappingHug[pointDate]) {
                return tooltipMappingHug[pointDate];
              }
              if (chartPoint.isTouch && tooltipMappingTouch[pointDate]) {
                return tooltipMappingTouch[pointDate];
              }
              return `Close: ${context.parsed.y?.toFixed(2)}`;
            },
          },
        },
        zoom: {
          zoom: {
            drag: {
              enabled: true,
              backgroundColor: 'rgba(0,0,0,0.15)',
            },
            mode: 'x',
            onZoomComplete: handleZoomComplete,
          },
          pan: {
            enabled: true,
            mode: 'x',
          },
        },
        annotation: {
          annotations: {},
        },
      },
      events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
      onHover: handleHover,
    };
  
    return chartOptions;
  };
  
  export default useChartOptions;
