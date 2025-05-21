import React from 'react';
import { Box, Typography, Link as MuiLink } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Box
      component="footer"
      sx={{
        width: '100vw',
        py: 6,
        px: { xs: 3, sm: 6, md: 8 },
        backgroundColor: 'primary.main',
        color: 'white',
        textAlign: 'center',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          maxWidth: 1200,
          mx: 'auto',
          mb: 4,
          gap: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -3 }}>
          <RouterLink to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img
              src="/images/PennyPilot-logo.png"
              alt="PennyPilot Logo"
              style={{ width: 148, height: 'auto', marginBottom: -50, cursor: 'pointer' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, cursor: 'pointer' }}>
              PennyPilot
            </Typography>
          </RouterLink>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Navigate Your Financial Future
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Quick Links
          </Typography>
          <MuiLink
            href="/budget"
            color="inherit"
            underline="hover"
            sx={{ opacity: 0.9, textDecoration: 'none', '&:hover': { opacity: 1, textDecoration: 'none', color: '#FFD700' } }}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation('/budget');
            }}
          >
            Budget Planner
          </MuiLink>
          <MuiLink
            href="/tax-prep"
            color="inherit"
            underline="hover"
            sx={{ opacity: 0.9, textDecoration: 'none', '&:hover': { opacity: 1, textDecoration: 'none', color: '#FFD700' } }}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation('/tax-prep');
            }}
          >
            Tax Prep
          </MuiLink>
          <MuiLink
            href="/goals"
            color="inherit"
            underline="hover"
            sx={{ opacity: 0.9, textDecoration: 'none', '&:hover': { opacity: 1, textDecoration: 'none', color: '#FFD700' } }}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation('/goals');
            }}
          >
            Goals
          </MuiLink>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 200, mx: { xs: 'auto', sm: 0 } }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            About Us
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, textAlign: { xs: 'center', sm: 'left' } }}>
            We are Algorithm Alliance from Tech Residency 37 at{' '}
            <MuiLink
              href="https://www.codingtemple.com/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { color: '#FFD700', textDecoration: 'none' }
              }}
            >
              Coding Temple
            </MuiLink>
            . We build websites and collaborate as a team united by our love for technology.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Algorithm Alliance
          </Typography>
          <br />
          <Typography variant="body2" sx={{ opacity: 0.9, textAlign: { xs: 'center', sm: 'left' } }}>
            <MuiLink
              href="https://www.linkedin.com/in/alex-alarcon-82fb088/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { color: '#FFD700', textDecoration: 'none' }
              }}
            >
              Alex Alarcon -
            </MuiLink>
             - <small>Frontend</small>
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, textAlign: { xs: 'center', sm: 'left' } }}>
            <MuiLink
              href="https://www.linkedin.com/in/jennifercoppick/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { color: '#FFD700', textDecoration: 'none' }
              }}
            >
              Jennifer Coppick -
            </MuiLink>
             - <small>Frontend</small>
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, textAlign: { xs: 'center', sm: 'left' } }}>
            <MuiLink
              href="https://www.linkedin.com/in/jaycob-hoffman/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { color: '#FFD700', textDecoration: 'none' }
              }}
            >
              Jaycob Hoffman -
            </MuiLink>
             - <small>Backend</small>
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, textAlign: { xs: 'center', sm: 'left' } }}>
            <MuiLink
              href="https://www.linkedin.com/in/jared-wilson-05b905327/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { color: '#FFD700', textDecoration: 'none' }
              }}
            >
              Jared Wilson -
            </MuiLink>
             - <small>Backend</small>
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, textAlign: { xs: 'center', sm: 'left' } }}>
            <MuiLink
              href="https://www.linkedin.com/in/kevin-jones-8a692894/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { color: '#FFD700', textDecoration: 'none' }
              }}
            >
              Kevin Jones -
            </MuiLink>
             - <span style={{ fontSize: '0.8em' }}>Cybersecurity</span>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Find Us On GitHub
          </Typography>
          <MuiLink
            href="https://github.com/PennyPilot-Tech-Residency-37/pennypilot"
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
            underline="hover"
            sx={{ opacity: 0.9, textDecoration: 'none', '&:hover': { opacity: 1, textDecoration: 'none', color: '#FFD700' } }}
          >
            GitHub
          </MuiLink>
        </Box>
      </Box>

      <br />
      <Typography variant="body2" sx={{ opacity: 0.7 }}>
        © {new Date().getFullYear()} PennyPilot. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;