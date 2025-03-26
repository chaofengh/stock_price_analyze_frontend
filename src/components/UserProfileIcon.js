import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { logout } from './Redux/authSlice';
import AuthDialog from './AuthDialog';
import { stringToHslColor } from '../utils/stringToColor'; // wherever you placed the utility

function UserProfileIcon() {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state) => state.auth);

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

  // For logged-in users, generate a color from their email
  let avatarColor = '#999'; // fallback color
  let avatarLetter = '?';   // fallback letter

  if (user?.email) {
    avatarColor = stringToHslColor(user.email, 70, 50);
    avatarLetter = user.email.charAt(0).toUpperCase();
  }

  return (
    <>
      {isLoggedIn ? (
        <>
          <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
            <Avatar sx={{ bgcolor: avatarColor }}>
              {avatarLetter}
            </Avatar>
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
          {/* Logged out: show a neutral avatar with '?' */}
          <IconButton onClick={() => handleDialogOpen('login')} sx={{ p: 0.5 }}>
            <Avatar sx={{ bgcolor: '#555' }}>?</Avatar>
          </IconButton>
        </>
      )}

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
