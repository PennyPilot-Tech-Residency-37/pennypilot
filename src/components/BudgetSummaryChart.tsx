import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Box, Typography } from "@mui/material";
import { BudgetData } from "../types/budget";

const COLORS = ["#1976d2", "#f57c00", "#fbc02d"];

interface BudgetSummaryChartProps {
  data: BudgetData;
}

const BudgetSummaryChart: React.FC<BudgetSummaryChartProps> = ({ data }) => {
  const sum = (arr: { name: string; amount: string }[]) =>
    arr.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0);

  const chartData = [
    { name: "Income", value: sum(data.income) },
    { name: "Expenses", value: sum(data.expenses) },
    { name: "Savings", value: sum(data.savings) },
  ];

  return (
<Box
  sx={{
    width: "100%",
    height: 300,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    px: 2, // padding to prevent labels from spilling out
  }}
>
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

  );
};

export default BudgetSummaryChart;
