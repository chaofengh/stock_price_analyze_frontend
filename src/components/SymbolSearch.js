// SymbolSearch.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { usePostHog } from 'posthog-js/react';

const SymbolSearch = ({ onSelectSymbol, placeholder = 'Search symbol…', source = 'navbar' }) => {
  const posthog = usePostHog();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);
  const lastSearchMetaRef = useRef({ query: '', latencyMs: null, resultsCount: 0 });

  const nowMs = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

  /* ───────── Debounced search ───────── */
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchMatches(searchTerm), 200);
    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm]);

  const fetchMatches = async (query) => {
    const startedAt = nowMs();
    try {
      const apiKey = process.env.REACT_APP_Finnhub_API_Key;
      const res = await fetch(
        `https://finnhub.io/api/v1/search?q=${query}&token=${apiKey}&exchange=US`
      );
      const data = await res.json();
      const results = Array.isArray(data?.result) ? data.result : [];
      const latencyMs = Math.round(nowMs() - startedAt);
      lastSearchMetaRef.current = { query, latencyMs, resultsCount: results.length };
      setSearchResults(results);
      setShowSuggestions(Boolean(results.length));
    } catch (err) {
      console.error('Finnhub search error:', err);
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  /* ───────── Submit & select ───────── */
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    const normalized = trimmed.toUpperCase();
    const lastMeta = lastSearchMetaRef.current;
    const metaMatches =
      lastMeta?.query?.trim?.().toLowerCase?.() === trimmed.toLowerCase();
    const resultsCount = metaMatches ? lastMeta.resultsCount : searchResults.length;
    const latencyMs = metaMatches ? lastMeta.latencyMs : null;

    posthog?.capture('ticker_searched', {
      query: trimmed,
      symbol_normalized: normalized,
      source,
      results_count: Number.isFinite(resultsCount) ? resultsCount : 0,
      latency_ms: Number.isFinite(latencyMs) ? latencyMs : null,
    });

    onSelectSymbol(normalized);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleSelect = (sym) => {
    const trimmed = searchTerm.trim();
    const normalized = sym?.trim?.().toUpperCase?.() || '';
    if (normalized) {
      const lastMeta = lastSearchMetaRef.current;
      const metaMatches = lastMeta?.query?.trim?.().toLowerCase?.() === trimmed.toLowerCase();
      const resultsCount = metaMatches ? lastMeta.resultsCount : searchResults.length;
      const latencyMs = metaMatches ? lastMeta.latencyMs : null;

      posthog?.capture('ticker_searched', {
        query: trimmed || normalized,
        symbol_normalized: normalized,
        source,
        results_count: Number.isFinite(resultsCount) ? resultsCount : 0,
        latency_ms: Number.isFinite(latencyMs) ? latencyMs : null,
      });
    }

    onSelectSymbol(normalized);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  /* ───────── Render ───────── */
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => showSuggestions && setShowSuggestions(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            </InputAdornment>
          ),
          sx: {
            height: 40,                               // total field height
            '& .MuiInputBase-input': { py: 0.5 }      // trim vertical padding
          }
        }}
      />

      {showSuggestions && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            zIndex: 10,
            width: '100%',
            mt: 1,
            maxHeight: 300,
            overflowY: 'auto'
          }}
        >
          <List dense>
            {searchResults.map((item) => (
              <ListItem key={item.symbol} disablePadding>
                <ListItemButton onClick={() => handleSelect(item.symbol)}>
                  <ListItemText primary={item.symbol} secondary={item.description} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default SymbolSearch;
