import React, { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Card,
  LinearProgress,
  Container,
  Box,
} from "@mui/material";
import { animated, useSpring } from "@react-spring/web";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../types/firebaseConfig";
import PilotAvatar from "./PilotAvatar";
import { useAuth } from "../context/auth";

export default function TaxPrep() {
  const { currentUser } = useAuth();
  const [income, setIncome] = useState<number>(0);
  const [taxSaved, setTaxSaved] = useState<number>(0);
  const taxRate = 0.25;

  const props = useSpring({
    from: { number: 0 },
    to: { number: taxSaved },
    config: { duration: 1000 },
  });

  const handleAddIncome = async () => {
    if (!currentUser) return;
    const taxAmount = income * taxRate;
    try {
      await addDoc(collection(db, "users"), {
        uid: currentUser.uid,
        income,
        taxSavings: taxAmount,
        timestamp: new Date(),
      });
      setTaxSaved((prev) => prev + taxAmount);
      setIncome(0);
    } catch (e) {
      console.error("Error adding income: ", e);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 10 }}>
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
              ? taxSaved > 0
                ? "Tax runway clear!"
                : "Log your gigs, Captain!"
              : "Log in to save taxes!"
          }
        />
        <Typography variant="h5" gutterBottom>
          Freelancer's Tax Logbook
        </Typography>
        {currentUser ? (
          <>
            <Card sx={{ p: 2, mb: 2, width: { xs: "100%", sm: "90%", md: "70%", lg: "60%" } }}>
              <TextField
                label="Gig Income"
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                fullWidth
                sx={{ mb: 2 }}
              />
              <Typography>Estimated Tax (25%): ${(income * taxRate).toFixed(2)}</Typography>
              <Button variant="contained" onClick={handleAddIncome} sx={{ mt: 2 }}>
                Log Income & Save
              </Button>
            </Card>
            <Card sx={{ p: 2, width: { xs: "100%", sm: "90%", md: "70%", lg: "60%" } }}>
              <Typography>Tax Savings Progress</Typography>
              <LinearProgress variant="determinate" value={(taxSaved / 1000) * 100} />
              <Typography sx={{ mt: 1 }}>${taxSaved.toFixed(2)} Saved</Typography>
            </Card>
          </>
        ) : (
          <Typography>Please log in to log your income.</Typography>
        )}
      </Box>
    </Container>
  );
}