import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './Redux/authSlice';
import AuthDialog from './AuthDialog';

function UserProfileIcon() {
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.auth);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const isLoggedIn = Boolean(accessToken);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleDialogOpen = (mode) => {
    setAuthMode(mode);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
  };

  return (
    <>
      {isLoggedIn ? (
        <>
          {/* Logged in: show a badge & a menu */}
          <IconButton color="inherit" onClick={handleMenuOpen} sx={{ p: 0.5 }}>
            <Badge color="success" variant="dot">
              <AccountCircleIcon sx={{ fontSize: 30 }} />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => alert('Profile clicked')}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </>
      ) : (
        <>
          {/* Not logged in: different badge/color/icon */}
          <IconButton
            color="inherit"
            onClick={() => handleDialogOpen('login')}
            sx={{ p: 0.5 }}
          >
            <Badge color="error" variant="dot">
              <AccountCircleIcon sx={{ fontSize: 30 }} />
            </Badge>
          </IconButton>
        </>
      )}

      {/* Separate dialog component for login/register */}
      <AuthDialog
        open={openDialog}
        mode={authMode}
        onClose={handleDialogClose}
        onSwitchMode={(newMode) => setAuthMode(newMode)}
      />
    </>
  );
}

export default UserProfileIcon;
