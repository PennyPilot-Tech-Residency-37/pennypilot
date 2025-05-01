import { useState } from "react";
import { Container, Typography, Box, Button, Grid } from "@mui/material";
import PilotAvatar from "./PilotAvatar";
import BudgetSetup from "./BudgetGuide";
import BudgetGroup from "./BudgetGroup";
import BudgetSummaryChart from "./BudgetSummaryChart";
import { BudgetData } from "../types/budget";

const BudgetBoard = () => {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const handleFinishSetup = (data: BudgetData) => {
    setBudgetData(data);
    setShowSetup(false);
  };

  return (
    <>
    {budgetData && (
      <Box sx={{ position: "absolute", top: 16, left: 16, mt: 8 }}>
        <PilotAvatar message="" sx={{ width: 270, pt: 1 }} />
      </Box>
    )}
    <Container maxWidth="xl" sx={{ mt: 8, position: "relative" }}>
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

        <Typography variant="h4" gutterBottom>
          {budgetData ? "Your Budget" : "Create Your Budget"}
        </Typography>

        {!showSetup && (
          <Button variant="contained" onClick={() => setShowSetup(true)}>
            Create a New Budget
          </Button>
        )}

        {showSetup && (
          <BudgetSetup open={showSetup} onClose={() => setShowSetup(false)} onFinish={handleFinishSetup} />
        )}

        {budgetData && (
            <Box
            sx={{
              border: "2px solid #e0e0e0",
              borderRadius: 2,
              padding: 3,
              backgroundColor: "#fafafa",
            }}
          >
          <Grid container spacing={4} sx={{ mt: 4, border: "2 solid red" }} alignItems="flex-start">
            <Grid item xs={12} md={7}>
              <Typography variant="h6" align="left" gutterBottom>
                Budget Table
              </Typography>
              <Box sx={{ width: "100%" }}>
                <BudgetGroup title="Income" items={budgetData.income} />
                <BudgetGroup title="Expenses" items={budgetData.expenses} />
                <BudgetGroup title="Savings" items={budgetData.savings} />
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
            <Box sx={{ width: "100%" }}>
              <BudgetSummaryChart data={budgetData} />
              </Box>
            </Grid>
          </Grid>
          </Box>
        )}
      </Box>
    </Container>
    </>
  );
};

export default BudgetBoard;
