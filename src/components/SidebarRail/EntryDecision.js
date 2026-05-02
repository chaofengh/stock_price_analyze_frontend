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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PsychologyAltRoundedIcon from '@mui/icons-material/PsychologyAltRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { useLocation } from 'react-router-dom';

import { fetchStockEntryDecision } from '../../API/StockService';
import StockChart from '../Chart/StockChart';

const toIsoLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isBlankValue = (value) => value === null || value === undefined || value === '';

const percent = (value) => {
  if (isBlankValue(value)) return '--';
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  return `${(n * 100).toFixed(1)}%`;
};

const decimal = (value, digits = 2) => {
  if (isBlankValue(value)) return '--';
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

const signalColor = (decision = {}) => {
  if (decision.status !== 'prediction') return 'warning';
  return decision.predicted_direction === 'reversal' ? 'success' : 'info';
};

const signalText = (decision = {}) => {
  if (decision.status !== 'prediction') return 'No Prediction';
  return titleCase(decision.predicted_direction);
};

const panelSx = (theme) => ({
  p: 2.5,
  borderRadius: 'var(--app-radius)',
  borderColor: alpha(theme.palette.common.white, 0.12),
  bgcolor: alpha(theme.palette.background.paper, 0.68),
  boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.34)}`,
  backdropFilter: 'blur(22px) saturate(145%)',
});

const insetSx = (theme) => ({
  border: `1px solid ${alpha(theme.palette.common.white, 0.10)}`,
  borderRadius: 'var(--app-radius)',
  bgcolor: alpha(theme.palette.common.white, 0.045),
});

const progressValue = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n * 100));
};

function MetricCard({ label, value, hint, tone = 'neutral', compact = false }) {
  return (
    <Box
      sx={(theme) => ({
        minHeight: compact ? 64 : 78,
        p: compact ? 1.25 : 1.5,
        ...insetSx(theme),
        borderColor:
          tone !== 'neutral' && theme.palette[tone]
            ? alpha(theme.palette[tone].main, 0.24)
            : alpha(theme.palette.common.white, 0.10),
      })}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant={compact ? 'subtitle1' : 'h6'}
        fontWeight={850}
        sx={(theme) => ({
          mt: 0.35,
          color: tone !== 'neutral' && theme.palette[tone] ? theme.palette[tone].main : 'text.primary',
        })}
      >
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

function DirectionCase({ label, icon, probability, precision, count, active, tone }) {
  return (
    <Box
      sx={(theme) => ({
        ...insetSx(theme),
        p: 1.5,
        minHeight: 138,
        borderColor: active ? alpha(theme.palette[tone].main, 0.48) : alpha(theme.palette.common.white, 0.10),
        bgcolor: active ? alpha(theme.palette[tone].main, 0.10) : alpha(theme.palette.common.white, 0.04),
        boxShadow: active ? `inset 0 1px 0 ${alpha(theme.palette[tone].main, 0.16)}` : 'none',
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={(theme) => ({
              width: 28,
              height: 28,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '10px',
              color: theme.palette[tone].main,
              bgcolor: alpha(theme.palette[tone].main, 0.12),
            })}
          >
            {icon}
          </Box>
          <Typography variant="subtitle2" fontWeight={800}>
            {label}
          </Typography>
        </Box>
        {active ? <Chip size="small" color={tone} label="Selected" /> : null}
      </Box>

      <Typography
        variant="h4"
        fontWeight={900}
        sx={(theme) => ({ mt: 1.25, color: active ? theme.palette[tone].main : 'text.primary' })}
      >
        {percent(probability)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Probability
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1.25 }}>
        <MetricCard label="Precision" value={percent(precision)} compact tone={active ? tone : 'neutral'} />
        <MetricCard label="Analogs" value={decimal(count, 0)} compact />
      </Box>
    </Box>
  );
}

function HorizonDecisionCard({ label, decision = {} }) {
  const isPrediction = decision.status === 'prediction';
  const featureCount = decision.model?.feature_count ?? '--';
  const candidateCount = decision.model?.candidate_count ?? 0;
  const candidateSearchCount = decision.model?.candidate_search_count ?? '--';
  const analog = decision.analog_evidence;
  const qualityGate = decision.deployment_quality_gate;
  const playbook = decision.playbook;
  const tier = playbook?.tier || playbook?.profile?.tier;
  const selectedTone = decision.predicted_direction === 'reversal' ? 'success' : 'info';
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 2,
        height: '100%',
        borderRadius: 'var(--app-radius)',
        borderColor: isPrediction
          ? alpha(theme.palette[selectedTone].main, 0.48)
          : alpha(theme.palette.common.white, 0.12),
        bgcolor: alpha(theme.palette.background.paper, 0.62),
        boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.06)}`,
      })}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isPrediction ? <TrendingDownRoundedIcon fontSize="small" /> : <TrendingFlatRoundedIcon fontSize="small" />}
          <Typography variant="subtitle1" fontWeight={700}>
            {label}
          </Typography>
        </Box>
        <Chip
          size="small"
          color={signalColor(decision)}
          label={isPrediction ? 'Prediction' : 'No Prediction'}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
        <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.05 }}>
          {signalText(decision)}
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" fontWeight={900} color={isPrediction ? `${signalColor(decision)}.main` : 'text.secondary'}>
            {decision.confidence_score ?? 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            confidence
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={1.25}>
        <Grid item xs={12} sm={6}>
          <DirectionCase
            label="Reverse"
            icon={<TrendingDownRoundedIcon fontSize="small" />}
            probability={decision.reversal_probability}
            precision={decision.reversal_validation_precision}
            count={decision.reversal_validation_count}
            active={decision.predicted_direction === 'reversal'}
            tone="success"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DirectionCase
            label="Continue"
            icon={<TrendingUpRoundedIcon fontSize="small" />}
            probability={decision.continuation_probability}
            precision={decision.continuation_validation_precision}
            count={decision.continuation_validation_count}
            active={decision.predicted_direction === 'continuation'}
            tone="info"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
        <Chip size="small" variant="outlined" label={`Training: ${decision.model?.training_sample_count ?? 0} prior outcomes`} />
        <Chip size="small" variant="outlined" label={`Inputs: ${featureCount} features, ${candidateCount}/${candidateSearchCount} candidates`} />
        {playbook?.name ? (
          <Chip
            size="small"
            variant="outlined"
            label={`Signal: ${playbook.name} (${decimal(playbook.precision, 2)} precision / ${playbook.match_count} prior)`}
          />
        ) : null}
        {tier ? <Chip size="small" variant="outlined" label={`Tier: ${titleCase(tier)}`} /> : null}
        {qualityGate?.status ? (
          <Chip size="small" variant="outlined" label={`Deployment Gate: ${titleCase(qualityGate.status)}`} />
        ) : null}
        {analog?.status === 'ready' ? (
          <Chip
            size="small"
            variant="outlined"
            label={`Analog: ${percent(analog.posterior_probability)} over ${analog.neighbor_count} similar setups`}
          />
        ) : null}
        {decision.reversal_veto_reason ? (
          <Chip size="small" color="warning" variant="outlined" label={`Veto: ${titleCase(decision.reversal_veto_reason)}`} />
        ) : null}
        {decision.no_prediction_reason ? (
          <Chip size="small" color="warning" variant="outlined" label={`Reason: ${titleCase(decision.no_prediction_reason)}`} />
        ) : null}
      </Box>
    </Paper>
  );
}

