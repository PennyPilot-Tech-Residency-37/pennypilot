import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../context/auth"; // Updated path

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Signup
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError("");
      onClose();
    } catch (err) {
      setError("Failed to log in. Check your credentials.");
    }
  };

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setError("");
      onClose();
    } catch (err) {
      setError("Failed to sign up. Try a different email.");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: { xs: "90%", sm: 400 },
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} centered>
          <Tab label="Login" />
          <Tab label="Sign Up" />
        </Tabs>
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          {tab === 0 ? "Welcome Back, Captain!" : "Join the Crew!"}
        </Typography>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={tab === 0 ? handleLogin : handleSignup}
          fullWidth
        >
          {tab === 0 ? "Log In" : "Sign Up"}
        </Button>
      </Box>
    </Modal>
  );
}