import React, { useState, useEffect } from 'react';
import { TextField, Button, Alert, Box } from '@mui/material';
import axios from 'axios';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [honeyTrap, setHoneyTrap] = useState('');
  const [formStartTime, setFormStartTime] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFormStartTime(Date.now());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const elapsed = (Date.now() - formStartTime) / 1000;

    try {
      const response = await axios.post('/forgot_password', {
        email: email.trim(),
        honey_trap: honeyTrap,
        form_time: elapsed,
      });
      setMessage(response.data.message);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        margin="normal"
        required
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {/* Hidden honey trap input */}
      <input
        type="text"
        value={honeyTrap}
        onChange={(e) => setHoneyTrap(e.target.value)}
        style={{ display: 'none' }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        Reset Password
      </Button>
    </Box>
  );
}

export default ForgotPasswordForm;
