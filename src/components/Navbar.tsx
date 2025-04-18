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
import { Link, useLocation } from "react-router-dom";
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
  const { currentUser } = useAuth();
  const location = useLocation();

  const logoProps = useSpring({
    from: { rotate: 0 },
    to: { rotate: 360 },
    config: { duration: 1000 },
    reset: true,
    onRest: () => {
      logoProps.rotate.set(0);
    }
  });

  useEffect(() => {
    logoProps.rotate.start();
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLoginOpen = () => {
    setLoginOpen(true);
    logoProps.rotate.start();
  };
  const handleLoginClose = () => setLoginOpen(false);
  const handleLogout = () => signOut(auth);

  const navItems = [
    { label: "Home", path: currentUser ? "/dashboard" : "/" },
    { label: "Budget", path: "/budget" },
    { label: "Tax Prep", path: "/tax-prep" },
    { label: "Goals", path: "/goals" },
  ];

  const handleNavClick = () => {
    logoProps.rotate.start();
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ width: 250 }}>
      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.label}
            component={Link}
            to={item.path}
            onClick={handleNavClick}
            sx={{ color: "inherit", textDecoration: "none" }}
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
            <Button color="inherit" onClick={handleLoginOpen}>
              Login
            </Button>
          )}
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" color="primary" sx={{ top: 0, left: 0, right: 0, zIndex: 1100 }}>
        <Toolbar sx={{ minHeight: 64, display: "flex", alignItems: "center" }}>
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
              style={{
                transform: logoProps.rotate.to(r => `rotate(${r}deg)`),
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
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
          >
            PennyPilot
          </Typography>
          {/* Greeting */}
          {currentUser && (
            <Typography sx={{ mr: 2, display: { xs: "none", sm: "block" } }}>
              Hello, {currentUser.email?.split("@")[0]}!
            </Typography>
          )}
          {/* Desktop Nav Buttons */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                color="inherit"
                component={Link}
                to={item.path}
                onClick={handleNavClick}
                sx={{ mx: 1 }}
              >
                {item.label}
              </Button>
            ))}
            {currentUser ? (
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Button color="inherit" onClick={handleLoginOpen}>
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
      <LoginModal open={loginOpen} onClose={handleLoginClose} />
      {/* Spacer */}
      <Box sx={{ height: "64px" }} />
    </>
  );
}