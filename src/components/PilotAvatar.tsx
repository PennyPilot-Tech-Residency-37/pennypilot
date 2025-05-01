import * as React from "react";
import { Typography, Paper, Box, SxProps, Theme } from "@mui/material";
import { useSpring } from "@react-spring/web";

interface PilotAvatarProps {
  message: string;
  sx?: SxProps<Theme>;
}

export default function PilotAvatar({ message, sx }: PilotAvatarProps) {
  const bubbleProps = useSpring({
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
    config: { duration: 200 },
  });

  return (
    <Box sx={{ position: "relative", mb: 4, display: "flex", justifyContent: "center", alignItems: "center", width: "100%", ...sx }}>
      <Box
        component="img"
        src="/images/pennypilot.png"
        sx={{
          width: { xs: "300px", sm: "350px", md: "450px", lg: "650px" },
          height: "auto",
          objectFit: "contain",
          maxWidth: "100%"
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "60%",
          // opacity: bubbleProps.opacity.get(),
          transform: `translateX(-50%) scale(${bubbleProps.scale.get()})`
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: "20px",
            backgroundColor: "#f5f5f5",
            maxWidth: { xs: "220px", sm: "300px", md: "400px" },
          }}
        >
          <Typography variant="body1" sx={{ wordWrap: "break-word", fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" } }}>
            {message}
          </Typography>
        </Paper>
      </div>
    </Box>
  );
}