import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Link,
  Box,
  Typography,
  Stack,
  Divider,
  Grid,
} from '@mui/material';
import { useLoginMutation, useRegisterMutation } from './Redux/authApi';
import * as Yup from 'yup';
import ForgotPasswordDialog from './ForgotPasswordDialog';

const loginSchema = Yup.object().shape({
  email_or_username: Yup.string().required('Email or Username is required'),
  password: Yup.string().min(8, 'Password must be at least 8 chars').required(),
});

const registerSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required(),
  username: Yup.string().min(3, 'Username must be at least 3 chars').required(),
  password: Yup.string().min(8, 'Password must be at least 8 chars').required(),
});

function AuthDialog({ open, mode, onClose, onSwitchMode }) {
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerUser, { isLoading: isRegisterLoading }] = useRegisterMutation();

  const [localError, setLocalError] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [honeyTrap, setHoneyTrap] = useState('');
  const [formStartTime, setFormStartTime] = useState(null);

  // State for ForgotPasswordDialog visibility
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setFormStartTime(Date.now());
      setLocalError('');
      setEmailOrUsername('');
      setPassword('');
      setEmail('');
      setUsername('');
      setHoneyTrap('');
    }
  }, [open]);

  const handleSwitchMode = () => {
    setLocalError('');
    onSwitchMode(mode === 'login' ? 'register' : 'login');
    setFormStartTime(Date.now());
  };

  const handleSubmit = async () => {
    try {
      if (mode === 'login') {
        await loginSchema.validate({ email_or_username: emailOrUsername, password });
      } else {
        await registerSchema.validate({ email, username, password });
      }

      const elapsed = (Date.now() - formStartTime) / 1000;
      if (elapsed < 5) {
        setLocalError('Form submitted too quickly. Please try again.');
        return;
      }
      if (honeyTrap) {
        setLocalError('Bot detected.');
        return;
      }

      let result;
      if (mode === 'login') {
        result = await login({
          email_or_username: emailOrUsername,
          password,
          honey_trap: honeyTrap,
          form_time: elapsed,
        }).unwrap();
        console.log('Login success:', result);
      } else {
        result = await registerUser({
          email,
          username,
          password,
          honey_trap: honeyTrap,
          form_time: elapsed,
        }).unwrap();
        console.log('Register success:', result);
        alert('Registered successfully! You can now log in.');
      }
      onClose();
    } catch (err) {
      if (err.name === 'ValidationError') {
        setLocalError(err.message);
      } else if (err.data && err.data.error) {
        setLocalError(err.data.error);
      } else {
        setLocalError(err.message || `${mode === 'login' ? 'Login' : 'Registration'} failed`);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography variant="h5" align="center" sx={{ fontWeight: 600 }}>
            {mode === 'login' ? 'Welcome Back!' : 'Create an Account'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          {mode === 'login' ? (
            <Stack spacing={2}>
              {localError && <Alert severity="error">{localError}</Alert>}
              <TextField
                label="Email or Username"
                fullWidth
                variant="outlined"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* Hidden honey trap */}
              <input
                type="text"
                value={honeyTrap}
                onChange={(e) => setHoneyTrap(e.target.value)}
                style={{ display: 'none' }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={isLoginLoading}
                sx={{fontWeight: 'bold'}}
              >
                {isLoginLoading ? 'Logging in...' : 'Log In'}
              </Button>
              <Link
                component="button"
                variant="body2"
                onClick={() => setForgotPasswordOpen(true)}
                underline="hover"
                align="center"
              >
                Forgot Password?
              </Link>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {localError && <Alert severity="error">{localError}</Alert>}
              <TextField
                label="Email"
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Username"
                fullWidth
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* Hidden honey trap */}
              <input
                type="text"
                value={honeyTrap}
                onChange={(e) => setHoneyTrap(e.target.value)}
                style={{ display: 'none' }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={isRegisterLoading}
              >
                {isRegisterLoading ? 'Registering...' : 'Register'}
              </Button>
            </Stack>
          )}
        </DialogContent>
        <Divider />
        {mode === 'login' ? (
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              onClick={handleSwitchMode}
              sx={{
                fontWeight: 'bold',
                border: '1px solid',
                backgroundColor: 'secondary.main',
                color: 'black',
                '&:hover': { backgroundColor: 'transparent' },
                borderColor: 'secondary.main',
              }}
            >
              Create New Account
            </Button>
          </Box>
        ) : (
          <DialogActions sx={{ justifyContent: 'center' }}>
            <Button onClick={handleSwitchMode} color="secondary">
              Already have an account?
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </>
  );
}

export default AuthDialog;
