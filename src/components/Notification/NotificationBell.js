import React, { useState, useContext, useMemo } from 'react';
import {
  Button, Badge, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, FormControl, InputLabel, Select, MenuItem,
  useMediaQuery, Slide, Chip, IconButton, Collapse
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AutoGraph,
  ExpandLess,
  ExpandMore,
  Notifications,
  Timeline,
  TrendingDown,
  TrendingUp,
  Visibility,
} from '@mui/icons-material';
import { AlertsContext } from './AlertContext';
import { useTheme } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import GroupedAlerts from './GroupedAlerts';
import { getBandBreakoutRawPct } from './BandBreakoutMeter';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const formatPercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '--';
  return `${number >= 0 ? '+' : ''}${(number * 100).toFixed(2)}%`;
};

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '--';
  return `$${number.toFixed(2)}`;
};

const titleCase = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeSymbol = (value) =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

const formatSignalDate = (value) => {
  const text = String(value || '').trim();
  if (!text) return '--';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00Z`)
    : new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

const formatRemainingSessions = (value) => {
  if (value === null || value === undefined || value === '') return '-- sessions left';
  const number = Number(value);
  if (!Number.isFinite(number)) return '-- sessions left';
  return `${number} session${number === 1 ? '' : 's'} left`;
};

const formatRemainingSessionRange = (values) => {
  const numbers = finiteNumbers(values);
  if (!numbers.length) return '-- sessions left';
  const unique = Array.from(new Set(numbers)).sort((a, b) => a - b);
  if (unique.length === 1) return formatRemainingSessions(unique[0]);
  return `${unique[0]}-${unique[unique.length - 1]} sessions left`;
};

const remainingRank = (signal) => {
  if (signal?.remaining_sessions === null || signal?.remaining_sessions === undefined || signal?.remaining_sessions === '') {
    return 999;
  }
  const value = Number(signal?.remaining_sessions);
  return Number.isFinite(value) ? value : 999;
};

const signalSort = (a, b) => {
  const remainingDelta = remainingRank(a) - remainingRank(b);
  if (remainingDelta !== 0) return remainingDelta;
  const dateDelta = String(b?.signal_date || '').localeCompare(String(a?.signal_date || ''));
  if (dateDelta !== 0) return dateDelta;
  return Number(a?.horizon_days || 0) - Number(b?.horizon_days || 0);
};

const finiteNumbers = (values) =>
  values.map((value) => Number(value)).filter((value) => Number.isFinite(value));

const formatNumberRange = (values, formatter) => {
  const numbers = finiteNumbers(values);
  if (!numbers.length) return '--';
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  if (Math.abs(min - max) < 0.000001) return formatter(min);
  return `${formatter(min)} to ${formatter(max)}`;
};

const signalSetupKey = (signal) =>
  [
    signal?.horizon_days ?? '',
    signal?.predicted_direction || '',
    signal?.interim_status || 'open',
  ].join('|');

const groupSignalsBySetup = (signals) => {
  const grouped = new Map();
  for (const signal of signals) {
    const key = signalSetupKey(signal);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(signal);
  }

  return Array.from(grouped.values())
    .map((setupSignals) => {
      const sortedSignals = [...setupSignals].sort(signalSort);
      const primary = sortedSignals[0];
      const remainingValues = sortedSignals
        .map((signal) => Number(signal?.remaining_sessions))
        .filter((value) => Number.isFinite(value));
      const nextRemaining = remainingValues.length ? Math.min(...remainingValues) : null;
      return {
        key: signalSetupKey(primary),
        signals: sortedSignals,
        horizonDays: primary?.horizon_days,
        predictedDirection: primary?.predicted_direction,
        interimStatus: primary?.interim_status || 'open',
        nextRemaining,
        nextRemainingRank: nextRemaining == null ? 999 : nextRemaining,
        remainingSummary: formatRemainingSessionRange(remainingValues),
        entryRange: formatNumberRange(sortedSignals.map((signal) => signal?.signal_close), formatPrice),
        returnRange: formatNumberRange(sortedSignals.map((signal) => signal?.current_trade_return), formatPercent),
      };
    })
    .sort((a, b) => {
      if (a.nextRemainingRank !== b.nextRemainingRank) return a.nextRemainingRank - b.nextRemainingRank;
      if (Number(a.horizonDays || 0) !== Number(b.horizonDays || 0)) {
        return Number(a.horizonDays || 0) - Number(b.horizonDays || 0);
      }
      return String(a.predictedDirection || '').localeCompare(String(b.predictedDirection || ''));
    });
};

const groupOpenSignalsBySymbol = (signals) => {
  const grouped = new Map();
  for (const signal of signals) {
    const symbol = normalizeSymbol(signal?.symbol || signal?.ticker);
    if (!symbol) continue;
    if (!grouped.has(symbol)) grouped.set(symbol, []);
    grouped.get(symbol).push({ ...signal, symbol });
  }

  return Array.from(grouped.entries())
    .map(([symbol, symbolSignals]) => {
      const sortedSignals = [...symbolSignals].sort(signalSort);
      const working = sortedSignals.filter((signal) => signal?.interim_status === 'working').length;
      const against = sortedSignals.filter((signal) => signal?.interim_status === 'against').length;
      const remainingValues = sortedSignals
        .map((signal) => Number(signal?.remaining_sessions))
        .filter((value) => Number.isFinite(value));
      const nextRemaining = remainingValues.length ? Math.min(...remainingValues) : null;
      const nextRemainingRank = nextRemaining == null ? 999 : nextRemaining;
      const currentClose = sortedSignals.find((signal) => Number.isFinite(Number(signal?.current_close)))?.current_close;
      return {
        symbol,
        signals: sortedSignals,
        working,
        against,
        nextRemaining,
        nextRemainingRank,
        currentClose,
      };
    })
    .sort((a, b) => {
      if (a.nextRemainingRank !== b.nextRemainingRank) return a.nextRemainingRank - b.nextRemainingRank;
      return a.symbol.localeCompare(b.symbol);
    });
};

const signalTone = (signal) => {
  if (signal?.interim_status === 'working') return 'success';
  if (signal?.interim_status === 'against') return 'error';
  if (signal?.interim_status === 'flat') return 'warning';
  return 'default';
};

const signalGroupAccent = (theme, group) => {
  if (group.against > 0) return toneColor(theme, 'warning');
  if (group.working > 0) return toneColor(theme, 'success');
  return toneColor(theme, 'default');
};

const toneColor = (theme, tone) => {
  if (tone === 'success') return '#55C7F7';
  if (tone === 'error') return '#E8A85F';
  if (tone === 'warning') return '#E8A85F';
  return theme.palette.info.main;
};

const directionLabel = (direction) => {
  if (direction === 'continuation') return 'Continuation';
  if (direction === 'reversal') return 'Reversal';
  return titleCase(direction || 'Unknown');
};

const directionTone = (direction) => {
  if (direction === 'continuation') return 'success';
  if (direction === 'reversal') return 'error';
  return 'default';
};

const setupRank = (setup) => {
  const horizon = Number(setup?.horizonDays);
  return Number.isFinite(horizon) ? horizon : 999;
};

const pickStorySetups = (setupGroups) => {
  const sortedByHorizon = [...setupGroups].sort((a, b) => {
    const horizonDelta = setupRank(a) - setupRank(b);
    if (horizonDelta !== 0) return horizonDelta;
    return a.nextRemainingRank - b.nextRemainingRank;
  });
  const primaryDirection = sortedByHorizon[0]?.predictedDirection;
  return sortedByHorizon
    .map((setup, index) => {
      if (index === 0) return { label: 'Near term', setup: { ...setup, role: 'near_term' }, rolePriority: 0 };
      if (setup.predictedDirection === primaryDirection) {
        return { label: 'Also supports', setup: { ...setup, role: 'supporting' }, rolePriority: 1 };
      }
      return { label: 'Opposing risk', setup: { ...setup, role: 'risk' }, rolePriority: 2 };
    })
    .sort((a, b) => {
      if (a.rolePriority !== b.rolePriority) return a.rolePriority - b.rolePriority;
      return setupRank(a.setup) - setupRank(b.setup);
    });
};

const buildSignalStory = (symbol, group, setupGroups) => {
  const steps = pickStorySetups(setupGroups);
  const directions = new Set(steps.map((step) => step.setup.predictedDirection).filter(Boolean));
  const primaryDirection = steps[0]?.setup?.predictedDirection;
  const setupNames = steps.map((step) => `${step.setup.horizonDays}D ${directionLabel(step.setup.predictedDirection)}`);
  const setupSummary = setupNames.length ? `Open setups: ${setupNames.join(', ')}.` : '';
  const hasConflict = directions.has('continuation') && directions.has('reversal');
  const headline = hasConflict
    ? `${symbol} has ${directionLabel(primaryDirection).toLowerCase()} support, but opposing risk is still open`
    : primaryDirection
      ? `All open ${symbol} setups lean ${directionLabel(primaryDirection)}`
      : `${symbol} has open model signals`;
  const summary = setupSummary || `${group.signals.length} open signal${group.signals.length === 1 ? '' : 's'} are still being tracked.`;
  const watch = hasConflict
    ? `Use this as competing model evidence, not a single yes/no call. Compare the near-term setup with the opposing setup before acting.`
    : 'The active model signals point the same way; use details to check timing and open risk.';

  return {
    headline,
    summary,
    watch,
    tone: hasConflict ? 'warning' : directionTone(primaryDirection),
    steps,
  };
};

const normalizeBackendStory = (story) => {
  if (!story || typeof story !== 'object') return null;
  const setups = Array.isArray(story.setups) ? story.setups : [];
  return {
    headline: story.headline || `${story.symbol || 'Ticker'} has open model signals`,
    summary: story.summary || '',
    watch: story.watch || 'Use details to inspect timing and direction.',
    tone: story.stance === 'mixed' ? 'warning' : directionTone(story.stance),
    steps: setups.map((setup) => ({
      label: setup.label || directionLabel(setup.predicted_direction),
      setup: {
        key: setup.key,
        role: setup.role,
        horizonDays: setup.horizon_days,
        predictedDirection: setup.predicted_direction,
        interimStatus: setup.interim_status,
        signalCount: setup.signal_count,
        remainingSummary: setup.remaining_summary,
        entryRange: setup.entry_summary,
        returnRange: setup.return_summary,
      },
    })),
  };
};

const SummaryMetric = ({ label, value, color }) => (
  <Box
    sx={{
      minWidth: 92,
      px: 1.35,
      py: 0.85,
      borderRadius: 1.5,
      bgcolor: alpha(color, 0.07),
      border: '1px solid',
      borderColor: alpha(color, 0.32),
    }}
  >
    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.1 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 800, lineHeight: 1.25 }}>
      {value}
    </Typography>
  </Box>
);

const SignalRow = ({ signal }) => {
  const theme = useTheme();
  const tone = signalTone(signal);
  const accent = toneColor(theme, tone);
  const progress = Math.max(0, Math.min(100, Number(signal?.progress) * 100 || 0));

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'minmax(150px, 1.2fr) minmax(90px, 0.8fr) minmax(110px, 0.8fr) minmax(86px, 0.7fr) 96px',
        },
        alignItems: 'center',
        gap: { xs: 0.75, md: 1.25 },
        py: 0.85,
        px: 1,
        borderRadius: 1.5,
        '&:hover': { bgcolor: alpha(accent, 0.06) },
      }}
    >
      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 750 }}>
        {formatSignalDate(signal.signal_date)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {formatRemainingSessions(signal.remaining_sessions)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Entry {formatPrice(signal.signal_close)}
      </Typography>
      <Typography variant="body2" sx={{ color: accent, fontWeight: 800 }}>
        {formatPercent(signal.current_trade_return)}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          sx={{
            flex: 1,
            height: 5,
            borderRadius: 99,
            bgcolor: alpha(theme.palette.info.main, 0.18),
            overflow: 'hidden',
          }}
        >
          <Box sx={{ height: '100%', width: `${progress}%`, bgcolor: theme.palette.info.main }} />
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', width: 30, textAlign: 'right' }}>
          {Math.round(progress)}%
        </Typography>
      </Box>
    </Box>
  );
};

const StoryStepCard = ({ step }) => {
  const theme = useTheme();
  const setup = step.setup || {};
  const tone = directionTone(setup.predictedDirection);
  const accent = toneColor(theme, tone);
  const DirectionIcon = setup.predictedDirection === 'reversal' ? TrendingDown : TrendingUp;
  const signalCount = Number.isFinite(Number(setup.signalCount))
    ? Number(setup.signalCount)
    : (Array.isArray(setup.signals) ? setup.signals.length : 0);
  const horizonText = Number.isFinite(Number(setup.horizonDays))
    ? `${setup.horizonDays}D `
    : '';

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: { xs: '100%', sm: 220 },
        p: 1.55,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(accent, 0.36),
        borderLeft: '4px solid',
        borderLeftColor: accent,
        bgcolor: alpha('#101621', 0.82),
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
        {step.label}
      </Typography>
      <Box display="flex" alignItems="center" gap={0.85} sx={{ mt: 0.8 }}>
        <DirectionIcon fontSize="small" sx={{ color: accent }} />
        <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 900, lineHeight: 1.15 }}>
          {horizonText}{directionLabel(setup.predictedDirection)}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        {setup.remainingSummary || '-- sessions left'}
      </Typography>
      <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1.2 }}>
        <Chip
          size="small"
          variant="outlined"
          label={`${signalCount} signal${signalCount === 1 ? '' : 's'}`}
          sx={{ color: 'text.primary', borderColor: alpha(accent, 0.32) }}
        />
        <Chip
          size="small"
          label={setup.returnRange || '--'}
          sx={{
            color: 'text.primary',
            bgcolor: alpha(accent, 0.12),
            fontWeight: 800,
          }}
        />
      </Box>
    </Box>
  );
};

const TradeStoryPanel = ({ story, detailsOpen, onToggleDetails, symbol }) => {
  const theme = useTheme();
  const accent = toneColor(theme, story.tone);

  return (
    <Box
      sx={{
        p: { xs: 1.75, md: 2 },
        borderRadius: 2.25,
        border: '1px solid',
        borderColor: alpha(accent, 0.34),
        bgcolor: alpha('#000', 0.14),
      }}
    >
      <Box
        display="flex"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        flexDirection={{ xs: 'column', md: 'row' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: accent, fontWeight: 900, textTransform: 'uppercase' }}>
            Trade story
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 900, mt: 0.45, lineHeight: 1.2 }}>
            {story.headline}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
            {story.summary}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Visibility />}
          aria-label={detailsOpen ? `Hide ${symbol} signal details` : `Show ${symbol} signal details`}
          onClick={onToggleDetails}
          sx={{ textTransform: 'none', fontWeight: 800, flex: '0 0 auto' }}
        >
          Details
        </Button>
      </Box>

      <Box display="flex" gap={1.5} flexWrap="wrap" sx={{ mt: 2 }}>
        {story.steps.map((step) => (
          <StoryStepCard key={`${step.label}-${step.setup.key}`} step={step} />
        ))}
      </Box>

      <Typography
        variant="body2"
        sx={{
          mt: 1.75,
          color: 'text.secondaryBright',
          borderTop: '1px solid',
          borderTopColor: alpha(accent, 0.18),
          pt: 1.5,
        }}
      >
        {story.watch}
      </Typography>
    </Box>
  );
};

const SignalSetupGroup = ({ setup }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const tone = signalTone({ interim_status: setup.interimStatus });
  const accent = toneColor(theme, tone);
  const handleToggle = () => setOpen((prev) => !prev);

  return (
    <Box
      sx={{
        mt: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(accent, open ? 0.45 : 0.22),
        bgcolor: alpha(accent, open ? 0.08 : 0.045),
        overflow: 'hidden',
      }}
    >
      <Box
        role="button"
        aria-expanded={open}
        onClick={handleToggle}
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: 'minmax(260px, 1.2fr) minmax(240px, 1fr) auto' }}
        alignItems="center"
        gap={1.25}
        sx={{
          cursor: 'pointer',
          px: 1.6,
          py: 1.35,
          borderLeft: '4px solid',
          borderLeftColor: accent,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box display="flex" alignItems="center" gap={0.85} flexWrap="wrap">
            <Timeline fontSize="small" sx={{ color: accent }} />
            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 850, lineHeight: 1.1 }}>
              {setup.horizonDays}D {titleCase(setup.predictedDirection)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                px: 0.8,
                py: 0.25,
                borderRadius: 99,
                color: accent,
                bgcolor: alpha(accent, 0.12),
                fontWeight: 800,
              }}
            >
              {titleCase(setup.interimStatus)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            {setup.signals.length} signal{setup.signals.length === 1 ? '' : 's'} • {setup.remainingSummary}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(2, minmax(110px, auto))' },
            gap: 1,
          }}
        >
          <SummaryMetric label="Entry" value={setup.entryRange} color={accent} />
          <SummaryMetric label="Return" value={setup.returnRange} color={accent} />
        </Box>

        <Box display="flex" alignItems="center" justifyContent="flex-end">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              handleToggle();
            }}
            aria-label={
              open
                ? `Collapse ${setup.horizonDays}D ${titleCase(setup.predictedDirection)} ${titleCase(setup.interimStatus)} signals`
                : `Expand ${setup.horizonDays}D ${titleCase(setup.predictedDirection)} ${titleCase(setup.interimStatus)} signals`
            }
            sx={{ color: 'text.secondaryBright' }}
          >
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box
          sx={{
            px: 1,
            pb: 1,
            pt: 0.5,
            bgcolor: alpha('#000', 0.12),
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'grid' },
              gridTemplateColumns: 'minmax(150px, 1.2fr) minmax(90px, 0.8fr) minmax(110px, 0.8fr) minmax(86px, 0.7fr) 96px',
              gap: 1.25,
              px: 1,
              py: 0.45,
              color: 'text.secondary',
            }}
          >
            <Typography variant="caption">Signal</Typography>
            <Typography variant="caption">Remaining</Typography>
            <Typography variant="caption">Entry</Typography>
            <Typography variant="caption">Return</Typography>
            <Typography variant="caption" textAlign="right">Progress</Typography>
          </Box>
          {setup.signals.map((signal, index) => (
            <SignalRow
              key={signal._signal_id || `${signal.symbol}-${signal.signal_date}-${signal.horizon_days}-${index}`}
              signal={signal}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

const TickerSignalGroup = ({ group, onViewDetails }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const accent = signalGroupAccent(theme, group);
  const primarySignal = group.signals[0];
  const setupGroups = useMemo(() => groupSignalsBySetup(group.signals), [group.signals]);
  const story = useMemo(
    () => normalizeBackendStory(group.story) || buildSignalStory(group.symbol, group, setupGroups),
    [group, setupGroups]
  );
  const handleToggle = () => setOpen((prev) => !prev);
  const handleToggleDetails = (event) => {
    event.stopPropagation();
    setDetailsOpen((prev) => !prev);
  };

  return (
    <Box
      sx={{
        mb: 2.5,
        borderRadius: 'var(--app-radius)',
        border: '1px solid',
        borderColor: alpha(accent, 0.24),
        bgcolor: alpha('#000', 0.22),
        overflow: 'hidden',
      }}
    >
      <Box
        role="button"
        aria-expanded={open}
        onClick={handleToggle}
        display="flex"
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        flexDirection={{ xs: 'column', md: 'row' }}
        gap={1.5}
        sx={{
          cursor: 'pointer',
          px: { xs: 1.75, md: 2.35 },
          py: { xs: 1.5, md: 1.85 },
          transition: 'background-color 160ms ease, border-color 160ms ease',
          '&:hover': { bgcolor: alpha(accent, 0.08) },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box display="flex" alignItems="baseline" gap={1} flexWrap="wrap">
            <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.05, letterSpacing: 0 }}>
              {group.symbol}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {group.signals.length} open signal{group.signals.length === 1 ? '' : 's'}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7 }}>
            Next closes in {formatRemainingSessions(group.nextRemaining).replace(' left', '')}
            {Number.isFinite(Number(group.currentClose)) ? ` • Current ${formatPrice(group.currentClose)}` : ''}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" justifyContent={{ xs: 'space-between', md: 'center' }} gap={1.25}>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <SummaryMetric label="Working" value={group.working} color={toneColor(theme, 'success')} />
            <SummaryMetric label="Against" value={group.against} color={toneColor(theme, 'warning')} />
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AutoGraph />}
            aria-label={`Open ${group.symbol} entry decision`}
            onClick={(event) => {
              event.stopPropagation();
              onViewDetails(primarySignal);
            }}
            sx={{ textTransform: 'none', fontWeight: 750, flex: '0 0 auto' }}
          >
            Entry
          </Button>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              handleToggle();
            }}
            aria-label={open ? `Collapse ${group.symbol} open entry signals` : `Expand ${group.symbol} open entry signals`}
            sx={{ color: 'text.secondaryBright' }}
          >
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ px: { xs: 1.75, md: 2.35 }, pb: { xs: 2, md: 2.5 }, pt: 0.5 }}>
          <TradeStoryPanel
            story={story}
            detailsOpen={detailsOpen}
            onToggleDetails={handleToggleDetails}
            symbol={group.symbol}
          />

          <Collapse in={detailsOpen} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 1.75 }}>
              {setupGroups.map((setup) => (
                <SignalSetupGroup key={setup.key} setup={setup} />
              ))}
            </Box>
          </Collapse>
        </Box>
      </Collapse>
    </Box>
  );
};

const OpenEntrySignals = ({ signals, stories, onViewDetails, isSmallScreen }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const storyBySymbol = useMemo(() => {
    const map = new Map();
    for (const story of stories || []) {
      const symbol = normalizeSymbol(story?.symbol);
      if (symbol) map.set(symbol, story);
    }
    return map;
  }, [stories]);
  const groups = useMemo(
    () => groupOpenSignalsBySymbol(signals).map((group) => ({
      ...group,
      story: storyBySymbol.get(group.symbol) || null,
    })),
    [signals, storyBySymbol]
  );
  if (!signals.length) return null;

  const accent = theme.palette.info.main;
  const handleToggle = () => setOpen((prev) => !prev);

  return (
    <Box sx={{ mt: 3.5 }}>
      <Box
        onClick={handleToggle}
        role="button"
        aria-expanded={open}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
        flexWrap="wrap"
        sx={{
          cursor: 'pointer',
          borderRadius: 'var(--app-radius)',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: alpha('#000', 0.25),
          px: { xs: 1.75, md: 2.25 },
          py: { xs: 1.4, md: 1.65 },
          mb: 1.75,
          transition: 'border-color 160ms ease, background-color 160ms ease',
          '&:hover': {
            borderColor: alpha(accent, 0.7),
            backgroundColor: alpha(accent, 0.08),
          },
        }}
      >
        <Typography
          variant={isSmallScreen ? 'subtitle1' : 'h6'}
          sx={{ fontWeight: 800, color: 'text.primary', pr: 2, lineHeight: 1.25 }}
        >
          Open Entry Signals
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={`${groups.length} ticker${groups.length === 1 ? '' : 's'}`}
            variant="outlined"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              borderColor: alpha(accent, 0.6),
              bgcolor: alpha(accent, 0.12),
            }}
          />
          <Chip size="small" variant="outlined" label={`${signals.length}`} />
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              handleToggle();
            }}
            sx={{ color: 'text.secondaryBright' }}
            aria-label={open ? 'Collapse open entry signals' : 'Expand open entry signals'}
          >
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 1.5 }}>
          {groups.map((group) => (
            <TickerSignalGroup
              key={group.symbol}
              group={group}
              onViewDetails={onViewDetails}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

const NotificationBell = () => {
  const {
    alerts,
    openEntrySignals,
    openEntrySignalStories,
    timestamp,
    clearAlerts,
  } = useContext(AlertsContext);
  const [open, setOpen] = useState(false);
  const [sortOption, setSortOption] = useState('rawPct');
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const alertCount = alerts.length;
  const openSignalCount = openEntrySignals.length;
  const notificationCount = alertCount + openSignalCount;

  const groupedAlerts = useMemo(() => {
    const sorted = [...alerts];
    if (sortOption === 'symbol') sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
    else if (sortOption === 'rawPct') {
      sorted.sort((a, b) => {
        const aRawPct = getBandBreakoutRawPct({
          close: a?.close_price,
          high_price: a?.high_price,
          low_price: a?.low_price,
          lower: a?.bb_lower,
          upper: a?.bb_upper,
          touched_side: a?.touched_side,
        });
        const bRawPct = getBandBreakoutRawPct({
          close: b?.close_price,
          high_price: b?.high_price,
          low_price: b?.low_price,
          lower: b?.bb_lower,
          upper: b?.bb_upper,
          touched_side: b?.touched_side,
        });

        const aRank = typeof aRawPct === 'number' ? aRawPct : Number.NEGATIVE_INFINITY;
        const bRank = typeof bRawPct === 'number' ? bRawPct : Number.NEGATIVE_INFINITY;
        return bRank - aRank;
      });
    }
    else if (sortOption === 'side') sorted.sort((a, b) => a.touched_side.localeCompare(b.touched_side));

    const map = { Upper: [], Lower: [] };
    for (const a of sorted) (a.touched_side === 'Upper' ? map.Upper : map.Lower).push(a);
    return map;
  }, [alerts, sortOption]);

  const sortedOpenEntrySignals = useMemo(() => {
    return [...openEntrySignals].sort((a, b) => {
      const remainingA = Number.isFinite(Number(a.remaining_sessions)) ? Number(a.remaining_sessions) : 999;
      const remainingB = Number.isFinite(Number(b.remaining_sessions)) ? Number(b.remaining_sessions) : 999;
      if (remainingA !== remainingB) return remainingA - remainingB;
      return String(a.symbol || '').localeCompare(String(b.symbol || ''));
    });
  }, [openEntrySignals]);

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleMarkAsRead = () => { clearAlerts(); handleClose(); };
  const handleViewDetailsAndClose = (alert) => {
    const rawSymbol = alert?.symbol || alert?.ticker || '';
    const normalized = typeof rawSymbol === 'string' ? rawSymbol.trim().toUpperCase() : '';
    if (!normalized) return;
    const alertId = alert?._alert_id || `${timestamp || ''}|${normalized}|${alert?.touched_side || ''}`;

    navigate(`/?symbol=${encodeURIComponent(normalized)}`, {
      state: {
        source: 'alert',
        from_alert_id: alertId,
        // Capture ticker_searched after the ticker data loads (not immediately on click).
        capture_ticker_searched: true,
        query: normalized,
        search_started_at: Date.now(),
      },
    });
    handleClose();
  };
  const handleViewEntrySignalAndClose = (signal) => {
    const rawSymbol = signal?.symbol || signal?.ticker || '';
    const normalized = typeof rawSymbol === 'string' ? rawSymbol.trim().toUpperCase() : '';
    if (!normalized) return;

    navigate(`/entry-decision?symbol=${encodeURIComponent(normalized)}`, {
      state: {
        source: 'entry_signal',
        from_signal_id: signal?._signal_id,
        query: normalized,
        search_started_at: Date.now(),
      },
    });
    handleClose();
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        disableElevation
        disableRipple
        aria-label="Open alerts and open entry signals"
        onClick={handleOpen}
        sx={{
          boxShadow: 'none',
          minWidth: 36,
          width: 36,
          height: 36,
          p: 0,
          borderRadius: 'var(--app-radius)',
          transition: 'background-color 150ms ease',
          '&:hover': { boxShadow: 'none' }
        }}
      >
        <Badge
          badgeContent={notificationCount}
          color="secondary"
          sx={{
            '& .MuiBadge-badge': {
              top: 2,
              right: 2,
            },
          }}
        >
          <Notifications sx={{ fontSize: 22 }} />
        </Badge>
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth TransitionComponent={Transition}>
        <DialogTitle
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
            color: '#fff',
            p: { xs: 2, md: 2.35 },
          }}
        >
          {notificationCount > 0 ? 'Alerts & Open Signals' : 'No Current Alerts'}
        </DialogTitle>

        {notificationCount > 0 && (
          <Typography variant="subtitle2" sx={{ ml: 3, mt: 1, color: 'text.secondaryBright' }}>
            Updated at {timestamp}
          </Typography>
        )}

        {/* Use themed dark paper background for readability */}
        <DialogContent dividers sx={{ backgroundColor: 'background.paper', p: { xs: 2, md: 3 } }}>
          {alertCount > 0 && (
            <Box display="flex" justifyContent="flex-end" alignItems="center" sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ width: 150 }}>
                <InputLabel>Sort by</InputLabel>
                <Select value={sortOption} label="Sort by" onChange={(e) => setSortOption(e.target.value)}>
                  <MenuItem value="rawPct">Breakout % (High-Low)</MenuItem>
                  <MenuItem value="symbol">Symbol</MenuItem>
                  <MenuItem value="side">Upper/Lower</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {notificationCount > 0 ? (
            <>
              {alertCount > 0 && (
                <>
                  {groupedAlerts.Upper.length > 0 && (
                    <GroupedAlerts
                      title={`${groupedAlerts.Upper.length} Stocks Crossed Above the Upper Bollinger Band`}
                      alerts={groupedAlerts.Upper}
                      onViewDetails={handleViewDetailsAndClose}
                      isSmallScreen={isSmallScreen}
                      touched_side="Upper"
                    />
                  )}
                  {groupedAlerts.Lower.length > 0 && (
                    <GroupedAlerts
                      title={`${groupedAlerts.Lower.length} Stocks Crossed Below the Lower Bollinger Band`}
                      alerts={groupedAlerts.Lower}
                      onViewDetails={handleViewDetailsAndClose}
                      isSmallScreen={isSmallScreen}
                      touched_side="Lower"
                    />
                  )}
                </>
              )}
              <OpenEntrySignals
                signals={sortedOpenEntrySignals}
                stories={openEntrySignalStories}
                onViewDetails={handleViewEntrySignalAndClose}
                isSmallScreen={isSmallScreen}
              />
            </>
          ) : (
            <Typography variant="body1">
              You are all caught up! No Bollinger crossings detected.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          {notificationCount > 0 && (
            <Button
              onClick={handleMarkAsRead}
              variant="contained"
              color="primary"
              sx={{
                textTransform: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                ':hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.25)' },
              }}
            >
              Mark All as Read
            </Button>
          )}
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationBell;
