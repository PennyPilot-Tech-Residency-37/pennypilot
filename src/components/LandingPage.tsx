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
import { Theme,alpha } from '@mui/material/styles';

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
    mb: 4,
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
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        overflowX: "hidden",
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: "url(/images/PennyPilot-cloud-background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.5,
          zIndex: -1,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ mt: 10, mb: 8, position: "relative", zIndex: 0 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            minHeight: "calc(100vh - 128px)",
            justifyContent: "center",
            px: { xs: 2, sm: 0 },
          }}
        >
          {/* Header Section */}
          <Box sx={{ position: "relative", mt: 10, mb: 4 }}>
            <PilotAvatar
              message={
                currentUser
                  ? `Ready for takeoff, ${formatUserName(currentUser.email)}?`
                  : "Ready for takeoff? Log in to fly!"
              }
              sx={{ zIndex: 2 }}
            />
            <motion.div
              style={{
                position: "absolute",
                top: "2%", 
                left: 0,
                zIndex: 1,
                width: "30vw",
                maxWidth: "200px",
                minWidth: "120px",
              }}
              animate={planeControls}
            >
              <img
                src="/images/PennyPilot-plane.png"
                alt="Blue Cartoon Plane"
                style={{ width: "100%", height: "auto" }}
              />
            </motion.div>
          </Box>

          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            PennyPilot
          </Typography>
          <Typography variant="h5" gutterBottom>
            Your Financial Copilot!
          </Typography>

          {/* Welcome Section */}
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Welcome, Captain! Your Flight Path:
              </Typography>
              {currentUser ? (
                <Typography>
                  Chart your course with PennyPilot's tools below.
                </Typography>
              ) : (
                <>
                  <Typography sx={{ mb: 2 }}>
                    Please log in to see your flight path.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLoginOpen}
                    sx={buttonStyle}
                  >
                    + Log In
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Budget Planner */}
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Budget Planner
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Chart Your Course with a Budget!
              </Typography>
              <Typography sx={{ mb: 2 }}>
                Plan your income and expenses easily.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleNavigation("/budget")}
                sx={buttonStyle}
              >
                + Start Budgeting
              </Button>
            </CardContent>
          </Card>

          {/* Tax Prep */}
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tax Preparation
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Clear the Runway for Tax Savings!
              </Typography>
              <Typography sx={{ mb: 2 }}>
                Save for taxes effortlessly.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleNavigation("/tax-prep")}
                sx={buttonStyle}
              >
                + Tax Prep
              </Button>
            </CardContent>
          </Card>

          {/* Financial Goals */}
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Goals
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Set Your Sights on Financial Goals!
              </Typography>
              <Typography sx={{ mb: 2 }}>
                Track progress toward your dreams.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleNavigation("/goals")}
                sx={buttonStyle}
              >
                + Goals
              </Button>
            </CardContent>
          </Card>

          <LoginModal open={loginOpen} onClose={handleLoginClose} />
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;