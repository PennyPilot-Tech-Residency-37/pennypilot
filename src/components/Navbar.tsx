import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Add useNavigate
import { animated, useSpring } from "@react-spring/web";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "../context/auth";
import LoginModal from "./LoginModal";
import { signOut } from "firebase/auth";
import { auth } from "../context/auth";
import { motion } from "framer-motion";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [intendedPath, setIntendedPath] = useState<string | null>(null); // Track intended path
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // For programmatic navigation

  // const logoProps = useSpring({
  //   from: { rotate: 0 },
  //   to: { rotate: 360 },
  //   config: { duration: 1000 },
  //   reset: true,
  //   onRest: () => {
  //     logoProps.rotate.set(0);
  //   },
  // });

  // useEffect(() => {
  //   logoProps.rotate.start();
  // }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLoginOpen = (path?: string) => {
    if (path) setIntendedPath(path); // Store the intended path
    setLoginOpen(true);
    // logoProps.rotate.start();
  };

  const handleLoginClose = () => {
    setLoginOpen(false);
    setIntendedPath(null); // Clear intended path when modal closes
  };

  const handleLogout = () => {
    signOut(auth);
    navigate("/"); // Redirect to home after logout
  };

  const navItems = [
    { label: "Home", path: currentUser ? "/dashboard" : "/" },
    { label: "Budget", path: "/budget" },
    { label: "Tax Prep", path: "/tax-prep" },
    { label: "Goals", path: "/goals" },
  ];

  const handleNavClick = (path: string) => {
    if (!currentUser && path !== "/") {
      // If logged out and not navigating to home, open login modal
      handleLoginOpen(path);
    } else {
      // If logged in, navigate directly and animate logo
      // logoProps.rotate.start();
      navigate(path);
    }
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ width: 250 }}>
      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.label}
            onClick={() => handleNavClick(item.path)} // Use handleNavClick
            sx={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}
          >
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        <ListItem>
          {currentUser ? (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button color="inherit" onClick={() => handleLoginOpen()}>
              Login
            </Button>
          )}
        </ListItem>
      </List>
    </Box>
  );

  const formatUserName = (email: string | null | undefined) => {
    if (!email) return '';
    const name = email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        color="primary" 
        sx={{ 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1100,
          background: '#1976d2',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar sx={{ 
          minHeight: 64, 
          display: "flex", 
          alignItems: "center",
          px: { xs: 2, sm: 4 }
        }}>
          {/* Logo and Title Container */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9,
                transform: 'scale(1.02)',
                transition: 'all 0.2s ease-in-out',
              },
            }}
            onClick={() => handleNavClick(currentUser ? "/dashboard" : "/")}
          >
            {/* Logo */}
            <Box
              sx={{
                height: 64,
                width: 200,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box
                component={animated.div}
                // style={{
                //   transform: logoProps.rotate.to((r) => `rotate(${r}deg)`),
                //   height: 200,
                //   zIndex: 2,
                //   pointerEvents: "none",
                // }}
                style={{
                  height: 200,
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                <img
                  src="/images/PennyPilot-logo.png"
                  alt="Penny Pilot emblem with golden wings and a central P icon."
                  style={{ height: "100%" }}
                />
              </Box>
            </Box>
            {/* Title */}
            <Typography
              variant="h6"
              sx={{ 
                flexGrow: 1, 
                display: { xs: "none", sm: "block" },
                mr: 4,
                fontWeight: 600,
                letterSpacing: '0.5px',
                background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PennyPilot
            </Typography>
          </Box>
          {/* Greeting */}
          {currentUser && (
            <Typography 
              sx={{ 
                mr: 2, 
                display: { xs: "none", sm: "block" },
                color: '#e3f2fd',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              Hello, {formatUserName(currentUser.email)}!
            </Typography>
          )}
          {/* Desktop Nav Buttons */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                color="inherit"
                onClick={() => handleNavClick(item.path)}
                sx={{ 
                  mx: 1,
                  position: 'relative',
                  fontWeight: 500,
                  letterSpacing: '0.3px',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '0%',
                    height: '2px',
                    bottom: 0,
                    left: '50%',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease-in-out',
                    transform: 'translateX(-50%)',
                    borderRadius: '2px',
                  },
                  '&:hover::after': {
                    width: '80%',
                  },
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out',
                    color: '#ffd700',
                    textShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
            {currentUser ? (
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={{ 
                  mx: 1,
                  position: 'relative',
                  fontWeight: 500,
                  letterSpacing: '0.3px',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '0%',
                    height: '2px',
                    bottom: 0,
                    left: '50%',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease-in-out',
                    transform: 'translateX(-50%)',
                    borderRadius: '2px',
                  },
                  '&:hover::after': {
                    width: '80%',
                  },
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out',
                    color: '#ffd700',
                    textShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
                  },
                }}
              >
                Logout
              </Button>
            ) : (
              <Button 
                color="inherit" 
                onClick={() => handleLoginOpen()}
                sx={{ 
                  mx: 1,
                  position: 'relative',
                  fontWeight: 500,
                  letterSpacing: '0.3px',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '0%',
                    height: '2px',
                    bottom: 0,
                    left: '50%',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease-in-out',
                    transform: 'translateX(-50%)',
                    borderRadius: '2px',
                  },
                  '&:hover::after': {
                    width: '80%',
                  },
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out',
                    color: '#ffd700',
                    textShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
                  },
                }}
              >
                Login
              </Button>
            )}
          </Box>
          {/* Mobile Menu Icon */}
          <IconButton
            color="inherit"
            edge="end"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ display: { sm: "none" }, "& .MuiDrawer-paper": { width: 250 } }}
      >
        {drawer}
      </Drawer>
      {/* Login Modal */}
      <LoginModal open={loginOpen} onClose={handleLoginClose} intendedPath={intendedPath} />
      {/* Spacer */}
      <Box sx={{ height: "64px" }} />
    </>
  );
}