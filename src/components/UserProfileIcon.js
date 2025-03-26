import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { logout } from './Redux/authSlice';
import AuthDialog from './AuthDialog';
import { stringToHslColor } from '../utils/stringToColor'; // or wherever you keep this helper

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

  // For logged-in users, generate a color from their email and the first letter
  let avatarColor = '#999'; 
  let avatarLetter = '?';
  if (user?.email) {
    avatarColor = stringToHslColor(user.email, 70, 50);
    avatarLetter = user.email.charAt(0).toUpperCase();
  }

  return (
    <>
      {isLoggedIn ? (
        <>
          {/* If logged in, show an Avatar with color-coded background + first letter */}
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
          {/* If not logged in, show the original AccountCircleIcon */}
          <IconButton
            onClick={() => handleDialogOpen('login')}
            sx={{ p: 0.5 }}
          >
             <AccountCircleIcon sx={{ fontSize: 30, color: 'white' }} />
          </IconButton>
        </>
      )}

      {/* The dialog for login/register */}
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
