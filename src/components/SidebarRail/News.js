// News.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNews } from '../Redux/newsSlice';

// MUI
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Link,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, alpha } from '@mui/material/styles';

function News() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { articles, status, error } = useSelector((state) => state.news);

  useEffect(() => {
    dispatch(fetchNews());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchNews());
  };

  if (status === 'loading') {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading news...
      </Typography>
    );
  }

  if (status === 'failed') {
    return (
      <Typography variant="body2" color="error.main">
        Error fetching news: {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ position: 'relative', zIndex: 2 }}>
      {/* Container */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 'var(--app-radius)',
          bgcolor: 'background.paper',
          borderColor: 'divider',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="h6"
            sx={{ color: 'text.primary', mr: 1, flexGrow: 1 }}
          >
            Latest News
          </Typography>
          <IconButton
            onClick={handleRefresh}
            aria-label="refresh"
            color="primary"
            size="small"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2, borderColor: 'divider' }} />

        {/* Articles */}
        {(articles || []).map((article, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 'var(--app-radius)',
              bgcolor: 'background.paper',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}
            >
              {article.headline}
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondaryBright || 'text.secondary' }}
            >
              {article.summary}
            </Typography>

            {article.image && (
              <Box
                component="img"
                src={article.image}
                alt={article.headline}
                sx={{
                  maxWidth: 240,
                  display: 'block',
                  mt: 2,
                  mb: 2,
                  borderRadius: 'var(--app-radius)',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: alpha(theme.palette.common.black, 0.06),
                }}
              />
            )}

            <Link
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ color: 'primary.main', fontWeight: 600 }}
            >
              Read more
            </Link>
          </Paper>
        ))}
      </Paper>
    </Box>
  );
}

export default News;
