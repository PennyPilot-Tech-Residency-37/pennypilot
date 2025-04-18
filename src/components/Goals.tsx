import React from "react";
import { Container, Typography, Box } from "@mui/material";
import { useAuth } from "../context/auth";
import PilotAvatar from "./PilotAvatar";

export default function Goals() {
  const { currentUser } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 10 }}>
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
        <PilotAvatar
          message={
            currentUser
              ? "Let's set some financial goals!"
              : "Log in to set your goals!"
          }
        />
        <Typography variant="h5" gutterBottom>
          Financial Goals
        </Typography>
        {currentUser ? (
          <Typography>Your goals will appear here.</Typography>
        ) : (
          <Typography>Please log in to set your financial goals.</Typography>
        )}
      </Box>
    </Container>
  );
}