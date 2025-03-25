// src/components/UserProfileIcon.js
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
import ReCAPTCHA from 'react-google-recaptcha';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './Redux/authSlice';
import {
  useLoginMutation,
  useRegisterMutation,
} from './Redux/authApi';

// For thorough validation, let's do a quick example with Yup
import * as Yup from 'yup';

// Example schemas
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
  // reCAPTCHA
  const [captchaToken, setCaptchaToken] = useState('');

  // For local error messages from validation or server
  const [localError, setLocalError] = useState('');

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleDialogOpen = (mode) => {
    setAuthMode(mode);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setLocalError('');
    setEmailOrUsername('');
    setPassword('');
    setEmail('');
    setUsername('');
    setCaptchaToken('');
  };

  const switchAuthMode = () => {
    setLocalError('');
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
  };

  // Perform login
  const handleLogin = async () => {
    try {
      // Validate form fields with Yup
      await loginSchema.validate({ email_or_username: emailOrUsername, password });
      if (!captchaToken) {
        setLocalError('Please complete the CAPTCHA.');
        return;
      }

      // Attempt login via RTK Query
      const result = await login({
        email_or_username: emailOrUsername,
        password,
        captcha_token: captchaToken,
      }).unwrap();

      // On success, RTK Query updates authSlice automatically
      console.log('Login success:', result);
      handleDialogClose();
    } catch (err) {
      if (err.name === 'ValidationError') {
        // Yup validation error
        setLocalError(err.message);
      } else if (err.data && err.data.error) {
        // Server error from backend
        setLocalError(err.data.error);
      } else {
        // Possibly a network or unknown error
        setLocalError(err.message || 'Login failed');
      }
    }
  };

  // Perform registration
  const handleRegister = async () => {
    try {
      // Validate with Yup
      await registerSchema.validate({ email, username, password });
      if (!captchaToken) {
        setLocalError('Please complete the CAPTCHA.');
        return;
      }

      const result = await registerUser({
        email,
        username,
        password,
        captcha_token: captchaToken,
      }).unwrap();

      console.log('Register success:', result);
      // Optionally auto-login here or prompt user
      // For now, just close dialog
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
    <Box sx={{ display: 'inline-block', mr: 2 }}>
      {isLoggedIn ? (
        <>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <AccountCircleIcon sx={{ color: 'lightgreen' }} />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => alert('Profile clicked')}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </>
      ) : (
        <IconButton color="inherit" onClick={() => handleDialogOpen('login')}>
          <AccountCircleIcon />
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
              <Box sx={{ mt: 2 }}>
                <ReCAPTCHA
                  sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                />
              </Box>
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
              <Box sx={{ mt: 2 }}>
                <ReCAPTCHA
                  sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={switchAuthMode}>
            {authMode === 'login' ? 'Need to register?' : 'Already have an account?'}
          </Button>
          {authMode === 'login' ? (
            <Button
              variant="contained"
              onClick={handleLogin}
              disabled={isLoginLoading}
            >
              {isLoginLoading ? 'Logging in...' : 'Login'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleRegister}
              disabled={isRegisterLoading}
            >
              {isRegisterLoading ? 'Registering...' : 'Register'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserProfileIcon;
