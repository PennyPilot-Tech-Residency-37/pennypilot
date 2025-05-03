import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { BudgetData } from "../types/types";

const COLORS = ["#1976d2", "#f57c00", "#fbc02d"];

// Custom theme for consistency
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "rgba(25, 118, 210, 0.12)",
    },
  },
});

interface BudgetSummaryChartProps {
  data: BudgetData;
  onBudgetSelect: (budget: BudgetData) => void;
  currentBudgets: { name: string; data: BudgetData }[];
  onCreateBudget: (budgetName: string) => void;
}

const BudgetSummaryChart: React.FC<BudgetSummaryChartProps> = ({
  data,
  onBudgetSelect,
  currentBudgets,
  onCreateBudget,
}) => {
  const sum = (arr: { name: string; amount: string }[]) =>
    arr.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0);

  const chartData = [
    { name: "Income", value: sum(data.income) },
    { name: "Expenses", value: sum(data.expenses) },
    { name: "Savings", value: sum(data.savings) },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ position: "relative", width: "100%", px: 2 }}>
        {/* PennyPilot Image */}
        <Box
          component="img"
          src="/images/pennypilot.png"
          alt="Peter the Pilot"
          sx={{
            position: "absolute",
            top: -80,
            left: -110,
            width: { xs: 200, sm: 250, md: 400 }, // Responsive scaling
            height: "auto",
            zIndex: 2
          }}
        />

        {/* Create New Budget Button */}
        <Box sx={{ mb: 9, textAlign: "center", mt: 7, width: { xs: "100%", sm: "58%" }, px: { xs: 10, sm: 20 } }}>
          <Button
            variant="contained"
            color="primary"
            aria-label="Create a new budget"
            fullWidth
            onClick={() => onCreateBudget("")}
            sx={{ maxWidth: 400, mx: "auto" }}
          >
            Create a New Budget
          </Button>
        </Box>

        {/* Pie Chart for Budget Breakdown */}
        <Box
          sx={{
            height: 300,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Budget Breakdown
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
              <Pie
                dataKey="value"
                isAnimationActive={false}
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* List of User Budgets */}
        <Box sx={{ mt: 4, border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Your Budgets
          </Typography>
          <List sx={{ maxHeight: 200, overflowY: "auto" }}>
            {currentBudgets.map((budget, index) => (
              <ListItem
                button
                key={index}
                onClick={() => onBudgetSelect(budget.data)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: data === budget.data ? "primary.light" : "transparent",
                  "&:hover": { backgroundColor: "primary.light" },
                }}
              >
                <ListItemText
                  primary={budget.name}
                  primaryTypographyProps={{ fontWeight: data === budget.data ? "bold" : "normal" }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default React.memo(BudgetSummaryChart);