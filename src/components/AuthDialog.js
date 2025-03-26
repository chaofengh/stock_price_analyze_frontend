import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material';
import { useLoginMutation, useRegisterMutation } from './Redux/authApi';
import * as Yup from 'yup';

// Reuse your existing schemas or import them from a separate file
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
  // RTK Query hooks
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerUser, { isLoading: isRegisterLoading }] = useRegisterMutation();

  // Local form state
  const [localError, setLocalError] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Honeypot + timing
  const [honeyTrap, setHoneyTrap] = useState('');
  const [formStartTime, setFormStartTime] = useState(null);

  // Reset fields whenever dialog opens
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

      onClose(); // Close the dialog on success
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
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{mode === 'login' ? 'Login' : 'Register'}</DialogTitle>
      <DialogContent>
        {localError && <Alert severity="error">{localError}</Alert>}
        {mode === 'login' ? (
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
            {/* Hidden honey trap */}
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
            {/* Hidden honey trap */}
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
        <Button onClick={handleSwitchMode}>
          {mode === 'login' ? 'Need to register?' : 'Already have an account?'}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            mode === 'login' ? isLoginLoading : isRegisterLoading
          }
        >
          {mode === 'login'
            ? isLoginLoading
              ? 'Logging in...'
              : 'Login'
            : isRegisterLoading
            ? 'Registering...'
            : 'Register'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AuthDialog;
