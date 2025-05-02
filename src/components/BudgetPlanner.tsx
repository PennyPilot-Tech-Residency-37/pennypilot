import { useState } from "react";
import { Container, Typography, Box, Button, Grid } from "@mui/material";
import PilotAvatar from "./PilotAvatar";
import BudgetSetup from "./BudgetGuide";
import BudgetGroup from "./BudgetGroup";
import BudgetSummaryChart from "./BudgetSummaryChart";
import { BudgetData } from "../types/types";

interface Budget {
  name: string;
  data: BudgetData;
}

const BudgetBoard = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const handleFinishSetup = (data: BudgetData, name: string) => {
    const newBudget = {
      name: name || `Budget ${budgets.length + 1}`,
      data
    };
    setBudgets([...budgets, newBudget]);
    setCurrentBudget(newBudget);
    setShowSetup(false);
  };

  const handleBudgetSelect = (budget: BudgetData) => {
    const selectedBudget = budgets.find(b => b.data === budget);
    if (selectedBudget) {
      setCurrentBudget(selectedBudget);
    }
  };

  const handleCreateNewBudget = () => {
    setShowSetup(true);
  };

  const handleBudgetUpdate = (type: 'income' | 'expenses' | 'savings', items: { name: string; amount: string; spent?: string }[]) => {
    if (!currentBudget) return;

    const updatedBudget = {
      ...currentBudget,
      data: {
        ...currentBudget.data,
        [type]: items
      }
    };

    setCurrentBudget(updatedBudget);
    setBudgets(budgets.map(b => b === currentBudget ? updatedBudget : b));
  };

  return (
    <>
    {currentBudget && (
      <Box sx={{ position: "absolute", top: 16, left: 16, mt: 6, mb: 5 }}>
        <PilotAvatar message="" sx={{ width: 230, pt: 1 }} />
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
          {currentBudget ? "Your Budget" : "Create Your Budget"}
        </Typography>

        {!showSetup && !currentBudget && (
          <Button variant="contained" onClick={() => setShowSetup(true)}>
            Create a New Budget
          </Button>
        )}

        {showSetup && (
          <BudgetSetup 
            open={showSetup} 
            onClose={() => {
              setShowSetup(false);
            }} 
            onFinish={handleFinishSetup} 
          />
        )}

        {currentBudget && (
          <Box
            sx={{
              border: "2px solid #e0e0e0",
              borderRadius: 2,
              padding: 3,
              backgroundColor: "#fafafa",
            }}
          >
            <Grid container spacing={4} sx={{ mt: 4 }} alignItems="flex-start">
              <Grid item xs={12} md={7}>
                <Typography variant="h6" align="left" gutterBottom>
                  Budget Table
                </Typography>
                <Box sx={{ width: "100%" }}>
                  <BudgetGroup 
                    title="Income" 
                    items={currentBudget.data.income} 
                    onItemsChange={(items) => handleBudgetUpdate('income', items)}
                  />
                  <BudgetGroup 
                    title="Expenses" 
                    items={currentBudget.data.expenses} 
                    onItemsChange={(items) => handleBudgetUpdate('expenses', items)}
                  />
                  <BudgetGroup 
                    title="Savings" 
                    items={currentBudget.data.savings} 
                    onItemsChange={(items) => handleBudgetUpdate('savings', items)}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ width: "100%" }}>
                  <BudgetSummaryChart 
                    data={currentBudget.data} 
                    onBudgetSelect={handleBudgetSelect}
                    currentBudgets={budgets}
                    onCreateBudget={handleCreateNewBudget}
                  />
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
