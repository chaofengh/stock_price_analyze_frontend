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
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { useLocation } from 'react-router-dom';

import { fetchStockEntryDecision } from '../../API/StockService';
import StockChart from '../Chart/StockChart';

const MAX_ENTRY_DECISION_WAIT_MS = 5 * 60 * 1000;

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

const currency = (value) => {
  if (isBlankValue(value)) return '--';
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  return `$${n.toFixed(2)}`;
};

const signedPercent = (value) => {
  if (isBlankValue(value)) return '--';
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  const sign = n > 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(1)}%`;
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

const retryDelaySeconds = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 2;
  return Math.max(1, Math.min(30, Math.ceil(n)));
};

const freshnessTone = (status) => {
  if (status === 'fresh') return 'success';
  if (status === 'stale') return 'warning';
  if (status === 'expired') return 'error';
  return 'default';
};

const freshnessLabel = (freshness = {}) => {
  const status = freshness.status || 'unknown';
  if (status === 'stale' && Number(freshness.stale_sessions) > 0) {
    const sessions = Number(freshness.stale_sessions);
    return `Model Stale ${sessions} Session${sessions === 1 ? '' : 's'}`;
  }
  return `Model ${titleCase(status)}`;
};

const formatDate = (value) => {
  if (!value) return '';
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '';
  const text = String(value);
  const chicagoTimestamp = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (chicagoTimestamp) {
    const [, year, month, day, hourText, minuteText] = chicagoTimestamp;
    const dateLabel = formatDate(`${year}-${month}-${day}`);
    if (!hourText || !minuteText) return dateLabel;
    const hour24 = Number(hourText);
    const hour12 = hour24 % 12 || 12;
    const meridiem = hour24 >= 12 ? 'PM' : 'AM';
    return `${dateLabel}, ${hour12}:${minuteText} ${meridiem}`;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const modelFreshnessLine = (contextMeta = {}, freshness = {}) => {
  const trainedThrough = contextMeta.trained_through_date || contextMeta.price_data_end_date || freshness.price_data_end_date;
  const refreshedAt = contextMeta.created_at;
  const pieces = [];
  if (trainedThrough) pieces.push(`Model trained through ${formatDate(trainedThrough)} close`);
  if (refreshedAt) pieces.push(`refreshed ${formatDateTime(refreshedAt)} CT`);
  if (!pieces.length && freshness.status) pieces.push(freshnessLabel(freshness));
  return pieces.join(' • ');
};

const eventRiskMessage = (payload = {}, activeHorizon = '') => {
  const horizonDecision = activeHorizon ? payload.horizons?.[activeHorizon] || {} : {};
  const risk = horizonDecision.event_risk || payload.event_risk || {};
  const horizonBlocked =
    horizonDecision.no_prediction_reason === 'event_risk' ||
    (horizonDecision.status === 'no_prediction' && risk.blocked);
  if (!horizonBlocked && !risk.blocked) return '';
  const eventDate = risk.event_date || risk.earnings_date;
  if (!eventDate) return `No prediction: ${titleCase(risk.reason || 'event_risk')}.`;
  const horizon = activeHorizon ? activeHorizon.toUpperCase() : 'prediction';
  return `No prediction: earnings on ${formatDate(eventDate)} inside the ${horizon} window.`;
};

const openPredictionTone = (prediction = {}) => {
  if (prediction.interim_status === 'working') return 'success';
  if (prediction.interim_status === 'against') return 'error';
  if (prediction.interim_status === 'flat') return 'warning';
  return 'default';
};

const openPredictionStatusLabel = (prediction = {}) => {
  if (prediction.interim_status === 'working') return 'Working';
  if (prediction.interim_status === 'against') return 'Against thesis';
  if (prediction.interim_status === 'flat') return 'Flat';
  return 'Open';
};

const HORIZON_ORDER = ['5d', '10d'];

const predictionDate = (prediction = {}) => {
  const date = prediction.signal_date || prediction.date;
  return date ? String(date).slice(0, 10) : '';
};

const predictionMarkerKey = (prediction = {}, horizon = '') => `${horizon}|${predictionDate(prediction)}`;

const normalizePredictionMarker = (prediction = {}, horizon, activeHorizon, markerStatus) => ({
  ...prediction,
  horizon,
  marker_status:
    markerStatus ||
    prediction.marker_status ||
    prediction.status ||
    (prediction.is_correct == null ? 'open' : 'scored'),
  is_open:
    prediction.is_open === true ||
    prediction.status === 'open' ||
    prediction.marker_status === 'open' ||
    prediction.is_correct == null,
  is_active_horizon: horizon === activeHorizon,
});

const selectedDirectionStats = (decision = {}) => {
  if (decision.predicted_direction === 'reversal') {
    return {
      probability: decision.reversal_probability,
      precision: decision.reversal_validation_precision,
      count: decision.reversal_validation_count,
    };
  }
  if (decision.predicted_direction === 'continuation') {
    return {
      probability: decision.continuation_probability,
      precision: decision.continuation_validation_precision,
      count: decision.continuation_validation_count,
    };
  }
  return { probability: null, precision: null, count: 0 };
};

const keyReasonsForDecision = (decision = {}) => {
  const reasons = Array.isArray(decision.key_reasons) && decision.key_reasons.length
    ? decision.key_reasons
    : decision.contributions || [];
  return reasons.slice(0, 4);
};

const similarCasesForDecision = (decision = {}) => {
  if (Array.isArray(decision.similar_past_cases) && decision.similar_past_cases.length) {
    return decision.similar_past_cases;
  }
  if (Array.isArray(decision.playbook?.neighbors)) {
    return decision.playbook.neighbors;
  }
  return [];
};

const reasonTone = (reason = {}, decision = {}) => {
  const impact = reason.impact || reason.predicted_direction;
  if (impact === decision.predicted_direction && decision.status === 'prediction') {
    return signalColor(decision);
  }
  if (impact === 'reversal') return 'success';
  if (impact === 'continuation') return 'info';
  return 'default';
};

const reasonImpactLabel = (reason = {}, decision = {}) => {
  const impact = reason.impact || reason.predicted_direction;
  if (!impact) return 'Model input';
  const prefix = impact === decision.predicted_direction && decision.status === 'prediction' ? 'Supports' : 'Points to';
  return `${prefix} ${titleCase(impact)}`;
};

const formatSimilarity = (value) => {
  if (isBlankValue(value)) return '--';
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  if (n >= 0 && n <= 1) return percent(n);
  return decimal(n, 2);
};

const caseResultTone = (item = {}) => {
  if (item.is_correct === true) return 'success';
  if (item.is_correct === false) return 'error';
  return 'default';
};

const caseResultLabel = (item = {}) => {
  if (item.is_correct === true) return 'Worked';
  if (item.is_correct === false) return 'Failed';
  return titleCase(item.actual_direction);
};

const activeDirectionAccuracy = (decision = {}, backtest = {}) => {
  if (decision.predicted_direction === 'reversal') return backtest.reversal_accuracy;
  if (decision.predicted_direction === 'continuation') return backtest.continuation_accuracy;
  return backtest.accuracy;
};

const tradePosture = (payload = {}, decision = {}) => {
  const side = payload.touched_side;
  const direction = decision.predicted_direction;
  if (decision.status !== 'prediction') {
    return {
      title: 'Stand Aside',
      optionBias: 'No Directional Bias',
      subtitle: 'Model gates did not clear a trade-quality signal.',
      tone: 'warning',
      icon: <TrendingFlatRoundedIcon fontSize="small" />,
    };
  }

  const bullish =
    (side === 'Lower' && direction === 'reversal') ||
    (side === 'Upper' && direction === 'continuation');
  const bearish =
    (side === 'Upper' && direction === 'reversal') ||
    (side === 'Lower' && direction === 'continuation');
  if (bullish) {
    return {
      title: direction === 'reversal' ? 'Bullish Reversal Watch' : 'Bullish Continuation Watch',
      optionBias: 'ATM Call Bias',
      subtitle: `${side || 'Band'} touch with ${titleCase(direction)} signal.`,
      tone: 'success',
      icon: <TrendingUpRoundedIcon fontSize="small" />,
    };
  }
  if (bearish) {
    return {
      title: direction === 'reversal' ? 'Bearish Reversal Watch' : 'Bearish Continuation Watch',
      optionBias: 'ATM Put Bias',
      subtitle: `${side || 'Band'} touch with ${titleCase(direction)} signal.`,
      tone: 'error',
      icon: <TrendingDownRoundedIcon fontSize="small" />,
    };
  }
  return {
    title: `${titleCase(direction)} Watch`,
    optionBias: 'Directional Bias',
    subtitle: `${side || 'Band'} touch with ${titleCase(direction)} signal.`,
    tone: decision.predicted_direction === 'reversal' ? 'success' : 'info',
    icon: direction === 'reversal' ? <TrendingDownRoundedIcon fontSize="small" /> : <TrendingUpRoundedIcon fontSize="small" />,
  };
};

function MetricCard({ label, value, hint, tone = 'neutral', compact = false }) {
  return (
    <Box
      sx={(theme) => ({
        minWidth: 0,
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
          overflowWrap: 'anywhere',
          color: tone !== 'neutral' && theme.palette[tone] ? theme.palette[tone].main : 'text.primary',
        })}
      >
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

function DecisionCockpit({ payload = {}, activeHorizon, decision = {}, backtest = {} }) {
  const isPrediction = decision.status === 'prediction';
  const posture = tradePosture(payload, decision);
  const selectedStats = selectedDirectionStats(decision);
  const gateStatus = decision.deployment_quality_gate?.status || backtest.quality_gate?.status || 'unknown';
  const gateTone = gateStatus === 'passed' && isPrediction ? posture.tone : gateStatus === 'quarantined' ? 'warning' : 'default';
  const signalLabel = isPrediction
    ? `${activeHorizon.toUpperCase()} ${titleCase(decision.predicted_direction)}`
    : `${activeHorizon.toUpperCase()} No Prediction`;
  const analog = decision.analog_evidence;
  const playbook = decision.playbook;
  const flatOk = decision.model?.flat_reversal_predictions_count_as_correct;
  const activeAccuracy = activeDirectionAccuracy(decision, backtest);

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        ...panelSx(theme),
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        borderColor: alpha(theme.palette[posture.tone]?.main || theme.palette.primary.main, 0.36),
      })}
    >
      <Box
        sx={(theme) => ({
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `linear-gradient(135deg, ${alpha(
            theme.palette[posture.tone]?.main || theme.palette.primary.main,
            0.13
          )}, transparent 42%)`,
        })}
      />
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 0, flex: '1 1 240px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={(theme) => ({
                  width: 36,
                  height: 36,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 'var(--app-radius)',
                  color: theme.palette[posture.tone]?.main || theme.palette.primary.main,
                  bgcolor: alpha(theme.palette[posture.tone]?.main || theme.palette.primary.main, 0.14),
                  border: `1px solid ${alpha(theme.palette[posture.tone]?.main || theme.palette.primary.main, 0.24)}`,
                })}
              >
                {posture.icon}
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                  Decision Cockpit
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={950}
                  sx={{ lineHeight: 1.1, overflowWrap: 'anywhere' }}
                >
                  {posture.title}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {posture.subtitle}
            </Typography>
            {eventRiskMessage(payload, activeHorizon) ? (
              <Box sx={{ mt: 1 }}>
                <EventRiskNotice payload={payload} activeHorizon={activeHorizon} />
              </Box>
            ) : null}
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 0.75,
              flexWrap: 'wrap',
              alignContent: 'flex-start',
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              minWidth: 0,
              '& .MuiChip-root': { maxWidth: '100%' },
            }}
          >
            <Chip size="small" color={signalColor(decision)} label={signalLabel} />
            <Chip size="small" color={gateTone} variant="outlined" label={`Gate ${titleCase(gateStatus)}`} />
            <Chip size="small" variant="outlined" label={`Resolved ${payload.as_of_date || '--'}`} />
            {payload.date_was_snapped ? <Chip size="small" color="warning" variant="outlined" label="Snapped Date" /> : null}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(260px, 0.9fr) 1.6fr' },
            gap: 1.5,
            mt: 2,
          }}
        >
          <Box
            sx={(theme) => ({
              ...insetSx(theme),
              p: 2,
              minWidth: 0,
              minHeight: 164,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderColor: alpha(theme.palette[posture.tone]?.main || theme.palette.primary.main, 0.34),
              bgcolor: alpha(theme.palette[posture.tone]?.main || theme.palette.primary.main, 0.08),
            })}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Option Lens
              </Typography>
              <Typography
                variant="h3"
                fontWeight={950}
                sx={(theme) => ({
                  mt: 0.5,
                  lineHeight: 1,
                  fontSize: { xs: '2.1rem', sm: '3rem' },
                  overflowWrap: 'anywhere',
                  color: theme.palette[posture.tone]?.main || theme.palette.text.primary,
                })}
              >
                {posture.optionBias}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 2, minWidth: 0 }}>
              <Chip size="small" variant="outlined" label={`Setup ${titleCase(payload.setup_type)}`} />
              <Chip size="small" variant="outlined" label={`Band ${payload.touched_side || '--'}`} />
              {flatOk ? <Chip size="small" variant="outlined" label="Flat Move OK" /> : null}
            </Box>
          </Box>

          <Grid container spacing={1.25}>
            <Grid item xs={6} md={3}>
              <MetricCard label="Confidence" value={decision.confidence_score ?? 0} hint="model score" tone={isPrediction ? posture.tone : 'neutral'} />
            </Grid>
            <Grid item xs={6} md={3}>
              <MetricCard label="Signal Probability" value={percent(selectedStats.probability)} hint={titleCase(decision.predicted_direction)} tone={isPrediction ? posture.tone : 'neutral'} />
            </Grid>
            <Grid item xs={6} md={3}>
              <MetricCard label="Side Precision" value={percent(selectedStats.precision)} hint={`${selectedStats.count ?? 0} analog calls`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <MetricCard label="1Y Side Accuracy" value={percent(activeAccuracy)} hint={`${backtest.prediction_count ?? 0} deployed`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <MetricCard label="Coverage" value={percent(backtest.coverage)} hint={`${backtest.eligible_touch_count ?? 0} eligible`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <MetricCard label="Training" value={decision.model?.training_sample_count ?? 0} hint="prior outcomes" />
            </Grid>
            <Grid item xs={6} md={3}>
              <MetricCard label="Playbook" value={playbook?.match_count ?? '--'} hint={playbook?.name || 'no matched profile'} />
            </Grid>
            <Grid item xs={6} md={3}>
              <MetricCard label="Similar Setups" value={analog?.neighbor_count ?? '--'} hint={percent(analog?.posterior_probability)} />
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            mt: 1.5,
            minWidth: 0,
            '& .MuiChip-root': { maxWidth: '100%' },
          }}
        >
          <Chip size="small" variant="outlined" label={`Threshold ${percent(payload.prediction_threshold)}`} />
          <Chip size="small" variant="outlined" label={`Reverse Edge ${percent(payload.deployment_thresholds?.reversal)}`} />
          <Chip size="small" variant="outlined" label={`Continue Edge ${percent(payload.deployment_thresholds?.continuation)}`} />
          {decision.no_prediction_reason ? (
            <Chip size="small" color="warning" variant="outlined" label={`Hold: ${titleCase(decision.no_prediction_reason)}`} />
          ) : null}
          {decision.reversal_veto_reason ? (
            <Chip size="small" color="warning" variant="outlined" label={`Veto: ${titleCase(decision.reversal_veto_reason)}`} />
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}

function DirectionProbabilityBar({ label, probability, tone, active }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.65 }}>
        <Typography variant="caption" color={active ? `${tone}.main` : 'text.secondary'} fontWeight={active ? 850 : 650}>
          {label}
        </Typography>
        <Typography variant="caption" color={active ? `${tone}.main` : 'text.secondary'} fontWeight={850}>
          {percent(probability)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progressValue(probability)}
        sx={(theme) => ({
          height: 5,
          borderRadius: '999px',
          bgcolor: alpha(theme.palette.common.white, 0.08),
          '& .MuiLinearProgress-bar': {
            borderRadius: '999px',
            bgcolor: active ? theme.palette[tone].main : alpha(theme.palette.text.primary, 0.42),
          },
        })}
      />
    </Box>
  );
}

function HorizonSummaryCard({ label, horizon, decision = {}, active, onSelect }) {
  const isPrediction = decision.status === 'prediction';
  const tone = isPrediction ? signalColor(decision) : 'warning';
  const gateStatus = decision.deployment_quality_gate?.status || 'unknown';
  const confidence = Number(decision.confidence_score);
  const confidenceLabel = Number.isFinite(confidence) ? String(confidence) : '--';
  const selectedStats = selectedDirectionStats(decision);
  const analog = decision.analog_evidence;
  const trainingCount = decision.model?.training_sample_count;
  const reasonText = decision.no_prediction_reason || decision.reversal_veto_reason;

  return (
    <Paper
      component="button"
      type="button"
      variant="outlined"
      aria-pressed={active}
      onClick={() => onSelect?.(horizon)}
      sx={(theme) => ({
        ...panelSx(theme),
        width: '100%',
        height: '100%',
        m: 0,
        p: 2,
        appearance: 'none',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
        overflow: 'hidden',
        borderColor: active
          ? alpha(theme.palette[tone].main, 0.42)
          : alpha(theme.palette.common.white, 0.12),
        bgcolor: active
          ? alpha(theme.palette[tone].main, 0.09)
          : alpha(theme.palette.background.paper, 0.58),
        boxShadow: active
          ? `0 16px 46px ${alpha(theme.palette[tone].main, 0.12)}, inset 0 1px 0 ${alpha(
              theme.palette.common.white,
              0.08
            )}`
          : `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.06)}`,
        transition: theme.transitions.create(['border-color', 'background-color', 'box-shadow', 'transform'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          transform: 'translateY(-1px)',
          borderColor: alpha(theme.palette[tone].main, 0.46),
          bgcolor: alpha(theme.palette[tone].main, active ? 0.11 : 0.06),
        },
        '&:focus-visible': {
          outline: `2px solid ${alpha(theme.palette.primary.main, 0.7)}`,
          outlineOffset: 2,
        },
      })}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, minWidth: 0 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
            {label}
          </Typography>
          <Typography
            variant="h4"
            fontWeight={950}
            sx={(theme) => ({
              mt: 0.45,
              lineHeight: 1.03,
              fontSize: { xs: '1.75rem', sm: '2rem' },
              color: isPrediction ? theme.palette[tone].main : theme.palette.text.primary,
              overflowWrap: 'anywhere',
            })}
          >
            {signalText(decision)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.45 }}>
            {isPrediction
              ? `${titleCase(decision.predicted_direction)} edge ${percent(selectedStats.probability)}`
              : reasonText
              ? titleCase(reasonText)
              : 'Model gates did not clear'}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right', flex: '0 0 auto' }}>
          <Chip
            size="small"
            color={active ? tone : 'default'}
            variant={active ? 'filled' : 'outlined'}
            label={active ? 'Active' : horizon.toUpperCase()}
          />
          <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 1, mt: 1 }}>
            {confidenceLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            confidence
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.5,
          mt: 2,
        }}
      >
        <DirectionProbabilityBar
          label="Reverse"
          probability={decision.reversal_probability}
          tone="success"
          active={decision.predicted_direction === 'reversal'}
        />
        <DirectionProbabilityBar
          label="Continue"
          probability={decision.continuation_probability}
          tone="info"
          active={decision.predicted_direction === 'continuation'}
        />
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.75, '& .MuiChip-root': { maxWidth: '100%' } }}>
        <Chip size="small" variant="outlined" label={`Gate ${titleCase(gateStatus)}`} />
        {Number.isFinite(Number(trainingCount)) ? (
          <Chip size="small" variant="outlined" label={`Training ${trainingCount}`} />
        ) : null}
        {analog?.status === 'ready' ? (
          <Chip size="small" variant="outlined" label={`Analogs ${analog.neighbor_count ?? '--'}`} />
        ) : null}
        {decision.model?.flat_reversal_predictions_count_as_correct ? (
          <Chip size="small" variant="outlined" label="Flat OK" />
        ) : null}
      </Box>
    </Paper>
  );
}

function ModelFreshnessStrip({ contextMeta = {}, freshness = {}, quality = {} }) {
  const line = modelFreshnessLine(contextMeta, freshness);
  if (!line && !quality.status) return null;

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        ...insetSx(theme),
        p: 1.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        flexWrap: 'wrap',
        bgcolor: alpha(theme.palette.common.white, 0.035),
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <SyncRoundedIcon fontSize="small" color={freshness.status === 'fresh' ? 'success' : 'inherit'} />
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {line || freshnessLabel(freshness)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {freshness.status ? (
          <Chip size="small" color={freshnessTone(freshness.status)} label={freshnessLabel(freshness)} />
        ) : null}
        {quality.status ? <Chip size="small" variant="outlined" label={`Quality ${titleCase(quality.status)}`} /> : null}
      </Box>
    </Paper>
  );
}

function EventRiskNotice({ payload = {}, activeHorizon }) {
  const message = eventRiskMessage(payload, activeHorizon);
  if (!message) return null;
  return (
    <Alert severity="warning" icon={<CalendarMonthRoundedIcon />}>
      {message}
    </Alert>
  );
}

function OpenPredictionLifecycle({ predictions = [], activeHorizon }) {
  if (!predictions.length) return null;

  return (
    <Paper variant="outlined" sx={panelSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h6" fontWeight={850}>
            Open {activeHorizon.toUpperCase()} Prediction
          </Typography>
        </Box>
        <Chip size="small" color="warning" variant="outlined" label={`${predictions.length} Open`} />
      </Box>

      <Grid container spacing={1.25} sx={{ mt: 0.5 }}>
        {predictions.map((prediction, index) => {
          const horizonDays = Number(prediction.horizon_days) || Number(activeHorizon.replace('d', '')) || 0;
          const elapsedSessions = Math.max(0, Number(prediction.elapsed_sessions) || 0);
          const dayNumber = horizonDays > 0 ? Math.min(horizonDays, elapsedSessions + 1) : elapsedSessions + 1;
          const progress = Math.max(0, Math.min(100, Number(prediction.progress) * 100 || 0));
          const tone = openPredictionTone(prediction);

          return (
            <Grid item xs={12} md={predictions.length > 1 ? 6 : 12} key={`${prediction.signal_date || index}-${index}`}>
              <Box
                sx={(theme) => ({
                  ...insetSx(theme),
                  p: 1.5,
                  height: '100%',
                  borderColor:
                    tone !== 'default' && theme.palette[tone]
                      ? alpha(theme.palette[tone].main, 0.28)
                      : alpha(theme.palette.common.white, 0.10),
                })}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                      {prediction.signal_date || '--'}
                    </Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.15 }}>
                      Day {dayNumber} of {horizonDays || '--'}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    color={tone}
                    variant={tone === 'default' ? 'outlined' : 'filled'}
                    label={openPredictionStatusLabel(prediction)}
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={(theme) => ({
                    mt: 1.25,
                    height: 6,
                    borderRadius: '999px',
                    bgcolor: alpha(theme.palette.common.white, 0.08),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: '999px',
                      bgcolor: tone !== 'default' && theme.palette[tone] ? theme.palette[tone].main : theme.palette.warning.main,
                    },
                  })}
                />

                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  <Grid item xs={6} sm={3}>
                    <MetricCard label="Prediction" value={titleCase(prediction.predicted_direction)} compact tone={tone === 'default' ? 'neutral' : tone} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <MetricCard label="Entry Close" value={currency(prediction.signal_close)} compact />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <MetricCard label="Current Close" value={currency(prediction.current_close)} compact />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <MetricCard label="Unrealized" value={signedPercent(prediction.current_trade_return)} compact tone={tone === 'default' ? 'neutral' : tone} />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}

function MarkerSwatch({ color, shape = 'circle' }) {
  return (
    <Box
      sx={{
        width: shape === 'triangle' ? 0 : 9,
        height: shape === 'triangle' ? 0 : 9,
        borderRadius: shape === 'circle' ? '50%' : '2px',
        bgcolor: shape === 'triangle' ? 'transparent' : color,
        border: shape === 'triangle' ? 'none' : '1px solid rgba(10, 14, 20, 0.9)',
        borderLeft: shape === 'triangle' ? '5px solid transparent' : undefined,
        borderRight: shape === 'triangle' ? '5px solid transparent' : undefined,
        borderBottom: shape === 'triangle' ? `9px solid ${color}` : undefined,
        flex: '0 0 auto',
      }}
    />
  );
}

function PredictionMarkerLegend() {
  const statusItems = [
    { label: 'Touch Only', color: 'rgba(148,163,184,0.58)' },
    { label: 'Win', color: '#34c759' },
    { label: 'Loss', color: '#ff453a' },
    { label: 'Open', color: '#ff9f0a' },
  ];
  const directionItems = [
    { label: 'Reverse', color: 'rgba(227,236,255,0.86)', shape: 'triangle' },
    { label: 'Continue', color: 'rgba(227,236,255,0.86)', shape: 'square' },
  ];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mt: 0.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={850}>
          Status
        </Typography>
        {statusItems.map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.55 }}>
            <MarkerSwatch color={item.color} />
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={(theme) => ({ width: 1, height: 14, bgcolor: alpha(theme.palette.common.white, 0.14) })} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={850}>
          Direction
        </Typography>
        {directionItems.map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.55 }}>
            <MarkerSwatch color={item.color} shape={item.shape} />
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
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

function KeyReasonsPanel({ activeHorizon, decision = {} }) {
  const reasons = keyReasonsForDecision(decision);
  const predictedDirection = titleCase(decision.predicted_direction);

  return (
    <Paper variant="outlined" sx={panelSx}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={850}>
            Key Reasons
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {decision.status === 'prediction'
              ? `${activeHorizon.toUpperCase()} model leaned ${predictedDirection} because these inputs carried the most weight.`
              : `${activeHorizon.toUpperCase()} model did not clear a trade signal.`}
          </Typography>
        </Box>
        <Chip size="small" color={signalColor(decision)} label={`${activeHorizon.toUpperCase()} ${signalText(decision)}`} />
      </Box>

      {reasons.length > 0 ? (
        <Grid container spacing={1.25} sx={{ mt: 0.75 }}>
          {reasons.map((reason, index) => {
            const tone = reasonTone(reason, decision);
            return (
              <Grid item xs={12} md={6} key={`${reason.feature || 'reason'}-${index}`}>
                <Box
                  sx={(theme) => ({
                    ...insetSx(theme),
                    p: 1.5,
                    height: '100%',
                    borderColor:
                      tone !== 'default' && theme.palette[tone]
                        ? alpha(theme.palette[tone].main, 0.28)
                        : alpha(theme.palette.common.white, 0.10),
                  })}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={850} sx={{ overflowWrap: 'anywhere' }}>
                        {titleCase(reason.feature)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                        {reasonImpactLabel(reason, decision)}
                      </Typography>
                    </Box>
                    <Chip size="small" color={tone} variant={tone === 'default' ? 'outlined' : 'filled'} label={`#${reason.rank || index + 1}`} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.25 }}>
                    <Chip size="small" variant="outlined" label={`Value ${String(reason.value ?? '--')}`} />
                    <Chip size="small" variant="outlined" label={`Weight ${decimal(reason.contribution, 3)}`} />
                    {reason.horizon ? (
                      <Chip size="small" variant="outlined" label={String(reason.horizon).toUpperCase()} />
                    ) : null}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          No ranked reasons for this symbol/date.
        </Typography>
      )}
    </Paper>
  );
}

