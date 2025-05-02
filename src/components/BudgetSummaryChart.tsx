import React, { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import { Box, Typography, Button, List, ListItem, ListItemText } from "@mui/material";
import { BudgetData } from "../types/budget";

const COLORS = ["#1976d2", "#f57c00", "#fbc02d"];

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
  onCreateBudget 
}) => {
  const sum = (arr: { name: string; amount: string }[]) =>
    arr.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0);

  const chartData = [
    { name: "Income", value: sum(data.income) },
    { name: "Expenses", value: sum(data.expenses) },
    { name: "Savings", value: sum(data.savings) },
  ];

  return (
    <Box sx={{ position: "relative", width: "100%", height: 400, px: 2 }}>
      {/* Avatar Image of Pilot */}
      <Box
        component="img"
        src="/images/pennypilot.png"
        alt="Peter the Pilot"
        sx={{
          position: "absolute",
          top: -20,
          left: 8,
          width: 180,
          height: "auto",
          zIndex: 2,
        }}
      />

      {/* Create New Budget Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onCreateBudget("")}
        >
          Create a New Budget
        </Button>
      </Box>

      {/* Pie Chart for Budget Breakdown */}
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h6" gutterBottom>
          Budget Breakdown
        </Typography>
        <ResponsiveContainer width="95%" height="100%">
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

      {/* List of User Budgets */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Your Budgets
        </Typography>
        <List>
          {currentBudgets.map((budget, index) => (
            <ListItem 
              button 
              key={index} 
              onClick={() => onBudgetSelect(budget.data)}
              sx={{ 
                backgroundColor: data === budget.data ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.12)' }
              }}
            >
              <ListItemText primary={budget.name} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default BudgetSummaryChart;
