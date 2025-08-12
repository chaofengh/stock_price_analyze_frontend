import { useMemo } from 'react';

export function useChartData(summary, eventTypeMappingTouch, ) {
  return useMemo(() => {
    if (!summary || !summary.chart_data) {
      return { labels: [], datasets: [] };
    }

    // labels = the dates, in order
    const labels = summary.chart_data.map(pt => pt.date);

    // data = the closing prices
    const closingValues = summary.chart_data.map(pt => pt.close);

    // Determine point color & radius based on a touch
    const closingPointColors = summary.chart_data.map(pt => {
      const key = pt.date;
      if (pt.isTouch) {
        if (eventTypeMappingTouch[key] === 'lower') return '#00C853'; // green
        if (eventTypeMappingTouch[key] === 'upper') return '#D50000'; // red
        return '#FF9800';
      }
      return '#1a1a1a'; // default color (dark gray/black)
    });

    const closingPointRadii = summary.chart_data.map(pt =>
      pt.isTouch ? 6 : 4
    );

    return {
      labels,
      datasets: [
        {
          label: 'Price',
          data: closingValues,
          tension: 0.3,
          borderWidth: 2,
          borderColor: '#1a1a1a',
          fill: false,
          // We can supply an array or a function for point styling
          pointBackgroundColor: closingPointColors,
          pointRadius: closingPointRadii,
          order: 3,
        },
      ],
    };
  }, [summary, eventTypeMappingTouch]);
}
