import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { fetchWorldMarketMoves } from '../API/StockService';
import worldMap from '../Picture/2D WorldMap.png';

const MAP_VIEWBOX = { width: 1536, height: 1024 };
const MAP_PADDING = { x: 0, y: 0 };

const MARKET_MARKERS = [
  { id: 'CADOW', label: 'CADOW', lat: 30.65, lon: -90.38, offsetX: -42, offsetY: -18 },
  { id: 'DOW', label: 'DOW', lat: 25.71, lon: -84.0, offsetX: 24, offsetY: 10 },
  { id: 'MXDOW', label: 'MXDOW', lat: 12.43, lon: -99.13, offsetX: 10, offsetY: 32 },
  { id: 'FTSE', label: 'FTSE', lat: 51.5, lon: -0.12, offsetX: 20, offsetY: -26 },
  { id: 'FRDOW', label: 'FRDOW', lat: 48.86, lon: 2.35, offsetX: 44, offsetY: 8 },
  { id: 'DEDOW', label: 'DEDOW', lat: 50.11, lon: 8.68, offsetX: 78, offsetY: 6 },
  { id: 'ESDOW', label: 'ESDOW', lat: 40.42, lon: -3.7, offsetX: 12, offsetY: 36 },
  { id: 'ITDOW', label: 'ITDOW', lat: 45.46, lon: 9.19, offsetX: 92, offsetY: 34 },
  { id: 'HKDOW', label: 'HKDOW', lat: 5.32, lon: 114.17, offsetX: -28, offsetY: -18 },
  { id: 'N225', label: 'N225', lat: 12.69, lon: 120.69, offsetX: 42, offsetY: -18 },
  { id: 'SGDOW', label: 'SGDOW', lat: 1.35, lon: 103.82, offsetX: -8, offsetY: 30 },
  { id: 'DJAU', label: 'DJAU', lat: -25.87, lon: 131.21, offsetX: -34, offsetY: 20 },
  { id: 'NZDOW', label: 'NZDOW', lat: -41.29, lon: 174.78, offsetX: -48, offsetY: 30 },
];

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return '--';
  const normalized = Math.abs(value) < 0.005 ? 0 : value;
  const sign = normalized > 0 ? '+' : '';
  return `${sign}${normalized.toFixed(2)}%`;
};

const projectToMap = (lon, lat) => {
  const innerWidth = MAP_VIEWBOX.width * (1 - MAP_PADDING.x * 2);
  const innerHeight = MAP_VIEWBOX.height * (1 - MAP_PADDING.y * 2);
  const x = ((lon + 180) / 360) * innerWidth + MAP_VIEWBOX.width * MAP_PADDING.x;
  const y = ((90 - lat) / 180) * innerHeight + MAP_VIEWBOX.height * MAP_PADDING.y;
  return { x, y };
};

const WorldMapImage = () => (
  <Box
    component="img"
    src={worldMap}
    alt=""
    sx={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: 0.94,
      zIndex: 0,
      pointerEvents: 'none',
    }}
  />
);

