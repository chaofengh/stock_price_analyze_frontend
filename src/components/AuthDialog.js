import React, { useState, useEffect, useId, useRef } from 'react';
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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useLoginMutation, useRegisterMutation } from './Redux/authApi';
import { usePostHog } from 'posthog-js/react';
import * as Yup from 'yup';
import ForgotPasswordDialog from './ForgotPasswordDialog';

const loginSchema = Yup.object().shape({
  email_or_username: Yup.string().required('Email or Username is required'),
  password: Yup.string().min(8, 'Password must be at least 8 chars').required(),
});

const registerSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required(),
  username: Yup.string().min(3, 'Username must be at least 3 chars').required(),
  firstName: Yup.string().trim().max(80, 'First name is too long').required('First name is required'),
  lastName: Yup.string().trim().max(80, 'Last name is too long').required('Last name is required'),
  password: Yup.string().min(8, 'Password must be at least 8 chars').required(),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  phone: Yup.string().trim().max(30, 'Phone is too long').optional(),
  country: Yup.string().trim().max(64, 'Country is too long').optional(),
  timezone: Yup.string().trim().max(64, 'Timezone is too long').optional(),
  marketingOptIn: Yup.boolean().optional(),
  acceptTerms: Yup.boolean().oneOf([true], 'You must accept the terms'),
});

