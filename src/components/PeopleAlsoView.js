import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useDispatch } from 'react-redux';
import { fetchSummary } from './Redux/summarySlice'; // Adjust path as needed

function PeopleAlsoView({ summary }) {
  const dispatch = useDispatch();

  if (!summary) return null;

  const { symbol, peer_latest_data } = summary;
  if (!peer_latest_data || Object.keys(peer_latest_data).length === 0) {
    return null;
  }

  const handlePeerClick = (peerSymbol) => {
    dispatch(fetchSummary(peerSymbol));
  };

  return (
    <Box sx={{ mt: 2}}>
      {/* Section Header */}
      <Typography variant="h6" gutterBottom textAlign="center" sx={{ mb: 2 }}>
        People also view
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3 }}
        textAlign="center"
      >
        Based on the portfolios of people who view <strong>{symbol}</strong>.
        This list is generated from sample data and isn’t a recommendation.
      </Typography>

      {/* Horizontal scroll container */}
      <Box
        sx={{
          display: 'flex',
          overflowX: 'auto',
          gap: 2,
          pb: 8, // This pushes the scrollbar farther from the cards
          scrollbarWidth: 'auto', // For Firefox
          '::-webkit-scrollbar': {
            height: '8px', // Adjust scrollbar thickness (Chrome/Safari)
          },
          '::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
          },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
          },
          '::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#555',
          },
        }}
      >
        {Object.entries(peer_latest_data).map(([peerSymbol, data]) => {
          if (!data) return null;

          const { latest_price, percentage_change } = data;
          const price = latest_price != null ? latest_price.toFixed(2) : '--';
          const pctChange =
            percentage_change != null ? percentage_change.toFixed(2) : '--';

          const isPositive = percentage_change > 0;
          const isNegative = percentage_change < 0;
          const changeColor = isPositive
            ? '#4caf50' // green
            : isNegative
            ? '#f44336' // red
            : 'inherit';

          return (
            <Card
              key={peerSymbol}
              variant="outlined"
              sx={{
                minWidth: 120,
                textAlign: 'center',
                flex: '0 0 auto',
              }}
            >
              <CardContent sx={{ p: 1 }}>
                {/* Peer Symbol (clickable) */}
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handlePeerClick(peerSymbol)}
                >
                  {peerSymbol}
                </Typography>

                {/* Price */}
                <Typography
                  variant="h6"
                  sx={{ mt: 0.5, mb: 1, fontWeight: 700, color: changeColor }}
                >
                  ${price}
                </Typography>

                {/* Percentage Change with Arrow Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: changeColor,
                  }}
                >
                  {isPositive && (
                    <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.3 }} />
                  )}
                  {isNegative && (
                    <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.3 }} />
                  )}
                  <Typography variant="body2">{pctChange}%</Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

export default PeopleAlsoView;
