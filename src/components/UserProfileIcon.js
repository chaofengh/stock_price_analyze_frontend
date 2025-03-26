import React, { useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Menu,
  MenuItem,
  Box,
  Alert,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './Redux/authSlice';
import { useLoginMutation, useRegisterMutation } from './Redux/authApi';
import * as Yup from 'yup';

// Example schemas remain the same
const loginSchema = Yup.object().shape({
  email_or_username: Yup.string().required('Email or Username is required'),
  password: Yup.string().min(8, 'Password must be at least 8 chars').required(),
});

const registerSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required(),
  username: Yup.string().min(3, 'Username must be at least 3 chars').required(),
  password: Yup.string().min(8, 'Password must be at least 8 chars').required(),
});

function UserProfileIcon() {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state) => state.auth);

  // RTK Query hooks
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerUser, { isLoading: isRegisterLoading }] = useRegisterMutation();

  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Form fields
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Remove captchaToken; add honey trap and form start time state variables
  const [honeyTrap, setHoneyTrap] = useState('');
  const [formStartTime, setFormStartTime] = useState(null);

  // For local error messages
  const [localError, setLocalError] = useState('');

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleDialogOpen = (mode) => {
    setAuthMode(mode);
    setFormStartTime(Date.now());
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setLocalError('');
    setEmailOrUsername('');
    setPassword('');
    setEmail('');
    setUsername('');
    setHoneyTrap('');
    setFormStartTime(null);
  };

  const switchAuthMode = () => {
    setLocalError('');
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setFormStartTime(Date.now());
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
  };

  // Perform login
  const handleLogin = async () => {
    try {
      await loginSchema.validate({ email_or_username: emailOrUsername, password });
      const elapsed = (Date.now() - formStartTime) / 1000;
      if (elapsed < 5) {
        setLocalError('Form submitted too quickly. Please try again.');
        return;
      }
      if (honeyTrap) {
        setLocalError('Bot detected.');
        return;
      }

      const result = await login({
        email_or_username: emailOrUsername,
        password,
        honey_trap: honeyTrap,
        form_time: elapsed,
      }).unwrap();

      console.log('Login success:', result);
      handleDialogClose();
    } catch (err) {
      if (err.name === 'ValidationError') {
        setLocalError(err.message);
      } else if (err.data && err.data.error) {
        setLocalError(err.data.error);
      } else {
        setLocalError(err.message || 'Login failed');
      }
    }
  };

  // Perform registration
  const handleRegister = async () => {
    try {
      await registerSchema.validate({ email, username, password });
      const elapsed = (Date.now() - formStartTime) / 1000;
      if (elapsed < 5) {
        setLocalError('Form submitted too quickly. Please try again.');
        return;
      }
      if (honeyTrap) {
        setLocalError('Bot detected.');
        return;
      }

      const result = await registerUser({
        email,
        username,
        password,
        honey_trap: honeyTrap,
        form_time: elapsed,
      }).unwrap();

      console.log('Register success:', result);
      handleDialogClose();
      alert('Registered successfully! You can now log in.');
    } catch (err) {
      if (err.name === 'ValidationError') {
        setLocalError(err.message);
      } else if (err.data && err.data.error) {
        setLocalError(err.data.error);
      } else {
        setLocalError(err.message || 'Registration failed');
      }
    }
  };

  const isLoggedIn = !!accessToken;

  return (
    <>
      {isLoggedIn ? (
        <>
          <IconButton color="inherit" onClick={handleMenuOpen} sx={{ p: 0.5 }}>
            <AccountCircleIcon sx={{ fontSize: 30 }} />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => alert('Profile clicked')}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </>
      ) : (
        <IconButton color="inherit" onClick={() => handleDialogOpen('login')} sx={{ p: 0.5 }}>
          <AccountCircleIcon sx={{ fontSize: 30 }} />
        </IconButton>
      )}

      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>{authMode === 'login' ? 'Login' : 'Register'}</DialogTitle>
        <DialogContent>
          {localError && <Alert severity="error">{localError}</Alert>}
          {authMode === 'login' ? (
            <>
              <TextField
                margin="dense"
                label="Email or Username"
                fullWidth
                variant="outlined"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* Hidden honey trap field */}
              <input
                type="text"
                value={honeyTrap}
                onChange={(e) => setHoneyTrap(e.target.value)}
                style={{ display: 'none' }}
              />
            </>
          ) : (
            <>
              <TextField
                margin="dense"
                label="Email"
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="dense"
                label="Username"
                fullWidth
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* Hidden honey trap field */}
              <input
                type="text"
                value={honeyTrap}
                onChange={(e) => setHoneyTrap(e.target.value)}
                style={{ display: 'none' }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={switchAuthMode}>
            {authMode === 'login' ? 'Need to register?' : 'Already have an account?'}
          </Button>
          {authMode === 'login' ? (
            <Button variant="contained" onClick={handleLogin} disabled={isLoginLoading}>
              {isLoginLoading ? 'Logging in...' : 'Login'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleRegister} disabled={isRegisterLoading}>
              {isRegisterLoading ? 'Registering...' : 'Register'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default UserProfileIcon;