const WorldMarketMap = ({ summaryError }) => {
  const theme = useTheme();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout;

    const loadSnapshot = async () => {
      let pending = false;
      try {
        const payload = await fetchWorldMarketMoves();
        if (!isMounted) return;
        pending = payload?.status === 'pending';
        if (pending) {
          const retryMs = Math.max(
            500,
            Number(payload?.retry_after_seconds || 1) * 1000
          );
          setFetchError(null);
          setLoading(true);
          clearTimeout(retryTimeout);
          retryTimeout = setTimeout(() => {
            if (isMounted) loadSnapshot();
          }, retryMs);
          return;
        }
        setSnapshot(payload);
        setFetchError(null);
      } catch (error) {
        if (!isMounted) return;
        setFetchError(error?.message || 'Market data unavailable');
      } finally {
        if (isMounted && !pending) setLoading(false);
      }
    };

    loadSnapshot();
    const interval = setInterval(loadSnapshot, 300000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(retryTimeout);
    };
  }, []);

  const marketLookup = useMemo(() => {
    const map = {};
    (snapshot?.markets || []).forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [snapshot]);

  const projectedMarkers = useMemo(
    () =>
      MARKET_MARKERS.map((marker) => {
        const { x, y } = projectToMap(marker.lon, marker.lat);
        return {
          ...marker,
          left: `${(x / MAP_VIEWBOX.width) * 100}%`,
          top: `${(y / MAP_VIEWBOX.height) * 100}%`,
        };
      }),
    []
  );

  const asOfLabel = useMemo(() => {
    if (!snapshot?.as_of) return 'As of --';
    const parsed = new Date(snapshot.as_of);
    if (Number.isNaN(parsed.getTime())) return 'As of --';
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    });
    const parts = formatter.formatToParts(parsed);
    const get = (type) => parts.find((part) => part.type === type)?.value;
    const dayPeriod = get('dayPeriod')?.toLowerCase() || '';
    const periodLabel = dayPeriod === 'am' ? 'a.m.' : dayPeriod === 'pm' ? 'p.m.' : '';
    const month = get('month');
    const day = get('day');
    const year = get('year');
    const hour = get('hour');
    const minute = get('minute');
    const formatted = `${month} ${day} ${year} ${hour}:${minute} ${periodLabel}`.trim();
    return `As of ${formatted} ET`;
  }, [snapshot?.as_of]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'stretch',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 0,
          borderRadius: 0,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #111722 0%, #0b1018 60%, #0a0f16 100%)',
          boxShadow: 'none',
        }}
      >
        <WorldMapImage />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              `linear-gradient(180deg, ${alpha(
                theme.palette.background.header,
                0.9
              )} 0%, rgba(0,0,0,0) 20%), linear-gradient(90deg, ${alpha(
                theme.palette.background.header,
                0.9
              )} 0%, rgba(0,0,0,0) 16%), radial-gradient(circle at 50% 40%, rgba(255,255,255,0.08), transparent 58%)`,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {projectedMarkers.map((marker) => {
          const market = marketLookup[marker.id];
          const value = market?.percent_change;
          const normalizedValue =
            Number.isFinite(value) && Math.abs(value) < 0.005 ? 0 : value;
          const isPositive = Number.isFinite(normalizedValue) && normalizedValue >= 0;
          const background = !Number.isFinite(normalizedValue)
            ? '#2f2f2f'
            : isPositive
            ? '#6bd36b'
            : '#f24a4a';
          const textColor = !Number.isFinite(normalizedValue) ? '#d2d2d2' : '#0b0b0b';
          const hoverBoost = marker.id === 'FRDOW';

          return (
            <Box
              key={marker.id}
              sx={{
                position: 'absolute',
                left: marker.left,
                top: marker.top,
                transform: `translate(-50%, -50%) translate(${marker.offsetX || 0}px, ${
                  marker.offsetY || 0
                }px)`,
                minWidth: { xs: 82, md: 110 },
                padding: { xs: '8px 14px', md: '10px 18px' },
                borderRadius: { xs: 18, md: 24 },
                textAlign: 'center',
                background,
                color: textColor,
                boxShadow: '0 12px 26px rgba(0,0,0,0.6)',
                border: '1px solid rgba(0,0,0,0.22)',
                fontWeight: 700,
                zIndex: 2,
                cursor: hoverBoost ? 'pointer' : 'default',
                ...(hoverBoost && {
                  '&:hover': {
                    zIndex: 5,
                  },
                }),
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '0.8rem', md: '1.02rem' },
                  lineHeight: 1.1,
                  letterSpacing: '0.02em',
                }}
              >
                {marker.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '0.76rem', md: '0.94rem' },
                  lineHeight: 1.1,
                }}
              >
                {formatPercent(normalizedValue)}
              </Typography>
            </Box>
          );
        })}

        <Box
          sx={{
            position: 'absolute',
            left: { xs: 12, md: 18 },
            bottom: { xs: 10, md: 16 },
            color: alpha(theme.palette.common.white, 0.6),
            fontSize: { xs: '0.7rem', md: '0.82rem' },
            letterSpacing: '0.04em',
            zIndex: 2,
          }}
        >
          {asOfLabel}
        </Box>

        {loading && (
          <Box
            sx={{
              position: 'absolute',
              right: { xs: 12, md: 18 },
              top: { xs: 10, md: 16 },
              color: alpha(theme.palette.common.white, 0.55),
              fontSize: { xs: '0.7rem', md: '0.8rem' },
              zIndex: 2,
            }}
          >
            Loading markets...
          </Box>
        )}

        {!loading && fetchError && (
          <Box
            sx={{
              position: 'absolute',
              right: { xs: 12, md: 18 },
              top: { xs: 10, md: 16 },
              color: theme.palette.error.main,
              fontSize: { xs: '0.7rem', md: '0.8rem' },
              zIndex: 2,
            }}
          >
            Market data unavailable
          </Box>
        )}
      </Box>

      {summaryError && (
        <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
          {summaryError}
        </Typography>
      )}
    </Box>
  );
};

export default WorldMarketMap;
