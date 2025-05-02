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
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import Confetti from "react-confetti";
import { BudgetData } from "../types/budget";
import CloseIcon from "@mui/icons-material/Close";

interface BudgetSetupProps {
  open: boolean;
  onFinish: (data: BudgetData, name: string) => void;
  onClose: () => void;
}

const steps = ["Name", "Income", "Expenses", "Savings", "Summary", "Success"];
const COLORS = ["#1976d2", "#f57c00", "#fbc02d"];

const BudgetSetup: React.FC<BudgetSetupProps> = ({ open, onFinish, onClose }) => {
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [budgetName, setBudgetName] = useState("");

  const [income, setIncome] = useState([{ name: "", amount: "" }]);
  const [expenses, setExpenses] = useState([{ name: "", amount: "" }]);
  const [savings, setSavings] = useState([{ name: "", amount: "" }]);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));
  const handleSkip = () => handleNext();
  const handleClose = () => {
    setStep(0);
    setShowConfetti(false);
    setBudgetName("");
    onClose();
  };

  const handleFinish = () => {
    setShowConfetti(true);
    setStep(5);
    setTimeout(() => {
      const finalData = { income, expenses, savings };
      onFinish(finalData, budgetName);
    }, 4000);
  };

  const handleAddLine = (type: string) => {
    const newItem = { name: "", amount: "" };
    if (type === "income") setIncome([...income, newItem]);
    if (type === "expenses") setExpenses([...expenses, newItem]);
    if (type === "savings") setSavings([...savings, newItem]);
  };

  const validateGuideField = (key: "name" | "amount", value: string): boolean => {
    if (value === "") return true;
    if (key === "name") return /^[a-zA-Z\s]*$/.test(value);
    if (key === "amount") return /^\d*\.?\d*$/.test(value);
    return true;
  };
  
  const handleChange = (
    type: string,
    index: number,
    key: "name" | "amount",
    value: string
  ) => {
    if (!validateGuideField(key, value)) return;
    updateField(type, index, key, value);
  };
  
  const updateField = (
    type: string,
    index: number,
    key: "name" | "amount",
    value: string
  ) => {
    const update = (arr: { name: string; amount: string }[]) => {
      const updated = [...arr];
      updated[index][key] = value;
      return updated;
    };
    if (type === "income") setIncome(update(income));
    if (type === "expenses") setExpenses(update(expenses));
    if (type === "savings") setSavings(update(savings));
  };

  const handleDeleteLine = (type: string, index: number) => {
    const remove = (arr: { name: string; amount: string }[]) => arr.filter((_, i) => i !== index);
    if (type === "income") setIncome(remove(income));
    if (type === "expenses") setExpenses(remove(expenses));
    if (type === "savings") setSavings(remove(savings));
  };

  const sum = (arr: { name: string; amount: string }[]) =>
    arr.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0);

  const chartData = [
    { name: "Income", value: sum(income) },
    { name: "Expenses", value: sum(expenses) },
    { name: "Savings", value: sum(savings) },
  ];

  const renderDynamicFields = (type: string, values: { name: string; amount: string }[]) => (
    <Box>
      {values.map((item, index) => (
        <Grid container spacing={1} alignItems="center" key={index} mb={1}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Category"
              value={item.name}
              onChange={(e) => handleChange(type, index, "name", e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              type="number"
              label="Amount"
              value={item.amount}
              onChange={(e) => handleChange(type, index, "amount", e.target.value)}
            />
          </Grid>
          <Grid item xs={2}>
            <IconButton onClick={() => handleDeleteLine(type, index)}>
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
      <Button
        fullWidth
        variant="outlined"
        onClick={() => handleAddLine(type)}
        sx={{ borderStyle: "dashed", mt: 1, textTransform: "none" }}
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
              What would you like to name your budget?
            </Typography>
            <TextField
              fullWidth
              label="Budget Name"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Add your income
            </Typography>
            {renderDynamicFields("income", income)}
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Add your expenses
            </Typography>
            {renderDynamicFields("expenses", expenses)}
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Add your savings
            </Typography>
            {renderDynamicFields("savings", savings)}
          </Box>
        );
      case 4:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Monthly Budget Summary
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
      case 5:
        return (
          <Box textAlign="center">
            {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}
            <Typography variant="h5" gutterBottom>
              Budget created. Way to go!
            </Typography>
            <Box display="flex" justifyContent="center" mt={4}>
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
    <Backdrop
      open={open}
      onClick={onClose}
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1, backdropFilter: "blur(6px)" }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100vw",
          height: "100vh",
          px: 2,
        }}
      >
        <Paper
          onClick={(e) => { e.stopPropagation() }}
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: 800,
            textAlign: "center",
            p: 0,
            borderRadius: 2,
            overflow: "hidden",
            minHeight: 600,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ width: "100%", backgroundColor: "#0c2340", py: 1, px: 2 }}>
            <Grid container alignItems="center">
              <Grid item xs={4}>
                <Box display="flex" alignItems="center">
                  <img src="/images/PennyPilot-logo.png" alt="PennyPilot Logo" style={{ height: 60 }} />
                  <Typography variant="h6" color="white" fontWeight={600} sx={{ ml: 1 }}>
                    PennyPilot
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: "center" }}>
                <Typography variant="h5" fontWeight="bold" color="white">
                  Create a Budget
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} sx={{ px: 2 }}>
                  <Typography variant="body2" color="white" sx={{ whiteSpace: "nowrap" }}>
                    Step {step + 1} of 6
                  </Typography>
                  <IconButton onClick={onClose} sx={{ color: "white" }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ px: 3, pt: 1, pb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={((step + 1) / steps.length) * 100}
              sx={{
                height: 6,
                borderRadius: 5,
                '& .MuiLinearProgress-bar': {
                  transition: 'transform 0.5s ease-in-out',
                },
              }}
            />
          </Box>

          <Box sx={{ px: 4, flexGrow: 1, py: 5 }}>{renderStepContent()}</Box>

          {step < 5 && (
            <Box
              sx={{
                px: 4,
                pb: 4,
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <Button onClick={handleBack} disabled={step === 0}>
                Back
              </Button>
              <Box>
                <Button onClick={handleSkip} sx={{ mr: 2 }}>
                  Skip
                </Button>
                <Button
                  variant="contained"
                  onClick={step === steps.length - 2 ? handleFinish : handleNext}
                  disabled={step === 0 && !budgetName.trim()}
                >
                  {step === steps.length - 2 ? "Finish" : "Next"}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Backdrop>
  );
};

export default BudgetSetup;
