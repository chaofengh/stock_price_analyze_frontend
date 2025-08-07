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

const SymbolSearch = ({ onSelectSymbol, placeholder = 'Search symbol…' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);

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
    try {
      const apiKey = process.env.REACT_APP_Finnhub_API_Key;
      const res = await fetch(
        `https://finnhub.io/api/v1/search?q=${query}&token=${apiKey}&exchange=US`
      );
      const data = await res.json();
      setSearchResults(data.result || []);
      setShowSuggestions(Boolean(data.result?.length));
    } catch (err) {
      console.error('Finnhub search error:', err);
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  /* ───────── Submit & select ───────── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    onSelectSymbol(searchTerm.toUpperCase());
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleSelect = (sym) => {
    onSelectSymbol(sym.toUpperCase());
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
