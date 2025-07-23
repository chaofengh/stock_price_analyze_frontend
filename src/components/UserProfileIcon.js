import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { logout } from './Redux/authSlice';
import AuthDialog from './AuthDialog';
import { stringToHslColor } from '../utils/stringToColor';

function UserProfileIcon() {
  const theme = useTheme();
  const neon   = theme.palette.primary.main;              // #00B8FF etc.

  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((s) => s.auth);

  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const isLoggedIn = Boolean(accessToken);

  /* ───────── handlers ───────── */
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleDialogOpen = (mode) => { setAuthMode(mode); setOpenDialog(true); };
  const handleLogout = () => { dispatch(logout()); handleMenuClose(); };

  /* ───────── avatar colour/letter for logged‑in users ───────── */
  let avatarColor  = neon;
  let avatarLetter = '?';
  if (user?.email) {
    avatarColor  = stringToHslColor(user.email, 70, 45);
    avatarLetter = user.email.charAt(0).toUpperCase();
  }

  return (
    <>
      {/* ================= Logged‑in ================= */}
      {isLoggedIn ? (
        <>
          <Button
            variant="contained"
            color="primary"
            disableElevation
            onClick={handleMenuOpen}
            sx={{
              minWidth: 40,
              p: 0.5,
              boxShadow: 'none',
              transition: 'transform 0.2s',
              '&:hover': { boxShadow: 'none', transform: 'scale(1.05)' },
            }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: 'inherit',
                border: `2px solid ${neon}`,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {avatarLetter}
            </Avatar>
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <MenuItem onClick={() => alert('Profile clicked')}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </>
      ) : (
        /* ================= Logged‑out ================= */
        <>
          <Button
            variant="contained"
            color="primary"
            disableElevation
            onClick={() => handleDialogOpen('login')}
            sx={{
              minWidth: 40,
              p: 0.5,
              boxShadow: 'none',
              transition: 'transform 0.2s',
              '&:hover': { boxShadow: 'none', transform: 'scale(1.05)' },
            }}
          >
            <AccountCircleIcon sx={{ fontSize: 30, color: '#fff' }} />
          </Button>
        </>
      )}

      {/* =============== Auth Dialog =============== */}
      <AuthDialog
        open={openDialog}
        mode={authMode}
        onClose={() => setOpenDialog(false)}
        onSwitchMode={(m) => setAuthMode(m)}
      />
    </>
  );
}

export default UserProfileIcon;
