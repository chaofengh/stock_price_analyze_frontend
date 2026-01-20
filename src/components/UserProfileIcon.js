import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
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
  const displayName = isLoggedIn
    ? user?.name || user?.fullName || user?.username || user?.email || 'User'
    : 'Sign in';
  const displayPlan = isLoggedIn ? user?.plan || 'Member' : 'Create account';

  /* ───────── handlers ───────── */
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleDialogOpen = (mode) => { setAuthMode(mode); setOpenDialog(true); };
  const handleLogout = () => { dispatch(logout()); handleMenuClose(); };

  useEffect(() => {
    const onOpenAuth = (event) => {
      const mode = event?.detail?.mode;
      setAuthMode(mode === 'register' ? 'register' : 'login');
      setOpenDialog(true);
    };
    window.addEventListener('auth:open', onOpenAuth);
    return () => window.removeEventListener('auth:open', onOpenAuth);
  }, []);

  /* ───────── avatar colour/letter for logged‑in users ───────── */
  let avatarColor  = neon;
  let avatarLetter = displayName?.charAt(0)?.toUpperCase() || '?';
  if (user?.email) {
    avatarColor  = stringToHslColor(user.email, 70, 45);
    avatarLetter = user.email.charAt(0).toUpperCase();
  }

  const buttonSx = {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    px: 0.75,
    py: 0.25,
    minHeight: 36,
    borderRadius: 'var(--app-radius)',
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.palette.text.primary,
    transition: 'background-color 150ms ease, border-color 150ms ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.06),
    },
    '&:focus-visible': {
      outline: `2px solid ${alpha(theme.palette.primary.main, 0.6)}`,
      outlineOffset: 2,
    },
  };

  const profileButton = (onClick, showAvatarIcon) => (
    <Box component="button" type="button" onClick={onClick} sx={buttonSx}>
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: avatarColor,
          color: theme.palette.common.white,
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {showAvatarIcon ? <AccountCircleIcon sx={{ fontSize: 20 }} /> : avatarLetter}
      </Avatar>
      <Box sx={{ minWidth: 0, textAlign: 'left' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.1 }} noWrap>
          {displayName}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', lineHeight: 1.1 }}
          noWrap
        >
          {displayPlan}
        </Typography>
      </Box>
      <KeyboardArrowDownRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
    </Box>
  );

  return (
    <>
      {/* ================= Logged‑in ================= */}
      {isLoggedIn ? (
        <>
          {profileButton(handleMenuOpen, false)}

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
          {profileButton(() => handleDialogOpen('login'), true)}
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
