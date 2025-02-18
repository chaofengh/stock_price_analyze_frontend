import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';

const SymbolSearch = ({ onSelectSymbol, placeholder = 'Search for a Stock' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchMatches(searchTerm);
    }, 200);

    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm]);

  const fetchMatches = async (query) => {
    try {
      const apiKey = process.env.REACT_APP_Finnhub_API_Key;
      const response = await fetch(`https://finnhub.io/api/v1/search?q=${query}&token=${apiKey}&exchange=US`);
      const data = await response.json();

      if (data.result) {
        setSearchResults(data.result);
        setShowSuggestions(true);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error fetching from Finnhub:', err);
      setSearchResults([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    onSelectSymbol(searchTerm.toUpperCase());
    setShowSuggestions(false);
    setSearchTerm(''); // Clear the text field after submission
  };

  const handleSelectSuggestion = (selectedSymbol) => {
    onSelectSymbol(selectedSymbol.toUpperCase());
    setSearchTerm(''); // Clear the text field
    setShowSuggestions(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3, position: 'relative' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => {
          if (searchResults.length > 0) {
            setShowSuggestions(true);
          }
        }}
      />

      {showSuggestions && searchResults.length > 0 && (
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
            {searchResults.map((item, idx) => (
              <ListItem key={idx} disablePadding>
                <ListItemButton onClick={() => handleSelectSuggestion(item.symbol)}>
                  <ListItemText
                    primary={item.symbol}
                    secondary={item.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Button fullWidth type="submit" variant="contained" sx={{ mt: 2 }}>
        Search
      </Button>
    </Box>
  );
};

export default SymbolSearch;
