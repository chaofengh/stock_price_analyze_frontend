import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';

// MUI icons:
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';

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
      {/* Replace text with icon */}
      <Button variant="contained" onClick={handleMenuOpen}>
        <MoreVertIcon />
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleMenuClose(null)}
        keepMounted
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
      </Menu>
    </>
  );
}

export default MoreOptionsMenu;
