import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ThemeProvider,
  createTheme,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { BudgetData, Budget } from "../types/types";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";


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
  onBudgetSelect: (budget: Budget) => void;
  currentBudgets: Budget[];
  onCreateBudget: () => void;
  onDeleteBudget: (id: string) => void;
}

const BudgetSummaryChart: React.FC<BudgetSummaryChartProps> = ({
  data,
  onBudgetSelect,
  currentBudgets,
  onCreateBudget,
  onDeleteBudget,
}) => {
  console.log("BudgetSummaryChart received data:", data);
  console.log("Current budgets:", currentBudgets);

  const sum = (arr: { name: string; amount: string }[]) =>
    arr.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0);

  const chartData = [
    { name: "Income", value: sum(data.income) },
    { name: "Expenses", value: sum(data.expenses) },
    { name: "Savings", value: sum(data.savings) },
  ];
  console.log("Chart data:", chartData);

  // Add state for editing and deleting
  const [editBudgetId, setEditBudgetId] = React.useState<string | null>(null);
  const [editBudgetName, setEditBudgetName] = React.useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<string | null>(null);

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
            width: { xs: 200, sm: 250, md: 400 },
            height: "auto",
            zIndex: 2,
          }}
        />

        {/* Create New Budget Button */}
        <Box
          sx={{
            mb: -1,
            mt: 6,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            ml: "80px"
          }}
        >
          <Button
            variant="contained"
            color="primary"
            aria-label="Create a new budget"
            size="small"
            onClick={() => {
              onCreateBudget();
              setEditBudgetId(null);
              setEditBudgetName("");
            }}
            sx={{
              minWidth: 200,
              maxWidth: 250,
              whiteSpace: "nowrap",
              py: 1,
              fontSize: "0.85rem",
              fontWeight: 600,
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              "&:hover": {
                boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                transform: "translateY(-1px)",
                transition: "all 0.2s ease-in-out",
              },
            }}
          >
            Create a New Budget
          </Button>
        </Box>

        {/* List of User Budgets with edit/delete */}
        <Box
          sx={{
            mt: 13,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            p: 1.2,
            width: { xs: "100%", sm: "90%", md: "85%" },
            ml: { xs: 1, sm: 2, md: 3},
            mr: "auto",
            zIndex: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{
              fontSize: { xs: "0.85rem", sm: "1rem" },
              fontWeight: 600,
              letterSpacing: 0.2,
              mb: 0.5,
            }}
          >
            Your Budgets
          </Typography>
          <List sx={{ maxHeight: 120, overflowY: "auto", p: 0 }}>
            {currentBudgets.map((budget) => (
              <ListItem
                button
                dense
                key={budget.id}
                onClick={() => onBudgetSelect(budget)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  minHeight: 32,
                  py: 0.25,
                  px: 1,
                  backgroundColor: data === budget.data ? "primary.light" : "transparent",
                  "&:hover": { backgroundColor: "primary.light" },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {editBudgetId === budget.id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <TextField
                      value={editBudgetName}
                      onChange={e => setEditBudgetName(e.target.value)}
                      size="small"
                      sx={{ flex: 1, mr: 1 }}
                    />
                    <Button onClick={() => {/* handleEditBudgetSave */}} size="small" color="primary" sx={{ mr: 1 }}>Save</Button>
                    <Button onClick={() => setEditBudgetId(null)} size="small">Cancel</Button>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={budget.name}
                      primaryTypographyProps={{
                        fontWeight: data === budget.data ? "bold" : "normal",
                        fontSize: { xs: "0.8rem", sm: "0.95rem" },
                        lineHeight: 1.2,
                      }}
                    />
                    <Box>
                      <IconButton onClick={e => { e.stopPropagation(); setEditBudgetId(budget.id!); setEditBudgetName(budget.name); }} size="small" sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={e => { e.stopPropagation(); setShowDeleteConfirm(budget.id!); }} size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
        {showDeleteConfirm && (
          <Dialog open onClose={() => setShowDeleteConfirm(null)}>
            <DialogTitle>Delete Budget?</DialogTitle>
            <DialogContent>
              Are you sure you want to delete this budget? <b>All information will be permanently deleted.</b>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button onClick={() => { onDeleteBudget(showDeleteConfirm); setShowDeleteConfirm(null); }} color="error" variant="contained">Delete</Button>
            </DialogActions>
          </Dialog>
        )}
        {/* Pie Chart for Budget Breakdown */}
        <Box
          sx={{
            mt: 5,
            height: 450, // Increased height to accommodate lower legend
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            ml: { xs: -1, sm: -1, md: -2 },
            pr: 4,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: "1rem", sm: "1rem" } }}>
            Budget Breakdown
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 40, bottom: 100, left: 40 }}>
              <Pie
                dataKey="value"
                isAnimationActive={false}
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={({ name, value, cx, cy, midAngle, outerRadius, index }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius * 1.3;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text
                      x={x}
                      y={y}
                      fill={COLORS[index % COLORS.length]}
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      fontSize={12}
                    >
                      {`$${value.toFixed(2)}`}
                    </text>
                  );
                }}
                labelLine={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  const total = chartData.reduce((sum, item) => sum + item.value, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return [`${percentage}%`, name];
                }}
                contentStyle={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.95)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ marginTop: 40 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default React.memo(BudgetSummaryChart);