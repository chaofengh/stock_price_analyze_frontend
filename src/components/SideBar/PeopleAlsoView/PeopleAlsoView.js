// Main list: imports smaller pieces
import React from 'react';
import { Paper, Typography, Divider } from '@mui/material';
import { useDispatch } from 'react-redux';
import { fetchSummary } from '../../Redux/summarySlice'; // adjust path
import PeerRow from './PeerRow';

const PeopleAlsoView = ({ summary }) => {
  const dispatch = useDispatch();
  const { peer_info: peersObj = {} } = summary ?? {};

  const handlePeerClick = (symbol) => dispatch(fetchSummary(symbol));

  const rows = Object.entries(peersObj).map(([peer, info]) => ({
    peerSymbol: peer,
    latest: info.latest_price,
    pct: info.percentage_change,
    series: (info.intraday_close_5m || []).map((p) => p.close),
  }));

  rows.sort((a, b) => Math.abs(b.pct ?? 0) - Math.abs(a.pct ?? 0));

  if (!rows.length) return null;

  return (
    <Paper sx={{ mt: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        People also view
      </Typography>
      <Divider sx={{ mb: 1 }} />

      {rows.map((r) => (
        <PeerRow key={r.peerSymbol} {...r} onClick={handlePeerClick} />
      ))}
    </Paper>
  );
};

export default PeopleAlsoView;
