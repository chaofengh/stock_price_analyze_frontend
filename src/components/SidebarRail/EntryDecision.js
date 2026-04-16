import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';

import { fetchStockEntryDecision } from '../../API/StockService';

const toIsoLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const percent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  return `${(n * 100).toFixed(1)}%`;
};

const signedPercent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
};

const decimal = (value, digits = 2) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  return n.toFixed(digits);
};

const titleCase = (text) =>
  typeof text === 'string' && text
    ? text
        .split('_')
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ')
    : '--';

function MetricCard({ label, value, hint }) {
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 2,
        borderColor: alpha(theme.palette.divider, 0.65),
        bgcolor: alpha(theme.palette.background.paper, 0.75),
      })}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

function ContributionsTable({ title, contributions = [] }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Feature</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell>Impact</TableCell>
              <TableCell align="right">Contribution</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contributions.length > 0 ? (
              contributions.map((item, index) => (
                <TableRow key={`${title}-${item.feature || 'feature'}-${index}`}>
                  <TableCell>{titleCase(item.feature)}</TableCell>
                  <TableCell align="right">{String(item.value ?? '--')}</TableCell>
                  <TableCell>{titleCase(item.impact)}</TableCell>
                  <TableCell align="right">{decimal(item.contribution, 3)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No contributions for this stage.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function PredictionHistoryTable({ predictions = [] }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        Recent Predictions
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Signal Date</TableCell>
              <TableCell>Next Date</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Predicted</TableCell>
              <TableCell>Actual</TableCell>
              <TableCell align="right">Next Day Change</TableCell>
              <TableCell align="right">Correct</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {predictions.length > 0 ? (
              predictions.map((item, index) => (
                <TableRow key={`prediction-${item.signal_date || index}-${index}`}>
                  <TableCell>{item.signal_date || '--'}</TableCell>
                  <TableCell>{item.next_date || '--'}</TableCell>
                  <TableCell>{item.touched_side || '--'}</TableCell>
                  <TableCell>{titleCase(item.predicted_class)}</TableCell>
                  <TableCell>{titleCase(item.actual_next_day_direction)}</TableCell>
                  <TableCell align="right">{signedPercent(item.next_day_change_pct)}</TableCell>
                  <TableCell align="right">{item.is_correct ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No recent predictions.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function EntryDecision() {
  const location = useLocation();
  const maxSelectableDate = useMemo(() => toIsoLocalDate(new Date()), []);
  const minSelectableDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return toIsoLocalDate(d);
  }, []);

  const symbol = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('symbol')?.trim().toUpperCase() || '';
  }, [location.search]);

  const [selectedDate, setSelectedDate] = useState(maxSelectableDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let active = true;

    if (!symbol) {
      setPayload(null);
      setError('');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError('');

    fetchStockEntryDecision(symbol, selectedDate)
      .then((data) => {
        if (!active) return;
        setPayload(data);
      })
      .catch((err) => {
        if (!active) return;
        setPayload(null);
        setError(err?.message || 'Failed to fetch entry decision.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [symbol, selectedDate]);

  const stageA = payload?.stage_a || {};
  const stageB = payload?.stage_b || {};
  const backtest = payload?.backtest_1y || {};

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        Two-Stage Entry Decision
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {symbol ? `Active Symbol: ${symbol}` : 'Select a symbol from Dashboard first.'}
      </Typography>

      {!symbol ? (
        <Alert severity="info">This page is active-symbol only. Open a ticker and return here.</Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Run Decision Date
          </Typography>
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value || maxSelectableDate)}
            inputProps={{ min: minSelectableDate, max: maxSelectableDate }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Range: {minSelectableDate} to {maxSelectableDate}. Non-trading dates auto-snap to the previous trading day.
          </Typography>
        </Paper>
      )}

      {loading ? (
        <Paper variant="outlined" sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      ) : null}

      {!loading && error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && payload ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
              <Chip
                label={payload.enter_today ? 'Enter Today: YES' : 'Enter Today: NO'}
                color={payload.enter_today ? 'success' : 'error'}
              />
              <Chip label={`Setup: ${titleCase(payload.setup_type)}`} variant="outlined" />
              <Chip label={`Touched Side: ${payload.touched_side || 'None'}`} variant="outlined" />
              <Chip label={`Requested: ${payload.requested_as_of_date || '--'}`} variant="outlined" />
              <Chip label={`Resolved: ${payload.as_of_date || '--'}`} variant="outlined" />
              {payload.date_was_snapped ? (
                <Chip label="Snapped To Previous Trading Day" color="warning" variant="outlined" />
              ) : null}
            </Box>

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  label="Reversion Probability"
                  value={percent(payload.reversion_probability)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  label="Continuation Probability"
                  value={percent(payload.continuation_probability)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  label="Expected Return"
                  value={`${decimal(payload.expected_return_to_target_atr, 2)} ATR`}
                  hint="to middle band target"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  label="Expected Adverse Move"
                  value={`${decimal(payload.expected_adverse_move_atr, 2)} ATR`}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Confidence Score</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {payload.confidence_score ?? 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Number(payload.confidence_score) || 0}
                sx={{ height: 10, borderRadius: 'var(--app-radius)' }}
              />
            </Box>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Stage A - Regime Filter
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Favorable: {stageA.is_favorable ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2">
                  Probability: {percent(stageA.probability)} (Threshold {decimal(stageA.threshold, 2)})
                </Typography>
                <Typography variant="body2">
                  Earnings Block: {stageA.event_risk_blocked ? 'Yes' : 'No'}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Stage B - Entry Quality
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Entry Probability: {percent(stageB.entry_probability)}
                </Typography>
                <Typography variant="body2">
                  Decision Threshold: {decimal(stageB.threshold, 2)}
                </Typography>
                <Typography variant="body2">Decision: {payload.enter_today ? 'Good Entry Day' : 'Bad Entry Day'}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Top Reasons
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Stage</TableCell>
                    <TableCell>Feature</TableCell>
                    <TableCell>Impact</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">Contribution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(payload.top_reasons || []).length > 0 ? (
                    payload.top_reasons.map((reason, index) => (
                      <TableRow key={`reason-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{titleCase(reason.stage)}</TableCell>
                        <TableCell>{titleCase(reason.feature)}</TableCell>
                        <TableCell>{titleCase(reason.impact)}</TableCell>
                        <TableCell align="right">{String(reason.value ?? '--')}</TableCell>
                        <TableCell align="right">{decimal(reason.contribution, 3)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No ranked reasons for this symbol/date.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ContributionsTable title="Stage A Contributions" contributions={stageA.contributions} />
            </Grid>
            <Grid item xs={12} md={6}>
              <ContributionsTable title="Stage B Contributions" contributions={stageB.contributions} />
            </Grid>
          </Grid>

          <Divider />

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
              1Y Prediction Accuracy
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Sample Count" value={String(backtest.sample_count ?? 0)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Correct Count" value={String(backtest.correct_count ?? 0)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Accuracy" value={percent(backtest.accuracy)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Reverse Precision" value={percent(backtest.reverse_precision)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Continue Precision" value={percent(backtest.continue_precision)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Reverse Calls" value={String(backtest.reverse_call_count ?? 0)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Continue Calls" value={String(backtest.continue_call_count ?? 0)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard label="Flat Next Day" value={String(backtest.flat_count ?? 0)} />
              </Grid>
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Period: {backtest.period_start || '--'} to {backtest.period_end || '--'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Reverse confusion counts: TP {backtest.tp_reverse ?? 0} / FP {backtest.fp_reverse ?? 0} / TN {backtest.tn_reverse ?? 0} / FN {backtest.fn_reverse ?? 0}
            </Typography>
          </Paper>

          <PredictionHistoryTable predictions={backtest.recent_predictions || []} />
        </Box>
      ) : null}
    </Box>
  );
}
