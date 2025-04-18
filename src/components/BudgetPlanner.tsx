import React, { useState } from "react";
import { Button, TextField, Typography, Card, Container, Box } from "@mui/material";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../types/firebaseConfig";
import PilotAvatar from "./PilotAvatar";
import { useAuth } from "../context/auth";

export default function BudgetPlanner() {
  const { currentUser } = useAuth();
  const [income, setIncome] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  const handleSaveBudget = async () => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "users"), {
        uid: currentUser.uid,
        budgetSet: true,
        income,
        expenses,
        timestamp: new Date(),
      });
      setSaved(true);
    } catch (e) {
      console.error("Error saving budget: ", e);
    }
  };

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
              ? saved
                ? "Great job, co-pilot!"
                : "Let's set your course!"
              : "Log in to plan!"
          }
        />
        <Typography variant="h5" gutterBottom>
          Set Your Flight Plan
        </Typography>
        {currentUser ? (
          <Card sx={{ p: 2, mb: 2, width: { xs: "100%", sm: "90%", md: "70%", lg: "60%" } }}>
            <TextField
              label="Monthly Income"
              type="number"
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Monthly Expenses"
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value))}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleSaveBudget}
              sx={{ mt: 2 }}
              disabled={saved}
            >
              Generate Budget
            </Button>
            {saved && (
              <div style={{ transition: 'opacity 0.5s', opacity: saved ? 1 : 0 }}>
                <Typography color="green">✓ Budget Set! +20 Pilot Points</Typography>
              </div>
            )}
          </Card>
        ) : (
          <Typography>Please log in to set your budget.</Typography>
        )}
      </Box>
    </Container>
  );

} 