import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

const SymbolSearch = ({ onSelectSymbol, placeholder = 'Search for a Stock' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Ref used for debouncing
  const debounceTimer = useRef(null);

  useEffect(() => {
    // If empty, clear suggestions
    if (!searchTerm) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce to avoid spam-calling the API
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchMatches(searchTerm);
    }, 300);

    // Cleanup if component unmounts
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

  // Submitting the form by pressing Enter or button
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    // We pass the typed input upward
    onSelectSymbol(searchTerm.toUpperCase());
    setShowSuggestions(false);
  };

  // Clicking a suggestion from the dropdown
  const handleSelectSuggestion = (selectedSymbol) => {
    onSelectSymbol(selectedSymbol.toUpperCase());
    setSearchTerm(selectedSymbol.toUpperCase());
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
                <ListItem
                  button
                  key={idx}
                  onClick={() => handleSelectSuggestion(symbolMatch)}
                >
                  <ListItemText
                    primary={symbolMatch}
                    secondary={companyName}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}
      <Button
        fullWidth
        type="submit"
        variant="contained"
        sx={{ mt: 2 }}
      >
        Search
      </Button>
    </Box>
  );
};

export default SymbolSearch;
