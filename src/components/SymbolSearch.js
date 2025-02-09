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
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm]);

  const fetchMatches = async (query) => {
    try {
      const apiKey = process.env.REACT_APP_Alpha_Vantage_API_Key;
      const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.bestMatches) {
        setSearchResults(data.bestMatches);
        setShowSuggestions(true);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error fetching from Alpha Vantage:', err);
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
    setSearchTerm(''); // Clear the text field after selection
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
            {searchResults.map((item, idx) => {
              const symbolMatch = item['1. symbol'];
              const companyName = item['2. name'];
              return (
                <ListItem key={idx} disablePadding>
                  <ListItemButton onClick={() => handleSelectSuggestion(symbolMatch)}>
                    <ListItemText primary={symbolMatch} secondary={companyName} />
                  </ListItemButton>
                </ListItem>
              );
            })}
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
