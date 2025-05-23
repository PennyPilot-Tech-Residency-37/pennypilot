import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

const PageNotFound = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleHomeClick = () => {
    navigate(currentUser ? '/dashboard' : '/');
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          pt: 0,
          pb: 0,
          mb: -20
        }}
      >
        <Box
          component="img"
          src="/images/PennyPilot1.png"
          alt="PennyPilot Logo"
          sx={{
            width: { xs: '200px', sm: '300px', md: '400px' },
            height: 'auto',
            mb: 4,
            mt: -15,
            borderRadius: '10px',
          }}
        />
        
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            mb: 2,
            fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
          }}
        >
          404 Page Not Found
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: 'text.secondary',
            mb: 3,
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          Oops! Looks like you've flown off course. Let's get you back home.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleHomeClick}
          sx={{
            py: 1.5,
            px: 4,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: 3,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4,
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          HOME
        </Button>
      </Box>
    </Container>
  );
};

export default PageNotFound;
