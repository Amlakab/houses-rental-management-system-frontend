'use client';

import { useEffect } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 2
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold' }}>
          Oops!
        </Typography>
        <Typography variant="h4" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {error.message || 'An unexpected error occurred'}
        </Typography>
        <Button
          onClick={reset}
          variant="contained"
          startIcon={<RefreshIcon />}
          sx={{
            background: 'linear-gradient(135deg, #007bff, #0056b3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0056b3, #004080)'
            }
          }}
        >
          Try Again
        </Button>
      </Box>
    </Container>
  );
}