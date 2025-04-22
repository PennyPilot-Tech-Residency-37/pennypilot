import React, { useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  IconButton,
  Divider,
  LinearProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import Confetti from "react-confetti";

const steps = ["Income", "Expenses", "Savings", "Summary", "Success"];
const COLORS = ["#1976d2", "#f57c00", "#fbc02d"];

const BudgetSetup = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const [income, setIncome] = useState([""]);
  const [expenses, setExpenses] = useState([""]);
  const [savings, setSavings] = useState([""]);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));
  const handleSkip = () => handleNext();
  const handleClose = () => {
    setStep(0);
    setOpen(false);
    setShowConfetti(false);
  };

  const handleFinish = () => {
    setStep(4);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 10000); // confetti duration in milliseconds
  };

  const handleAddLine = (type: string) => {
    if (type === "income") setIncome([...income, ""]);
    if (type === "expenses") setExpenses([...expenses, ""]);
    if (type === "savings") setSavings([...savings, ""]);
  };

  const handleLineChange = (type: string, index: number, value: string) => {
    const update = (arr: string[]) => {
      const updated = [...arr];
      updated[index] = value;
      return updated;
    };
    if (type === "income") setIncome(update(income));
    if (type === "expenses") setExpenses(update(expenses));
    if (type === "savings") setSavings(update(savings));
  };

  const handleDeleteLine = (type: string, index: number) => {
    const remove = (arr: string[]) => arr.filter((_, i) => i !== index);
    if (type === "income") setIncome(remove(income));
    if (type === "expenses") setExpenses(remove(expenses));
    if (type === "savings") setSavings(remove(savings));
  };

  const sum = (arr: string[]) =>
    arr.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);

  const chartData = [
    { name: "Income", value: sum(income) },
    { name: "Expenses", value: sum(expenses) },
    { name: "Savings", value: sum(savings) },
  ];

  const renderDynamicFields = (type: string, values: string[]) => (
    <Box>
      {values.map((value, index) => (
        <Box key={index} display="flex" alignItems="center" mb={1}>
          <TextField
            fullWidth
            variant="outlined"
            value={value}
            onChange={(e) => handleLineChange(type, index, e.target.value)}
            autoFocus={value === ""}
          />
          <IconButton onClick={() => handleDeleteLine(type, index)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Button
        fullWidth
        variant="outlined"
        onClick={() => handleAddLine(type)}
        sx={{
          borderStyle: "dashed",
          mt: 1,
          textTransform: "none",
        }}
      >
        + Add a new line
      </Button>
    </Box>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              How much do you earn?
            </Typography>
            {renderDynamicFields("income", income)}
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Add your expenses
            </Typography>
            {renderDynamicFields("expenses", expenses)}
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Set a savings goal
            </Typography>
            {renderDynamicFields("savings", savings)}
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Monthly Budget
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  isAnimationActive={false}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Box>
        );
      case 4:
        return (
          <Box textAlign="center">
            {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}
            <Typography variant="h5" gutterBottom>
              Budget created. Way to go!
            </Typography>
            <Box display="flex" justifyContent="flex-end" mt={4}>
              <Button variant="contained" onClick={handleClose}>
                Proceed to my budget
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Create a New Budget
      </Button>

      <Backdrop
        open={open}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1, backdropFilter: "blur(6px)" }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "90%", maxWidth: 500, textAlign: "center" }}>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            Step {step + 1} of {steps.length}
          </Typography>

          <LinearProgress variant="determinate" value={((step + 1) / steps.length) * 100} sx={{ mb: 3 }} />

          {renderStepContent()}

          {step < 4 && (
            <Box mt={4} display="flex" justifyContent="space-between">
              <Button onClick={handleBack} disabled={step === 0}>
                Back
              </Button>
              <Box>
                <Button onClick={handleSkip} sx={{ mr: 2 }}>
                  Skip
                </Button>
                <Button variant="contained" onClick={step === steps.length - 2 ? handleFinish : handleNext}>
                  {step === steps.length - 2 ? "Finish" : "Next"}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Backdrop>
    </>
  );
};

export default BudgetSetup;
