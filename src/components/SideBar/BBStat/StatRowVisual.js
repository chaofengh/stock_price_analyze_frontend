import React from 'react';
import {
  Box,
  Typography,
  Tooltip,
  CircularProgress,
  LinearProgress,
  useTheme,
} from '@mui/material';

/* — donut ring (~56 px) — */
const Donut = ({ value = 0, color }) => (
  <Box sx={{ position: 'relative', width: 56, height: 56 }}>
    <CircularProgress
      variant="determinate"
      value={Math.max(0, Math.min(100, value))}
      size={56}
      thickness={5}
      sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        fontSize: '0.8rem',
        fontWeight: 700,
      }}
    >
      {`${Math.round(value)}%`}
    </Box>
  </Box>
);

const DonutPair = ({ sRaw, mRaw }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        justifyContent: 'center',
        width: '100%',
        maxWidth: 180,
        flexWrap: 'wrap',
      }}
    >
      <Donut value={sRaw} color={theme.palette.primary.main} />
      <Donut value={mRaw} color={theme.palette.secondary.main} />
    </Box>
  );
};

/* — vertical bars (Expected Return) — */
const VerticalPair = ({ sRaw, mRaw, sVal, mVal }) => {
  const theme = useTheme();
  const maxAbs = Math.max(Math.abs(sRaw), Math.abs(mRaw)) || 1;
  const toPct = v => (Math.abs(v) / maxAbs) * 100;

  const bars = [
    { raw: sRaw, txt: sVal, col: theme.palette.primary.main },
    { raw: mRaw, txt: mVal, col: theme.palette.secondary.main },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 3,
        alignItems: 'flex-end',
        height: 72,
        width: '100%',
        justifyContent: 'center', // <-- center the bars horizontally
        maxWidth: 180, // keep original sizing constraint if needed
        boxSizing: 'border-box',
      }}
    >
      {bars.map(({ raw, txt, col }, idx) => (
        <Box
          key={idx}
          sx={{
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <Box
            sx={{
              width: 24,
              height: `${toPct(raw)}%`,
              backgroundColor: col,
              borderRadius: 1,
              minHeight: 2, // keeps a zero-value bar visible
              marginX: 'auto',
            }}
          />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mt: 0.5 }}>
            {txt}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};


/* — linear bars (Exit Day) — */
const LinearPair = ({ sRaw, mRaw, sVal, mVal }) => {
  const theme = useTheme();
  const max = Math.max(Math.abs(sRaw), Math.abs(mRaw)) || 1;
  const toPct = v => (Math.abs(v) / max) * 100;

  const rows = [
    { raw: sRaw, txt: sVal, col: theme.palette.primary.main },
    { raw: mRaw, txt: mVal, col: theme.palette.secondary.main },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        width: '100%',
        maxWidth: 180,
      }}
    >
      {rows.map(({ raw, txt, col }, idx) => (
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={toPct(raw)}
            sx={{
              flex: 1,
              height: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(255,255,255,0.12)',
              '& .MuiLinearProgress-bar': { backgroundColor: col },
            }}
          />
          <Typography
            sx={{ fontWeight: 600, fontSize: '0.8rem', minWidth: 36, textAlign: 'right' }}
          >
            {txt}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

/* — single bar (Entry Opportunities) — */
const SingleBar = ({ sRaw, sVal }) => {
  const theme = useTheme();

  // Empty bar if no opportunities, full bar otherwise
  const pct =
    sRaw === null || sRaw === undefined || isNaN(sRaw) || Number(sRaw) === 0
      ? 0
      : 100;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        width: '100%',
        maxWidth: 180,
      }}
    >
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          flex: 1,
          height: 10,
          borderRadius: 5,
          backgroundColor: 'rgba(255,255,255,0.12)',
          '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.warning.main },
        }}
      />
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '0.8rem',
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {sVal}
      </Typography>
    </Box>
  );
};


/* — visual router — */
const VisualCell = ({ kind, ...rest }) => {
  switch (kind) {
    case 'donut':
      return <DonutPair {...rest} />;
    case 'vbar':
      return <VerticalPair {...rest} />;
    case 'single':
      return <SingleBar {...rest} />;
    case 'bar':
    default:
      return <LinearPair {...rest} />;
  }
};

/* — row wrapper — */
const StatRowVisual = ({
  label,
  hint,
  sVal,
  mVal,
  sRaw,
  mRaw,
  visual,
}) => (
  <Tooltip title={hint} placement="right-start" arrow>
    <Box
      sx={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'minmax(110px, 1fr) minmax(140px, 180px)',
        alignItems: 'center',
        height: 96,
        px: 1,
        fontSize: 14,
        overflow: 'hidden',
        cursor: 'default',
        '&:before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(0,123,255,0.16), rgba(0,0,0,0))',
          transform: 'translateX(-100%)',
          transition: 'transform 0.35s',
        },
        '&:hover:before': { transform: 'translateX(0)' },
      }}
    >
      {/* label */}
      <Typography sx={{ fontWeight: 700, pr: 2 }}>{label}</Typography>

      {/* visual block */}
      <VisualCell
        kind={visual}
        sRaw={sRaw}
        mRaw={mRaw}
        sVal={sVal}
        mVal={mVal}
      />
    </Box>
  </Tooltip>
);

export default StatRowVisual;