function DirectionPerformanceGroup({
  title,
  icon,
  tone,
  accuracy,
  rawAccuracy,
  callCount,
  correctCount,
  gate,
  missedReversalCount,
  predictionCount,
}) {
  const share =
    Number(predictionCount) > 0 && Number(callCount) >= 0
      ? Number(callCount) / Number(predictionCount)
      : null;
  return (
    <Box
      sx={(theme) => ({
        ...insetSx(theme),
        p: 2,
        height: '100%',
        borderColor: alpha(theme.palette[tone].main, 0.24),
        background: `linear-gradient(180deg, ${alpha(theme.palette[tone].main, 0.10)}, ${alpha(
          theme.palette.common.white,
          0.035
        )})`,
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={(theme) => ({
              width: 36,
              height: 36,
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              color: theme.palette[tone].main,
              bgcolor: alpha(theme.palette[tone].main, 0.13),
              border: `1px solid ${alpha(theme.palette[tone].main, 0.2)}`,
            })}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={850}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {title.split(' ')[0]} signal quality
            </Typography>
          </Box>
        </Box>
        <Chip size="small" color={gate?.status === 'passed' ? tone : 'default'} label={`${title.split(' ')[0]} Gate ${titleCase(gate?.status)}`} />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography
              variant="h3"
              fontWeight={950}
              sx={(theme) => ({ color: theme.palette[tone].main, lineHeight: 1 })}
            >
              {percent(accuracy)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title.split(' ')[0]} Accuracy
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Raw {percent(rawAccuracy)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressValue(accuracy)}
          sx={(theme) => ({
            mt: 1.25,
            height: 8,
            borderRadius: '999px',
            bgcolor: alpha(theme.palette.common.white, 0.08),
            '& .MuiLinearProgress-bar': {
              borderRadius: '999px',
              bgcolor: theme.palette[tone].main,
            },
          })}
        />
      </Box>

      <Grid container spacing={1.25} sx={{ mt: 0.75 }}>
        <Grid item xs={4}>
          <MetricCard label="Calls" value={String(callCount ?? 0)} compact tone={tone} />
        </Grid>
        <Grid item xs={4}>
          <MetricCard label="Correct" value={String(correctCount ?? 0)} compact />
        </Grid>
        <Grid item xs={4}>
          <MetricCard label="Share" value={share === null ? '--' : percent(share)} compact />
        </Grid>
        {missedReversalCount !== undefined ? (
          <Grid item xs={12}>
            <MetricCard label="Missed Reversals" value={String(missedReversalCount ?? 0)} compact />
          </Grid>
        ) : null}
      </Grid>
    </Box>
  );
}

function PerformancePanel({ horizon, backtest = {} }) {
  const tierCounts = backtest.signal_tier_counts || {};
  const qualityGate = backtest.quality_gate || {};
  const directionGate = backtest.direction_quality_gate || {};
  const rawPredictionCount = Number(backtest.raw_prediction_count);
  const deployedPredictionCount = Number(backtest.prediction_count);
  const quarantinedCount =
    Number.isFinite(rawPredictionCount) && Number.isFinite(deployedPredictionCount)
      ? Math.max(0, rawPredictionCount - deployedPredictionCount)
      : 0;
  const coverageValue = Math.max(0, Math.min(100, (Number(backtest.coverage) || 0) * 100));
  return (
    <Paper variant="outlined" sx={panelSx}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={(theme) => ({
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '14px',
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.13),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
            })}
          >
            <ShieldRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={900}>
              1Y {horizon.toUpperCase()} Accuracy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {backtest.period_start || '--'} to {backtest.period_end || '--'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Chip size="small" label={`Gate ${titleCase(qualityGate.status || directionGate.status)}`} />
          <Chip size="small" variant="outlined" label={`Target ${percent(backtest.coverage_target)}`} />
          <Chip size="small" variant="outlined" label={`Quarantined ${quarantinedCount}`} />
          <Chip size="small" variant="outlined" label={`Expanded ${backtest.coverage_expansion_signal_count ?? 0}`} />
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '260px 1fr' }, gap: 2, mt: 2 }}>
        <Box
          sx={(theme) => ({
            ...insetSx(theme),
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 230,
          })}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Coverage
            </Typography>
            <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 1.05 }}>
              {percent(backtest.coverage)}
            </Typography>
          </Box>
          <Box
            sx={(theme) => ({
              width: 136,
              height: 136,
              mx: 'auto',
              my: 1.5,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: `conic-gradient(${theme.palette.primary.main} ${coverageValue}%, ${alpha(
                theme.palette.common.white,
                0.08
              )} 0)`,
              boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.white, 0.08)}`,
            })}
          >
            <Box
              sx={(theme) => ({
                width: 106,
                height: 106,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(theme.palette.background.paper, 0.94),
              })}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={900}>
                  {percent(backtest.accuracy)}
                </Typography>
                <Typography variant="caption">accuracy</Typography>
              </Box>
            </Box>
          </Box>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <MetricCard label="Predictions" value={String(backtest.prediction_count ?? 0)} compact />
            </Grid>
            <Grid item xs={6}>
              <MetricCard label="Eligible" value={String(backtest.eligible_touch_count ?? 0)} compact />
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6}>
              <DirectionPerformanceGroup
                title="Reverse Signals"
                icon={<TrendingDownRoundedIcon fontSize="small" />}
                tone="success"
                accuracy={backtest.reversal_accuracy}
                rawAccuracy={backtest.raw_reverse_accuracy}
                callCount={backtest.reversal_call_count}
                correctCount={backtest.reversal_correct_count}
                gate={directionGate.reversal}
                missedReversalCount={backtest.missed_reversal_count}
                predictionCount={backtest.prediction_count}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DirectionPerformanceGroup
                title="Continue Signals"
                icon={<TrendingUpRoundedIcon fontSize="small" />}
                tone="info"
                accuracy={backtest.continuation_accuracy}
                rawAccuracy={backtest.raw_continue_accuracy}
                callCount={backtest.continuation_call_count}
                correctCount={backtest.continuation_correct_count}
                gate={directionGate.continuation}
                predictionCount={backtest.prediction_count}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
            <Chip size="small" variant="outlined" label="Model: Signal-Gated Regime" />
            <Chip size="small" variant="outlined" label={`Raw Predictions ${Number.isFinite(rawPredictionCount) ? rawPredictionCount : '--'}`} />
            <Chip size="small" variant="outlined" label={`Raw Accuracy ${percent(backtest.raw_accuracy)}`} />
            <Chip size="small" variant="outlined" label={`No Predictions ${backtest.no_prediction_count ?? 0}`} />
            <Chip size="small" variant="outlined" label={`Core ${tierCounts.core ?? 0}`} />
            <Chip size="small" variant="outlined" label={`Expansion ${tierCounts.expansion ?? 0}`} />
            <Chip size="small" variant="outlined" label={`Opportunity ${tierCounts.opportunity ?? 0}`} />
            <Chip size="small" variant="outlined" label={`Regime ${tierCounts.regime ?? 0}`} />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

function ContributionsTable({ title, contributions = [] }) {
  return (
    <Paper variant="outlined" sx={panelSx}>
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
                    No contributions for this horizon.
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
    <Paper variant="outlined" sx={panelSx}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        Recent Scored Predictions
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Signal Date</TableCell>
              <TableCell>Outcome Date</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Predicted</TableCell>
              <TableCell>Actual</TableCell>
              <TableCell>Signal</TableCell>
              <TableCell align="right">Confidence</TableCell>
              <TableCell align="right">Correct</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {predictions.length > 0 ? (
              predictions.map((item, index) => (
                <TableRow key={`prediction-${item.signal_date || index}-${index}`}>
                  <TableCell>{item.signal_date || '--'}</TableCell>
                  <TableCell>{item.outcome_date || '--'}</TableCell>
                  <TableCell>{item.touched_side || '--'}</TableCell>
                  <TableCell>{titleCase(item.predicted_direction)}</TableCell>
                  <TableCell>{titleCase(item.actual_direction)}</TableCell>
                  <TableCell>{item.signal_model || '--'}</TableCell>
                  <TableCell align="right">{item.confidence_score ?? '--'}</TableCell>
                  <TableCell align="right">{item.is_correct ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No scored predictions for this horizon.
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
  const [activeHorizon, setActiveHorizon] = useState('5d');
  const [chartRange, setChartRange] = useState('1Y');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let requestTimer = null;

    if (!symbol) {
      setPayload(null);
      setError('');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    requestTimer = window.setTimeout(() => {
      if (!active) return;
      setLoading(true);
      setError('');

      fetchStockEntryDecision(symbol, selectedDate, { signal: controller.signal })
        .then((data) => {
          if (!active) return;
          setPayload(data);
        })
        .catch((err) => {
          if (!active) return;
          if (err?.name === 'AbortError') return;
          setPayload(null);
          setError(err?.message || 'Failed to fetch entry decision.');
        })
        .finally(() => {
          if (!active) return;
          setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      if (requestTimer) {
        window.clearTimeout(requestTimer);
      }
      controller.abort();
    };
  }, [symbol, selectedDate]);

  const horizons = payload?.horizons || {};
  const activeDecision = horizons[activeHorizon] || {};
  const activeBacktest = payload?.backtest_1y?.[activeHorizon] || {};
  const activePredictions = activeBacktest.predictions || [];
  const recentPredictions = activeBacktest.recent_predictions || [];

  const chartSummary = useMemo(
    () => ({
      symbol: payload?.symbol,
      chart_data: payload?.chart_data || [],
    }),
    [payload]
  );

  const predictionMarkers = useMemo(() => {
    const markers = [...activePredictions];
    const hasCurrentMarker = markers.some((marker) => marker.signal_date === payload?.as_of_date);
    if (activeDecision.status === 'prediction' && payload?.as_of_date && !hasCurrentMarker) {
      markers.push({
        signal_date: payload.as_of_date,
        predicted_direction: activeDecision.predicted_direction,
        is_correct: null,
      });
    }
    return markers;
  }, [activeDecision, activePredictions, payload?.as_of_date]);

  const handleHorizonChange = (_, value) => {
    if (!value) return;
    setActiveHorizon(value);
  };

  return (
    <Box
      sx={(theme) => ({
        maxWidth: 1360,
        mx: 'auto',
        px: { xs: 0, md: 1 },
        color: theme.palette.text.primary,
      })}
    >
      <Paper
        variant="outlined"
        sx={(theme) => ({
          ...panelSx(theme),
          mb: 2.5,
          overflow: 'hidden',
        })}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2.5, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 260, flex: '1 1 420px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={(theme) => ({
                  width: 38,
                  height: 38,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 'var(--app-radius)',
                  bgcolor: alpha(theme.palette.primary.main, 0.14),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
                })}
              >
                <PsychologyAltRoundedIcon fontSize="small" />
              </Box>
              <Typography variant="h4" fontWeight={900}>
                Entry Decision
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.25 }}>
              <Chip size="small" label={symbol ? `Active Symbol: ${symbol}` : 'No Active Symbol'} />
              {payload?.as_of_date ? <Chip size="small" variant="outlined" label={`Resolved: ${payload.as_of_date}`} /> : null}
              {payload?.setup_type ? <Chip size="small" variant="outlined" label={`Setup: ${titleCase(payload.setup_type)}`} /> : null}
            </Box>
          </Box>

          {symbol ? (
            <Box
              sx={(theme) => ({
                ...insetSx(theme),
                p: 1.25,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1.5,
                flexWrap: 'wrap',
              })}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                  <CalendarMonthRoundedIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: '-0.15em' }} />
                  Decision Date
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value || maxSelectableDate)}
                  inputProps={{ min: minSelectableDate, max: maxSelectableDate }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                  <TimelineRoundedIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: '-0.15em' }} />
                  Horizon
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={activeHorizon}
                  onChange={handleHorizonChange}
                >
                  <ToggleButton value="5d">5D</ToggleButton>
                  <ToggleButton value="10d">10D</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          ) : null}
        </Box>
      </Paper>

      {!symbol ? (
        <Alert severity="info">This page is active-symbol only. Open a ticker and return here.</Alert>
      ) : null}

      {loading ? (
        <Paper variant="outlined" sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      ) : null}

      {!loading && error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && payload ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Chip icon={<AutoGraphRoundedIcon />} label={`Setup: ${titleCase(payload.setup_type)}`} variant="outlined" />
            <Chip label={`Touched Side: ${payload.touched_side || 'None'}`} variant="outlined" />
            <Chip label={`Resolved: ${payload.as_of_date || '--'}`} variant="outlined" />
            <Chip label={`Base Threshold: ${percent(payload.prediction_threshold)}`} variant="outlined" />
            <Chip label={`Reverse Edge: ${percent(payload.deployment_thresholds?.reversal)}`} variant="outlined" />
            <Chip label={`Continue Edge: ${percent(payload.deployment_thresholds?.continuation)}`} variant="outlined" />
            <Chip
              icon={<CheckCircleRoundedIcon />}
              label={`Context: QQQ ${payload.context_status?.qqq ? 'OK' : 'Missing'}, XLK ${
                payload.context_status?.xlk ? 'OK' : 'Missing'
              }`}
              variant="outlined"
            />
            {payload.date_was_snapped ? (
              <Chip label="Snapped To Previous Trading Day" color="warning" variant="outlined" />
            ) : null}
          </Box>

          <Grid container spacing={2.5} alignItems="stretch">
            <Grid item xs={12} lg={5}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <HorizonDecisionCard label="5-Day Direction" decision={horizons['5d']} />
                </Grid>
                <Grid item xs={12}>
                  <HorizonDecisionCard label="10-Day Direction" decision={horizons['10d']} />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ px: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{activeHorizon.toUpperCase()} Confidence</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {activeDecision.confidence_score ?? 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Number(activeDecision.confidence_score) || 0}
                      sx={{ height: 10, borderRadius: 'var(--app-radius)' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} lg={7}>
              {payload.chart_data?.length ? (
                <Paper variant="outlined" sx={(theme) => ({ ...panelSx(theme), height: '100%' })}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                      Bollinger Prediction Chart
                    </Typography>
                    <Chip size="small" color={signalColor(activeDecision)} label={signalText(activeDecision)} />
                  </Box>
                  <StockChart
                    summary={chartSummary}
                    eventMap={{}}
                    range={chartRange}
                    onRangeChange={setChartRange}
                    predictionMarkers={predictionMarkers}
                  />
                </Paper>
              ) : null}
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={panelSx}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Top Reasons
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Horizon</TableCell>
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
                        <TableCell>{String(reason.horizon || '--').toUpperCase()}</TableCell>
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

          <ContributionsTable
            title={`${activeHorizon.toUpperCase()} Contributions`}
            contributions={activeDecision.contributions}
          />

          <Divider />

          <PerformancePanel horizon={activeHorizon} backtest={activeBacktest} />

          <PredictionHistoryTable predictions={recentPredictions} />
        </Box>
      ) : null}
    </Box>
  );
}
