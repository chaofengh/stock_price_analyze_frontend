import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ForgotPasswordForm from './ForgotPasswordForm';

function ForgotPasswordDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent>
        <ForgotPasswordForm />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ForgotPasswordDialog;
