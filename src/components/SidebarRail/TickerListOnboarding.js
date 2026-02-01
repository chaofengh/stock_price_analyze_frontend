import React from 'react';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';

const STARTER_TICKERS = ['TSLA', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'META', 'PLTR', 'QQQ'];

function WatchlistHeroGraphic({ variant = 'locked' }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: 168,
        height: 168,
        borderRadius: 'var(--app-radius)',
        position: 'relative',
        overflow: 'hidden',
        background: `radial-gradient(120px 120px at 30% 30%, ${alpha(
          theme.palette.primary.main,
          0.45
        )}, transparent 60%),
          radial-gradient(120px 120px at 70% 70%, ${alpha(
            theme.palette.secondary.main,
            0.3
          )}, transparent 60%),
          ${alpha(theme.palette.common.white, 0.04)}`,
        border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: -60,
          background: `conic-gradient(from 180deg, ${alpha(
            theme.palette.primary.main,
            0.35
          )}, ${alpha(theme.palette.secondary.main, 0.45)}, ${alpha(
            theme.palette.primary.main,
            0.35
          )})`,
          filter: 'blur(22px)',
          opacity: 0.32,
          animation: 'breatheGlow 3.6s ease-in-out infinite',
          '@keyframes breatheGlow': {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.28 },
            '50%': { transform: 'scale(1.04)', opacity: 0.42 },
          },
        }}
      />

      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: -80,
          background: `linear-gradient(120deg, transparent 40%, ${alpha(
            theme.palette.common.white,
            0.16
          )} 50%, transparent 60%)`,
          transform: 'translateX(-55%)',
          animation: 'glintSweep 1200ms ease-out 220ms both',
          '@keyframes glintSweep': {
            '0%': { transform: 'translateX(-55%)' },
            '100%': { transform: 'translateX(55%)' },
          },
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.common.white,
              0.16
            )}, ${alpha(theme.palette.common.white, 0.06)})`,
            border: `1px solid ${alpha(theme.palette.common.white, 0.16)}`,
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
          }}
        >
          {variant === 'locked' ? (
            <LockRoundedIcon sx={{ fontSize: 36, color: theme.palette.common.white }} />
          ) : (
            <EmojiEventsRoundedIcon sx={{ fontSize: 38, color: theme.palette.common.white }} />
          )}
          <AutoAwesomeRoundedIcon
            sx={{
              position: 'absolute',
              top: 10,
              right: 12,
              fontSize: 18,
              color: alpha(theme.palette.common.white, 0.85),
              animation: 'twinkle 2.8s ease-in-out infinite',
              '@keyframes twinkle': {
                '0%, 100%': { transform: 'scale(1)', opacity: 0.35 },
                '50%': { transform: 'scale(1.12)', opacity: 0.85 },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

function QuestLine({ done, label }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={(theme) => ({
          width: 10,
          height: 10,
          borderRadius: 999,
          bgcolor: done ? theme.palette.success.main : alpha(theme.palette.common.white, 0.25),
          boxShadow: done ? `0 0 0 4px ${alpha(theme.palette.success.main, 0.15)}` : 'none',
        })}
      />
      <Typography
        variant="body2"
        sx={(theme) => ({
          color: done ? theme.palette.text.primary : theme.palette.text.secondary,
          fontWeight: done ? 700 : 600,
        })}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function LoggedOutView({ onRegister, onLogin }) {
  const theme = useTheme();

  return (
    <Stack
      spacing={2.5}
      sx={{
        position: 'relative',
        height: '100%',
        animation: 'treasureReveal 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        '@keyframes treasureReveal': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0px)' },
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 'var(--app-radius)',
          bgcolor: alpha(theme.palette.warning.main, 0.05),
          borderColor: alpha(theme.palette.warning.main, 0.18),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: -140,
            background: `radial-gradient(180px 180px at 30% 20%, ${alpha(
              theme.palette.warning.main,
              0.16
            )}, transparent 60%),
              radial-gradient(220px 220px at 70% 80%, ${alpha(
                theme.palette.secondary.main,
                0.12
              )}, transparent 60%)`,
            filter: 'blur(14px)',
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ position: 'relative' }}
        >
          <WatchlistHeroGraphic />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', fontWeight: 900, letterSpacing: 0.8 }}
            >
              Your watch list
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 0.2, mt: 0.25 }}>
              Let's save your picks
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, maxWidth: 520 }}>
              Sign in to keep your tickers in one place, synced across devices, and ready whenever you are.
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 2 }}>
              <QuestLine done={false} label="Create your free account" />
              <QuestLine done={false} label="Add your first ticker" />
              <QuestLine done={false} label="Come back anytime - we'll remember" />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2.25 }}>
              <Button
                variant="contained"
                onClick={() => onRegister?.()}
                startIcon={<PersonAddAltRoundedIcon />}
                sx={{ fontWeight: 900 }}
              >
                Create account
              </Button>
              <Button
                variant="outlined"
                onClick={() => onLogin?.()}
                startIcon={<LoginRoundedIcon />}
                sx={{ fontWeight: 800 }}
              >
                Sign in
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}

function WatchlistQuestCard({ rowsCount, questProgress, onSuggestionClick, mutating }) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 'var(--app-radius)',
        bgcolor: alpha(theme.palette.common.white, 0.03),
        borderColor: alpha(theme.palette.common.white, 0.1),
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <EmojiEventsRoundedIcon sx={{ color: theme.palette.secondary.main }} />
            <Typography sx={{ fontWeight: 900 }}>Quest: Build your watch list</Typography>
          </Stack>
          <Chip
            size="small"
            icon={<AutoAwesomeRoundedIcon />}
            label={`${rowsCount}/5`}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
              color: theme.palette.text.primary,
              fontWeight: 900,
            }}
          />
        </Stack>

        <Stack spacing={0.75}>
          <QuestLine done={rowsCount >= 1} label="Add your first ticker" />
          <QuestLine done={rowsCount >= 3} label="Add 3 tickers" />
          <QuestLine done={rowsCount >= 5} label="Add 5 tickers" />
        </Stack>

        <LinearProgress
          variant="determinate"
          value={questProgress}
          sx={{
            height: 10,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.common.white, 0.08),
            '& .MuiLinearProgress-bar': {
              borderRadius: 999,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
          }}
        />

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }} useFlexGap>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800 }}>
            Starter picks:
          </Typography>
          {STARTER_TICKERS.map((symbol) => (
            <Chip
              key={symbol}
              label={symbol}
              size="small"
              onClick={() => onSuggestionClick?.(symbol)}
              disabled={mutating}
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.06),
                fontWeight: 900,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
              }}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

export { LoggedOutView, WatchlistQuestCard };
