// src/components/MoreOptionsMenu.js
import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';

// MUI icons
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArticleIcon from '@mui/icons-material/Article'; // <-- Add this

function MoreOptionsMenu({ onSelectView }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (view) => {
    if (view) onSelectView(view);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="contained"
        disableElevation
        sx={{
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        }}
        onClick={handleMenuOpen}
      >
        <MoreVertIcon />
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleMenuClose(null)}
        keepMounted
        PaperProps={{
          elevation: 0,
          sx: { boxShadow: 'none' }
        }}
      >
        <MenuItem onClick={() => handleMenuClose('OptionPriceRatio')}>
          <ListItemIcon>
            <TrendingUpIcon />
          </ListItemIcon>
          Option Price Ratio
        </MenuItem>

        <MenuItem onClick={() => handleMenuClose('WatchList')}>
          <ListItemIcon>
            <VisibilityIcon />
          </ListItemIcon>
          Watch List
        </MenuItem>

        {/* New News Menu Item */}
        <MenuItem onClick={() => handleMenuClose('News')}>
          <ListItemIcon>
            <ArticleIcon />
          </ListItemIcon>
          News
        </MenuItem>
      </Menu>
    </>
  );
}

export default MoreOptionsMenu;
