import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import LoginModal from "./LoginModal";
import PilotAvatar from "./PilotAvatar";
import { Theme, alpha } from '@mui/material/styles';

const formatUserName = (email: string | null | undefined) => {
  if (!email) return '';
  const name = email.split("@")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const LandingPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const planeControls = useAnimation();
  const [loginOpen, setLoginOpen] = useState(false);

  const startPlaneAnimation = async () => {
    await planeControls.start({
      x: "100vw",
      y: 0,
      rotate: 0,
      transition: { duration: 0 },
    });

    await planeControls.start({
      x: "-100vw",
      y: 0,
      transition: {
        duration: 6,
        ease: "linear",
      },
    });
  };

  useEffect(() => {
    startPlaneAnimation();
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        startPlaneAnimation();
      }, 6000); 
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [planeControls]);

  const handleLoginOpen = () => setLoginOpen(true);
  const handleLoginClose = () => setLoginOpen(false);

  const handleNavigation = (path: string) => {
    if (currentUser) {
      navigate(path);
    } else {
      handleLoginOpen();
    }
  };

  const cardStyle = {
    p: 3,
    mb: 0,
    width: { xs: "100%", sm: "90%", md: "70%", lg: "60%" },
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: (theme: Theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    border: '1px solid',
    borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
    borderRadius: 2,
    background: (theme: Theme) => `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
  };

  const buttonStyle = {
    fontWeight: "bold",
    transition: 'all 0.2s ease-in-out',
    '&:active': {
      transform: 'scale(0.95)',
    },
    '&:hover': {
      boxShadow: (theme: Theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
  };

  return (
    <>
      {/* Hero Section Image as Section */}
      <Box
        sx={{
          width: '100vw',
          py: 0, // Unchanged
          px: 0, // Unchanged
          background: '#e3f0fa',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <img
          src="/images/PeterPilotHero.png"
          alt="Peter the Pilot Hero"
          style={{
            width: '100%',
            maxWidth: 1200,
            height: 'auto',
            objectFit: 'contain',
          }}
        />
        {/* Gold Get Started Button Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: '62%', sm: '65%' },
            left: { xs: '4%', sm: '4%' },
            zIndex: 2,
            width: { xs: 220, sm: 260 },
            height: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Button
            variant="contained"
            onClick={handleLoginOpen}
            sx={{
              background: '#FFD700',
              color: '#1a1a1a',
              fontWeight: 'bold',
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              px: { xs: 2, sm: 3, md: 4 },
              py: { xs: 1, sm: 1.25, md: 1.5 },
              minWidth: { xs: 140, sm: 180, md: 220 },
              '&:hover': {
                background: '#FFC300',
              },
              '&:active': {
                transform: 'scale(0.96)',
              },
            }}
          >
            Get Started
          </Button>
        </Box>
      </Box>
      {/* Cards Section - Full Width */}
      <Box sx={{ backgroundColor: '#e3f0fa', width: '100vw', py: 6, px: { xs: 0, sm: 0, md: 0 }, boxSizing: 'border-box' }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 2,
            width: '100vw',
          }}
        >
          {/* Budget Planner */}
          <Box
            sx={{
              width: { xs: '98vw', sm: '95vw', md: '92vw' },
              maxWidth: 1200,
              minHeight: '80vh',
              py: { xs: 8, sm: 10, md: 12 },
              px: 0,
              pb: { xs: 10, sm: 14, md: 18 },
              backgroundColor: 'primary.main',
              color: 'white',
              margin: 'auto',
              borderRadius: '50px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxSizing: 'border-box',
              mb: { xs: 6, sm: 8, md: 10 },
              position: 'relative',
              boxShadow: 6,
            }}
          >
            <Box
              component="img"
              src="/images/Airplane.png"
              alt="Airplane"
              sx={{
                position: 'absolute',
                top: { xs: -50, sm: -150 },
                width: { xs: 580, sm: 780, md: 880 },
                height: 'auto',
                zIndex: 1,
                opacity: 0.95,
                pointerEvents: 'none',
              }}
            />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Take Control of Your Money. One Click at a Time.
            </Typography>
            <br /><br />
            <Typography
              sx={{
                mb: 3,
                fontSize: { xs: '1rem', sm: '1.125rem' },
                maxWidth: 600,
                color: 'white',
              }}
            >
              Whether you're saving for a dream or just trying to make ends meet, our budget tool helps you track income, cut spending leaks, and build smart financial habits — all in one place.
            </Typography>
            <br /><br />
            <Button
              variant="contained"
              onClick={() => handleNavigation("/budget")}
              sx={{
                backgroundColor: '#FFD700', // gold
                color: '#003366', // dark blue text
                fontWeight: 'bold',
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                boxShadow: 3,
                '&:hover': {
                  backgroundColor: '#FFC400',
                },
                mb: -25,
              }}
            >
              + Start Budgeting
            </Button>
          </Box>

          {/* Tax Prep */}
          <Box
            sx={{
              width: { xs: '98vw', sm: '95vw', md: '92vw' },
              maxWidth: 1200,
              minHeight: '80vh',
              py: { xs: 8, sm: 10, md: 12 },
              px: 0,
              pb: { xs: 10, sm: 14, md: 18 },
              backgroundColor: 'orange', // gold
              color: '#003366', // navy text
              margin: 'auto',
              borderRadius: '50px', // Prominent rounded edges
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxSizing: 'border-box',
              mb: { xs: 6, sm: 8, md: 10 },
              position: 'relative',
              boxShadow: 6,
            }}
          >
            <Box
              component="img"
              src="/images/Airplane2.png"
              alt="Tax Plane"
              sx={{
                position: 'absolute',
                top: { xs: -50, sm: -150 },
                width: { xs: 500, sm: 700, md: 800 },
                height: 'auto',
                zIndex: 1,
                opacity: 0.9,
                pointerEvents: 'none',
              }}
            />
            <br /><br /><br /><br /><br /><br /> 
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Clear the Runway for Tax Savings<br /><small>Enjoy Effortless Tax Preparation!</small>
            </Typography>
            <br /><br />
            <Typography
              sx={{
                mb: 3,
                fontSize: { xs: '1rem', sm: '1.125rem' },
                maxWidth: 600,
                color: '#003366',
              }}
            >
              Log deductible expenses, track totals, and take the stress out of tax season — all in one streamlined tool.
            </Typography>
            <br /><br />
            <Button
              variant="contained"
              color="primary"
              sx={{
                fontWeight: 'bold',
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                boxShadow: 3,
                backgroundColor: '#003366',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#002244',
                },
                mb: -25,
              }}
            >
              + Tax Prep
            </Button>
          </Box>

          {/* Financial Goals */}
          <Box
            sx={{
              width: { xs: '98vw', sm: '95vw', md: '92vw' },
              maxWidth: 1200,
              minHeight: '80vh',
              py: { xs: 8, sm: 10, md: 12 },
              px: 0,
              pb: { xs: 10, sm: 14, md: 18 },
              backgroundColor: 'primary.main',
              color: 'white',
              margin: 'auto',
              borderRadius: '50px', // Prominent rounded edges
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxSizing: 'border-box',
              mb: { xs: 6, sm: 8, md: 10 },
              position: 'relative',
              boxShadow: 6,
            }}
          >
            <Box
              component="img"
              src="/images/Badge.png"
              alt="Goal Path"
              sx={{
                position: 'absolute',
                top: { xs: 120, sm: 100 },
                width: { xs: 150, sm: 180, md: 280 },
                height: 'auto',
                zIndex: 1,
                opacity: 0.95,
                pointerEvents: 'none',
              }}
            />
            <br /><br />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#FFD700' }}>
              Achieve More, One Milestone at a Time.
            </Typography>
            <br /><br />
            <Typography
              sx={{
                mb: 3,
                fontSize: { xs: '1rem', sm: '1.125rem' },
                maxWidth: 600,
                color: '#FFC400',
              }}
            >
              Track your financial dreams with purpose. Our goals feature turns saving into a journey — with visual progress, motivating badges, and milestones that keep you moving forward.
            </Typography>
            <br /><br />
            <Button
              variant="contained"
              onClick={() => handleNavigation("/goals")}
              sx={{
                backgroundColor: '#FFD700', // gold
                color: '#003366', // dark blue text
                fontWeight: 'bold',
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                boxShadow: 3,
                '&:hover': {
                  backgroundColor: '#FFC400',
                },
                mb: -25,
              }}
            >
              + Set a Goal
            </Button>
          </Box>

          <LoginModal open={loginOpen} onClose={handleLoginClose} />
        </Box>
      </Box>
    </>
  );
};

export default LandingPage;