function AuthDialog({ open, mode, onClose, onSwitchMode }) {
  const theme = useTheme();
  const posthog = usePostHog();
  const fieldIdPrefix = useId().replace(/:/g, '');
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerUser, { isLoading: isRegisterLoading }] = useRegisterMutation();

  const [localError, setLocalError] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [honeyTrap, setHoneyTrap] = useState('');
  const [formStartTime, setFormStartTime] = useState(null);
  const signupStartedRef = useRef(false);

  // State for ForgotPasswordDialog visibility
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setFormStartTime(Date.now());
      setLocalError('');
      setEmailOrUsername('');
      setPassword('');
      setConfirmPassword('');
      setEmail('');
      setUsername('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setCountry('');
      setMarketingOptIn(false);
      setAcceptTerms(false);
      setHoneyTrap('');
      try {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
      } catch (e) {
        setTimezone('');
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      signupStartedRef.current = false;
      return;
    }
    if (mode !== 'register') {
      signupStartedRef.current = false;
      return;
    }
    if (!signupStartedRef.current) {
      posthog?.capture('signup_started', { method: 'email' });
      signupStartedRef.current = true;
    }
  }, [mode, open, posthog]);

  const handleSwitchMode = () => {
    setLocalError('');
    const nextMode = mode === 'login' ? 'register' : 'login';
    onSwitchMode(nextMode);
    setFormStartTime(Date.now());
    setEmailOrUsername('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setUsername('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setCountry('');
    setMarketingOptIn(false);
    setAcceptTerms(false);
    setHoneyTrap('');
    if (nextMode === 'register') {
      try {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
      } catch (e) {
        setTimezone('');
      }
    } else {
      setTimezone('');
    }
  };

  const handleSubmit = async () => {
    let requestStartedAt = null;
    try {
      if (mode === 'login') {
        await loginSchema.validate({ email_or_username: emailOrUsername, password });
      } else {
        await registerSchema.validate({
          email,
          username,
          firstName,
          lastName,
          password,
          confirmPassword,
          phone,
          country,
          timezone,
          marketingOptIn,
          acceptTerms,
        });
      }

      const elapsed = formStartTime ? (Date.now() - formStartTime) / 1000 : 0;
      if (mode === 'register' && elapsed < 5) {
        setLocalError('Form submitted too quickly. Please try again.');
        return;
      }
      if (honeyTrap) {
        setLocalError('Bot detected.');
        return;
      }

      let result;
      if (mode === 'login') {
        requestStartedAt = Date.now();
        result = await login({
          email_or_username: emailOrUsername,
          password,
          honey_trap: honeyTrap,
          form_time: elapsed,
        }).unwrap();
        const latencyMs = Date.now() - requestStartedAt;
        const userId = result?.user?.id ?? result?.user?.user_id ?? result?.user_id;
        if (userId) posthog?.identify(String(userId));
        posthog?.capture('login_completed', { method: 'email', latency_ms: latencyMs });
      } else {
        requestStartedAt = Date.now();
        result = await registerUser({
          email,
          username,
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
          country,
          timezone,
          marketing_opt_in: marketingOptIn,
          honey_trap: honeyTrap,
          form_time: elapsed,
        }).unwrap();
        const latencyMs = Date.now() - requestStartedAt;
        const userId = result?.user?.id ?? result?.user?.user_id ?? result?.user_id;
        if (userId) posthog?.identify(String(userId));
        posthog?.capture('signup_completed', { method: 'email', latency_ms: latencyMs });
        window.dispatchEvent(
          new CustomEvent('auth:registered', { detail: { user: result?.user || null } })
        );
      }
      onClose();
    } catch (err) {
      const latencyMs = requestStartedAt ? Date.now() - requestStartedAt : null;
      const isValidationError = err?.name === 'ValidationError';
      if (mode === 'login' && !isValidationError) {
        const reason = err?.data?.error || err?.error || err?.message || 'Login failed';
        posthog?.capture('login_failed', {
          method: 'email',
          latency_ms: Number.isFinite(latencyMs) ? latencyMs : null,
          reason,
        });
      }
      if (err.name === 'ValidationError') {
        setLocalError(err.message);
      } else if (err.data && err.data.error) {
        setLocalError(err.data.error);
      } else {
        setLocalError(err.message || `${mode === 'login' ? 'Login' : 'Registration'} failed`);
      }
    }
  };

  const textFieldSx = {
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondaryBright,
      fontWeight: 700,
    },
    '& .MuiInputLabel-shrink': {
      backgroundColor: alpha(theme.palette.background.paper, 0.92),
      padding: '0 8px',
      borderRadius: 'var(--app-radius)',
      marginLeft: '-2px',
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: 'var(--app-radius)',
      backgroundColor: alpha(theme.palette.common.white, 0.04),
      transition: 'box-shadow 150ms ease, border-color 150ms ease, background-color 150ms ease',
      '& fieldset': {
        borderColor: alpha(theme.palette.common.white, 0.16),
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.palette.common.white, 0.3),
      },
      '&.Mui-focused': {
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.22)}`,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiOutlinedInput-input': {
      padding: '14px 16px',
    },
  };

  const fieldLabelSx = {
    color: theme.palette.text.secondaryBright,
    fontWeight: 800,
    letterSpacing: 0.2,
    fontSize: 13,
    lineHeight: 1.15,
    fontFamily: theme.typography.fontFamily,
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            p: 0,
            overflow: 'hidden',
            borderRadius: 'var(--app-radius)',
            borderColor: alpha(theme.palette.common.white, 0.12),
            backgroundImage: 'none',
            marginBottom: 0,
          },
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              px: 3,
              pt: 3,
              pb: 2.25,
              borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
              background: `radial-gradient(420px 240px at 10% 0%, ${alpha(
                theme.palette.primary.main,
                0.22
              )}, transparent 60%),
              radial-gradient(340px 240px at 100% 0%, ${alpha(theme.palette.secondary.main, 0.14)}, transparent 60%),
              ${theme.palette.background.paper}`,
            }}
          >
            <Typography variant="h5" align="center" sx={{ fontWeight: 900, letterSpacing: 0.2 }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </Typography>
            <Typography
              variant="body2"
              align="center"
              sx={{ color: 'text.secondary', mt: 0.75, maxWidth: 360, mx: 'auto' }}
            >
              {mode === 'login'
                ? 'Sign in to pick up right where you left off.'
                : 'It takes a minute. Your watch list will stay with you.'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 3, px: 3 }}>
          <Box sx={{ pt: 3.25 }}>
            {mode === 'login' ? (
              <Stack spacing={2.25}>
                {localError && <Alert severity="error">{localError}</Alert>}
                <Stack spacing={1.25} sx={{ mt: 1 }}>
                  <Typography
                    component="div"
                    id={`${fieldIdPrefix}-emailOrUsername-label`}
                    variant="body2"
                    sx={fieldLabelSx}
                  >
                    Email or username
                  </Typography>
                  <TextField
                    id={`${fieldIdPrefix}-emailOrUsername`}
                    placeholder="Email or username"
                    fullWidth
                    variant="outlined"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    autoComplete="username"
                    inputProps={{ 'aria-labelledby': `${fieldIdPrefix}-emailOrUsername-label` }}
                    sx={textFieldSx}
                  />
                </Stack>
                <Stack spacing={1.25}>
                  <Typography
                    component="div"
                    id={`${fieldIdPrefix}-password-label`}
                    variant="body2"
                    sx={fieldLabelSx}
                  >
                    Password
                  </Typography>
                  <TextField
                    id={`${fieldIdPrefix}-password`}
                    placeholder="Password"
                    type="password"
                    fullWidth
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    inputProps={{ 'aria-labelledby': `${fieldIdPrefix}-password-label` }}
                    sx={textFieldSx}
                  />
                </Stack>
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
                  size="large"
                  sx={{ fontWeight: 900, borderRadius: 'var(--app-radius)', py: 1.2 }}
                >
                  {isLoginLoading ? 'Logging in...' : 'Log In'}
                </Button>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => setForgotPasswordOpen(true)}
                  underline="hover"
                  align="center"
                  sx={{ color: 'text.secondaryBright', fontWeight: 700 }}
                >
                  Forgot Password?
                </Link>
              </Stack>
            ) : (
              <Stack spacing={2.25}>
                {localError && <Alert severity="error">{localError}</Alert>}
                <TextField
                  label="Email"
                  fullWidth
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldSx}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="First name"
                    fullWidth
                    variant="outlined"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={textFieldSx}
                  />
                  <TextField
                    label="Last name"
                    fullWidth
                    variant="outlined"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={textFieldSx}
                  />
                </Stack>
                <TextField
                  label="Username"
                  fullWidth
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldSx}
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldSx}
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldSx}
                />
                <TextField
                  label="Phone (optional)"
                  fullWidth
                  variant="outlined"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldSx}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Country (optional)"
                    fullWidth
                    variant="outlined"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={textFieldSx}
                  />
                  <TextField
                    label="Time zone (optional)"
                    fullWidth
                    variant="outlined"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={textFieldSx}
                  />
                </Stack>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                    />
                  }
                  label="Email me product updates (optional)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                    />
                  }
                  label="I agree to the Terms & Privacy Policy"
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
                  size="large"
                  sx={{ fontWeight: 900, borderRadius: 'var(--app-radius)', py: 1.2 }}
                >
                  {isRegisterLoading ? 'Registering...' : 'Register'}
                </Button>
              </Stack>
            )}
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          {mode === 'login' ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
                New here?
              </Typography>
              <Button
                onClick={handleSwitchMode}
                variant="outlined"
                sx={{
                  fontWeight: 900,
                  borderRadius: 'var(--app-radius)',
                  borderColor: alpha(theme.palette.common.white, 0.2),
                }}
              >
                Create account
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
                Already have an account?
              </Typography>
              <Button
                onClick={handleSwitchMode}
                variant="text"
                sx={{ fontWeight: 900, color: 'text.secondaryBright' }}
              >
                Sign in
              </Button>
            </Stack>
          )}
        </DialogActions>
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