function SimilarPastCasesPanel({ activeHorizon, decision = {} }) {
  const cases = similarCasesForDecision(decision).slice(0, 8);
  const playbook = decision.playbook || {};
  const predictedDirection = decision.predicted_direction;

  return (
    <Paper variant="outlined" sx={panelSx}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={850}>
            Similar Past Cases
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Prior {activeHorizon.toUpperCase()} setups closest to the current tape.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {playbook.match_count !== undefined ? (
            <Chip size="small" variant="outlined" label={`${playbook.match_count} matched`} />
          ) : null}
          {playbook.precision !== undefined ? (
            <Chip size="small" color={signalColor(decision)} variant="outlined" label={`${percent(playbook.precision)} precision`} />
          ) : null}
          {predictedDirection ? (
            <Chip size="small" color={signalColor(decision)} label={titleCase(predictedDirection)} />
          ) : null}
        </Box>
      </Box>

      <TableContainer sx={{ mt: 1.5 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Signal Date</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Actual Move</TableCell>
              <TableCell>Result</TableCell>
              <TableCell align="right">Return</TableCell>
              <TableCell align="right">Similarity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cases.length > 0 ? (
              cases.map((item, index) => (
                <TableRow key={`${item.signal_date || item.date || 'case'}-${index}`}>
                  <TableCell>{item.signal_date || item.date || '--'}</TableCell>
                  <TableCell>{item.touched_side || '--'}</TableCell>
                  <TableCell>{titleCase(item.actual_direction || item.direction)}</TableCell>
                  <TableCell>
                    <Chip size="small" color={caseResultTone(item)} variant="outlined" label={caseResultLabel(item)} />
                  </TableCell>
                  <TableCell align="right">{signedPercent(item.trade_return)}</TableCell>
                  <TableCell align="right">{formatSimilarity(item.similarity)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No similar past cases returned for this horizon.
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

function LoadingPanel({ pendingStatus }) {
  const retrySeconds = retryDelaySeconds(pendingStatus?.retry_after_seconds);
  const preload = pendingStatus?.preload || {};
  const preloadStatus = preload.status || pendingStatus?.status;
  const preloadStatusText = preloadStatus ? titleCase(preloadStatus) : 'Running';
  const preloadReason = preload.reason || pendingStatus?.reason;

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        ...panelSx(theme),
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minHeight: 128,
      })}
    >
      <CircularProgress size={34} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" fontWeight={850}>
          {pendingStatus ? 'Preparing Entry Decision Model' : 'Loading Entry Decision'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {pendingStatus
            ? `Worker ${preloadStatusText}. Retrying in ${retrySeconds}s.`
            : 'Fetching model payload.'}
        </Typography>
        {preloadReason ? (
          <Chip
            size="small"
            icon={<SyncRoundedIcon />}
            label={titleCase(preloadReason)}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        ) : null}
      </Box>
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
  const [pendingStatus, setPendingStatus] = useState(null);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();
    const timers = new Set();
    const controllers = new Set();

    if (!symbol) {
      setPayload(null);
      setPendingStatus(null);
      setError('');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const schedule = (callback, delayMs) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delayMs);
      timers.add(timer);
    };

    const requestDecision = (forceRefresh = false) => {
      if (!active) return;
      const controller = new AbortController();
      controllers.add(controller);
      setLoading(true);
      setError('');

      fetchStockEntryDecision(symbol, selectedDate, { signal: controller.signal, forceRefresh })
        .then((data) => {
          if (!active) return;
          if (data?.status === 'loading') {
            if (Date.now() - startedAt >= MAX_ENTRY_DECISION_WAIT_MS) {
              setPayload(null);
              setPendingStatus(null);
              setError('Entry decision model is still warming. Try again in a few minutes.');
              setLoading(false);
              return;
            }
            setPayload(null);
            setPendingStatus(data);
            setLoading(true);
            schedule(() => requestDecision(true), retryDelaySeconds(data.retry_after_seconds) * 1000);
            return;
          }
          setPendingStatus(null);
          setPayload(data);
          setLoading(false);
        })
        .catch((err) => {
          if (!active) return;
          if (err?.name === 'AbortError') return;
          setPendingStatus(null);
          setPayload(null);
          setError(err?.message || 'Failed to fetch entry decision.');
          setLoading(false);
        })
        .finally(() => {
          controllers.delete(controller);
        });
    };

    setPendingStatus(null);
    setError('');
    setLoading(true);
    schedule(() => requestDecision(false), 250);

    return () => {
      active = false;
      timers.forEach((timer) => window.clearTimeout(timer));
      controllers.forEach((controller) => controller.abort());
    };
  }, [symbol, selectedDate]);

  const horizons = payload?.horizons || {};
  const activeDecision = horizons[activeHorizon] || {};
  const activeBacktest = payload?.backtest_1y?.[activeHorizon] || {};
  const activePredictions = activeBacktest.predictions || [];
  const recentPredictions = activeBacktest.recent_predictions || [];
  const modelMeta = payload?.meta || {};
  const contextMeta = modelMeta.context || {};
  const freshness = modelMeta.freshness || {};
  const modelQuality = modelMeta.quality || contextMeta.quality || {};

  const chartSummary = useMemo(
    () => ({
      symbol: payload?.symbol,
      chart_data: payload?.chart_data || [],
    }),
    [payload]
  );

  const allPredictionMarkers = useMemo(() => {
    if (!payload) return [];

    const byKey = new Map();
    const addMarker = (prediction, horizon, markerStatus) => {
      const date = predictionDate(prediction);
      if (!date || !horizon) return;
      byKey.set(
        predictionMarkerKey(prediction, horizon),
        normalizePredictionMarker(prediction, horizon, activeHorizon, markerStatus)
      );
    };

    activePredictions.forEach((prediction) => addMarker(prediction, activeHorizon, 'scored'));

    HORIZON_ORDER.forEach((horizon) => {
      const backtest = payload.backtest_1y?.[horizon] || {};
      (backtest.open_predictions || []).forEach((prediction) => addMarker(prediction, horizon, 'open'));
    });

    HORIZON_ORDER.forEach((horizon) => {
      const decision = payload.horizons?.[horizon] || {};
      if (decision.status !== 'prediction' || !payload.as_of_date) return;
      const currentKey = `${horizon}|${payload.as_of_date}`;
      if (byKey.has(currentKey)) return;
      addMarker(
        {
          status: 'open',
          signal_date: payload.as_of_date,
          predicted_direction: decision.predicted_direction,
          confidence_score: decision.confidence_score,
          is_correct: null,
        },
        horizon,
        'open'
      );
    });

    return [...byKey.values()].sort((a, b) => {
      const dateDelta = predictionDate(a).localeCompare(predictionDate(b));
      if (dateDelta) return dateDelta;
      return HORIZON_ORDER.indexOf(a.horizon) - HORIZON_ORDER.indexOf(b.horizon);
    });
  }, [activeHorizon, activePredictions, payload]);

  const openPredictionMarkers = useMemo(
    () => allPredictionMarkers.filter((marker) => marker.marker_status === 'open' || marker.is_open),
    [allPredictionMarkers]
  );

  const activeOpenPredictionMarkers = useMemo(
    () => openPredictionMarkers.filter((marker) => marker.horizon === activeHorizon),
    [activeHorizon, openPredictionMarkers]
  );

  const chartPredictionMarkers = useMemo(() => {
    if (!payload) return [];
    const markers = new Map();
    activePredictions.forEach((prediction) => {
      const scoredMarker = normalizePredictionMarker(prediction, activeHorizon, activeHorizon, 'scored');
      markers.set(predictionMarkerKey(scoredMarker, activeHorizon), scoredMarker);
    });

    activeOpenPredictionMarkers.forEach((marker) => {
      markers.set(predictionMarkerKey(marker, marker.horizon), marker);
    });

    const selectedScoredPrediction = activePredictions.find(
      (prediction) => predictionDate(prediction) === payload.as_of_date
    );
    if (selectedScoredPrediction) {
      const selectedMarker = normalizePredictionMarker(
        {
          ...selectedScoredPrediction,
          is_selected_signal: true,
        },
        activeHorizon,
        activeHorizon,
        'scored'
      );
      markers.set(predictionMarkerKey(selectedMarker, activeHorizon), selectedMarker);
    }

    return [...markers.values()];
  }, [activeHorizon, activeOpenPredictionMarkers, activePredictions, payload]);

  const activeWinLossCounts = useMemo(() => {
    const predictionCount = Number(activeBacktest.prediction_count);
    const correctCount = Number(activeBacktest.correct_count);
    if (!Number.isFinite(predictionCount) || !Number.isFinite(correctCount)) {
      return null;
    }
    return {
      wins: correctCount,
      losses: Math.max(0, predictionCount - correctCount),
    };
  }, [activeBacktest.correct_count, activeBacktest.prediction_count]);

  const handleHorizonChange = (_, value) => {
    if (!value) return;
    setActiveHorizon(value);
  };

  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        minWidth: 0,
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2.5, flexWrap: 'wrap', minWidth: 0 }}>
          <Box sx={{ minWidth: 0, flex: '1 1 420px' }}>
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
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' }, overflowWrap: 'anywhere' }}
              >
                Entry Decision
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                mt: 1.25,
                minWidth: 0,
                '& .MuiChip-root': { maxWidth: '100%' },
              }}
            >
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
                maxWidth: '100%',
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
                  sx={{ maxWidth: '100%' }}
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
        <LoadingPanel pendingStatus={pendingStatus} />
      ) : null}

      {!loading && error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && payload ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
              minWidth: 0,
              '& .MuiChip-root': { maxWidth: '100%' },
            }}
          >
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
            {freshness.status ? (
              <Chip
                icon={<ShieldRoundedIcon />}
                color={freshnessTone(freshness.status)}
                label={freshnessLabel(freshness)}
                variant="outlined"
              />
            ) : null}
            {contextMeta.price_data_end_date ? (
              <Chip label={`Data Through: ${contextMeta.price_data_end_date}`} variant="outlined" />
            ) : null}
            {freshness.latest_required_price_date ? (
              <Chip label={`Required: ${freshness.latest_required_price_date}`} variant="outlined" />
            ) : null}
            {modelQuality.status ? (
              <Chip label={`Quality: ${titleCase(modelQuality.status)}`} variant="outlined" />
            ) : null}
            {payload.date_was_snapped ? (
              <Chip label="Snapped To Previous Trading Day" color="warning" variant="outlined" />
            ) : null}
          </Box>

          <ModelFreshnessStrip contextMeta={contextMeta} freshness={freshness} quality={modelQuality} />

          <DecisionCockpit
            payload={payload}
            activeHorizon={activeHorizon}
            decision={activeDecision}
            backtest={activeBacktest}
          />

          <Grid container spacing={1.5} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <HorizonSummaryCard
                label="5-Day Direction"
                horizon="5d"
                decision={horizons['5d']}
                active={activeHorizon === '5d'}
                onSelect={setActiveHorizon}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <HorizonSummaryCard
                label="10-Day Direction"
                horizon="10d"
                decision={horizons['10d']}
                active={activeHorizon === '10d'}
                onSelect={setActiveHorizon}
              />
            </Grid>
          </Grid>

          <Grid container spacing={1.5}>
            <Grid item xs={12} lg={5}>
              <KeyReasonsPanel activeHorizon={activeHorizon} decision={activeDecision} />
            </Grid>
            <Grid item xs={12} lg={7}>
              <SimilarPastCasesPanel activeHorizon={activeHorizon} decision={activeDecision} />
            </Grid>
          </Grid>

          <OpenPredictionLifecycle predictions={activeOpenPredictionMarkers} activeHorizon={activeHorizon} />

          {payload.chart_data?.length ? (
            <Paper
              variant="outlined"
              sx={(theme) => ({
                ...panelSx(theme),
                overflow: 'hidden',
              })}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                  flexWrap: 'wrap',
                  mb: 1,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={850}>
                    Bollinger Prediction Chart
                  </Typography>
                  <PredictionMarkerLegend />
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Chip size="small" color={signalColor(activeDecision)} label={`${activeHorizon.toUpperCase()} ${signalText(activeDecision)}`} />
                  {activeWinLossCounts ? (
                    <>
                      <Chip
                        size="small"
                        color="success"
                        variant="outlined"
                        label={`Wins ${activeWinLossCounts.wins}`}
                      />
                      <Chip
                        size="small"
                        color="error"
                        variant="outlined"
                        label={`Losses ${activeWinLossCounts.losses}`}
                      />
                    </>
                  ) : null}
                  {activeOpenPredictionMarkers.length ? (
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label={`${activeOpenPredictionMarkers.length} Open`}
                    />
                  ) : null}
                </Box>
              </Box>
              <StockChart
                summary={chartSummary}
                eventMap={{}}
                range={chartRange}
                onRangeChange={setChartRange}
                predictionMarkers={chartPredictionMarkers}
                touchMarkerVariant="neutral"
                height={560}
              />
            </Paper>
          ) : null}

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
