import { useState, useEffect } from "react";
import React from "react";
import { Card, Typography, Container, Box, Button, List, ListItem, ListItemText, CircularProgress, Snackbar, Alert, LinearProgress, Chip, Avatar } from "@mui/material";
import { collection, getDocs, query, where, onSnapshot, orderBy, setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../types/firebaseConfig";
import PilotAvatar from "./PilotAvatar";
import { useAuth } from "../context/auth";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { alpha, Theme } from '@mui/material/styles';
import { useNavigate } from "react-router-dom";
import { BudgetData } from "../types/types";
import { motion, useAnimation } from "framer-motion";
import axios from "axios";
import 'jspdf-autotable';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
} from "date-fns";
import { usePlaid } from "../context/PlaidContext";
import { usePlaidLink } from "react-plaid-link";

interface UserData {
  budgetSet: boolean;
}

interface BudgetItem {
  name: string;
  amount: string;
}

interface DeductibleExpense extends BudgetItem {
  deductibleAmount: number;
  category: string;
}

interface BudgetDataStructure {
  income: BudgetItem[];
  expenses: BudgetItem[];
  savings: DeductibleExpense[];
}

interface Budget {
  id?: string;
  name: string;
  data: BudgetDataStructure;
  createdAt?: string;
}

interface DemoGoal {
  id: number;
  name: string;
  amount: number;
  currentAmount: number;
  completed: boolean;
}

// Add type guard to check if a goal is a Budget
function isBudget(goal: Budget | DemoGoal): goal is Budget {
  return 'data' in goal;
}

const BUDGET_COLORS = ["#1976d2", "#f57c00", "#fbc02d"];
const DEDUCTION_COLORS = ["#1976d2", "#f57c00", "#fbc02d", "#43a047"];

const groupExpensesByCategory = (expenses: DeductibleExpense[]) => {
  const grouped = expenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += Number(expense.deductibleAmount);
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value
  }));
};

const LoadingSpinner = () => (
  <Box
    component="img"
    src="/images/PennyPilot-logo.png"
    alt="Loading..."
    sx={{
      width: 60,
      height: 60,
      display: 'block',
      animation: 'spin 1s linear infinite',
      '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      }
    }}
  />
);

// Copy badgeData from GoalsSideBar or import it if possible
const badgeData = [
  {
    tooltip: "Earned for creating your 1st goal",
    imgSrc: "/images/first flight badge.png",
    altText: "First Flight",
    unlockAt: 1,
  },
  {
    tooltip: "Earned for creating your 5th goal",
    imgSrc: "/images/planning cadet badge.png",
    altText: "Planning Cadet",
    unlockAt: 5,
  },
  {
    tooltip: "Earned for creating your 10th goal",
    imgSrc: "/images/goal getter badge.png",
    altText: "Goal Getter",
    unlockAt: 10,
  },
  {
    tooltip: "Earned for creating your 15th goal",
    imgSrc: "/images/mission strategist badge.png",
    altText: "Mission Strategist",
    unlockAt: 15,
  },
  {
    tooltip: "Earned for creating your 20th goal",
    imgSrc: "/images/flight commander badge.png",
    altText: "Flight Commander",
    unlockAt: 20,
  },
  {
    tooltip: "Earned for creating your 25th goal",
    imgSrc: "/images/elite pathfinder badge.png",
    altText: "Elite Pathfinder",
    unlockAt: 25,
  },
];

const demoGoals = [
  {
    id: 1,
    name: "Emergency Fund",
    amount: 5000,
    currentAmount: 3500,
    completed: false,
  },
  {
    id: 2,
    name: "Vacation",
    amount: 2000,
    currentAmount: 2000,
    completed: true,
  },
];

const PiePercentTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const value = payload[0].value;
    const total = payload[0].payload && payload[0].payload.total ? payload[0].payload.total : payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
    if (total > 0) {
      const percent = ((value / total) * 100).toFixed(1);
      return (
        <div style={{ background: '#fff', border: '1px solid #ccc', padding: '4px 8px', borderRadius: 4 }}>
          <span>{percent}%</span>
        </div>
      );
    }
  }
  return null;
};

const getDeductionChartHeight = (numLegendItems: number) => {
  const rows = Math.ceil(numLegendItems / 3);
  return 260 + rows * 32;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const planeControls = useAnimation();
  const [userData, setUserData] = useState<UserData>({ budgetSet: false });
  const [deductibleExpenses, setDeductibleExpenses] = useState<DeductibleExpense[]>(() => {
    try {
      const stored = localStorage.getItem("deductibleExpenses");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [totalDeductibleSpent, setTotalDeductibleSpent] = useState<number>(0);
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const stored = localStorage.getItem("budgets");
    if (!stored) return [];
    try { return JSON.parse(stored); } catch (e) { return []; }
  });
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(() => {
    const stored = localStorage.getItem("currentBudget");
    if (!stored) return null;
    try { return JSON.parse(stored); } catch (e) { return null; }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [plaidAccounts, setPlaidAccounts] = useState<any[]>([]);
  const [plaidTransactions, setPlaidTransactions] = useState<any[]>([]);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [plaidError, setPlaidError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goals, setGoals] = useState<any[]>(() => {
    const stored = localStorage.getItem("goals");
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((goal: any) => ({
        ...goal,
        startDate: new Date(goal.startDate),
        dueDate: new Date(goal.dueDate),
      }));
    } catch (e) {
      return [];
    }
  });
  const { fetchLinkToken, openPlaid, ready } = usePlaid();
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const calculateSavingsTotal = (savings: DeductibleExpense[]): number => {
    return savings.reduce((sum: number, item: DeductibleExpense) => {
      return sum + item.deductibleAmount;
    }, 0);
  };

  const startPlaneAnimation = async () => {
    await planeControls.start({
      x: "100vw",
      y: 0,
      rotate: 0,
      transition: { duration: 0 },
    });

    await planeControls.start({
      x: "-100vw",
      y: 0,
      transition: {
        duration: 6,
        ease: "linear",
      },
    });
  };

  useEffect(() => {
    startPlaneAnimation();
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        startPlaneAnimation();
      }, 6000); 
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [planeControls]);

  // Sync with localStorage for budgets and currentBudget
  useEffect(() => {
    const syncFromStorage = () => {
      // Budgets
      const storedBudgets = localStorage.getItem("budgets");
      if (storedBudgets) {
        try { 
          const parsed = JSON.parse(storedBudgets);
          setBudgets(parsed);
          // If no budget is selected, select the first one
          if (!selectedBudget && parsed.length > 0) {
            setSelectedBudget(parsed[0]);
          }
        } catch (e) {
        }
      }
      // Current Budget
      const storedCurrent = localStorage.getItem("currentBudget");
      if (storedCurrent) {
        try { 
          const parsed = JSON.parse(storedCurrent);
          setSelectedBudget(parsed);
        } catch (e) {
        }
      }
    };
    window.addEventListener('storage', syncFromStorage);
    syncFromStorage();
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  // Save selected budget to localStorage when it changes
  useEffect(() => {
    if (selectedBudget) {
      localStorage.setItem("currentBudget", JSON.stringify(selectedBudget));
    }
  }, [selectedBudget]);

  // Keep Plaid data separate
  useEffect(() => {
    const storedAccounts = localStorage.getItem("plaidAccounts");
    if (storedAccounts) {
      try {
        setPlaidAccounts(JSON.parse(storedAccounts));
      } catch (e) {
      }
    }
  }, []);

  useEffect(() => {
    if (plaidAccounts.length > 0) {
      localStorage.setItem("plaidAccounts", JSON.stringify(plaidAccounts));
    }
  }, [plaidAccounts]);

  // Update total deductible spent when expenses change
  useEffect(() => {
    setTotalDeductibleSpent(deductibleExpenses.reduce((sum, expense) => sum + Number(expense.deductibleAmount), 0));
  }, [deductibleExpenses]);

  // Main effect: fetch Plaid data, cache it, or use fallback
  useEffect(() => {
    if (!currentUser) return;
    setPlaidLoading(true);
    setPlaidError(null);
    setUsingCache(false);

    const fetchPlaidData = async () => {
      try {
        const accountsRes = await axios.get(`/api/linked_accounts/${currentUser.uid}`, {
          headers: { key: "dev-test-key" }
        });
        if (accountsRes.data && accountsRes.data.length > 0) {
          setPlaidAccounts(accountsRes.data);
          localStorage.setItem("plaidAccounts", JSON.stringify(accountsRes.data));
          setPlaidError(null);
        }

        const transactionsRes = await axios.get(`/api/transactions`, {
          params: { user_id: currentUser.uid },
          headers: { key: "dev-test-key" }
        });
        setPlaidTransactions(transactionsRes.data);

        setPlaidLoading(false);
      } catch (err) {
        // Only show error if we don't have any cached data
        const cachedAccounts = localStorage.getItem("plaidAccounts");
        if (!cachedAccounts) {
          setPlaidError("Could not fetch live bank data. Showing cached data if available.");
        }
        setPlaidLoading(false);
      }
    };

    fetchPlaidData();
    const onFocus = () => fetchPlaidData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line
  }, [currentUser]);

  const totalBalance = plaidAccounts.reduce((sum, acct) => sum + (acct.balances?.current || 0), 0);
  const recentSpending = plaidTransactions
    .filter(txn => txn.amount < 0)
    .slice(0, 5)
    .map(txn => ({ ...txn, amount: Math.abs(txn.amount) }));

  const cardStyle = {
    p: 3,
    width: { xs: "100%", sm: "90%", md: "70%", lg: "60%" },
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: (theme: Theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    border: '1px solid',
    borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
    borderRadius: 2,
    background: (theme: Theme) => `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
  };

  const buttonStyle = {
    mt: 2,
    transition: 'all 0.2s ease-in-out',
    '&:active': {
      transform: 'scale(0.95)',
    },
    '&:hover': {
      boxShadow: (theme: Theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
  };

  const sum = (arr: { name: string; amount: string }[]) =>
    arr?.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0) || 0;

  const budgetChartData = selectedBudget ? [
    { name: "Income", value: sum(selectedBudget.data.income) },
    { name: "Expenses", value: sum(selectedBudget.data.expenses) },
    { name: "Savings", value: sum(selectedBudget.data.savings) },
  ] : [];

  const handleBudgetSelect = (budget: Budget) => {
    setSelectedBudget(budget);
  };


  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("goals");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const updatedGoals = parsed.map((goal: any) => ({
            ...goal,
            startDate: new Date(goal.startDate),
            dueDate: new Date(goal.dueDate),
          }));
          setGoals(updatedGoals);
          
          // Set initial selected goal if none is selected
          if (!selectedGoalId && updatedGoals.length > 0) {
            setSelectedGoalId(updatedGoals[0].id.toString());
          }
        } catch (e) {
        }
      }
    };

    // Listen for changes to localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Initial load
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedGoalId]);

  const goalsList = goals;
  const selectedGoal = goalsList.find(g => g.id.toString() === selectedGoalId);
  const earnedBadges = badgeData.filter(badge => goalsList.length >= badge.unlockAt);

  // Helper to calculate total steps for a goal
  function getTotalSteps(goal: any) {
    if (!goal || !goal.frequency || !goal.startDate || !goal.dueDate) return 1;
    const start = new Date(goal.startDate);
    const end = new Date(goal.dueDate);
    switch (goal.frequency) {
      case "daily":
        return Math.max(1, differenceInDays(end, start));
      case "weekly":
        return Math.max(1, differenceInWeeks(end, start));
      case "monthly":
        return Math.max(1, differenceInMonths(end, start));
      default:
        return 1;
    }
  }

  // Calculate savedAmount for the selected goal
  let savedAmount = 0;
  if (selectedGoal) {
    const totalSteps = getTotalSteps(selectedGoal);
    const stepAmount = selectedGoal.amount / totalSteps;
    if (Array.isArray(selectedGoal.stepsCompleted)) {
      savedAmount = selectedGoal.stepsCompleted.length * stepAmount;
    } else {
      savedAmount = 0;
    }
  }
  const chartData = selectedGoal ? [
    { name: "Saved", value: savedAmount },
    { name: "Target", value: selectedGoal.amount }
  ] : [];
  
  // Plaid Link hook
  const { open: plaidLinkOpen, ready: plaidLinkReady } = usePlaidLink({
    token: linkToken || '',
    onSuccess: async (public_token, metadata) => {
      try {
        await axios.post("/api/exchange_public_token", {
          public_token,
          key: "dev-test-key",
          user_id: currentUser?.uid,
        });
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Plaid token exchange failed:", err);
        }
      }
    },
    onExit: (err, metadata) => {
      if (err) console.error("Plaid Link error:", err);
    },
  });

  const handleConnectBank = async () => {
    setPlaidLoading(true);
    try {
      const res = await axios.post("/api/create_link_token", {
        key: "dev-test-key",
        user_id: currentUser?.uid,
      });
      setLinkToken(res.data.link_token);
    } catch (err) {
      setPlaidLoading(false);
    }
  };

  // Open Plaid modal when ready and linkToken is set
  useEffect(() => {
    if (linkToken && plaidLinkReady) {
      plaidLinkOpen();
      setPlaidLoading(false);
    }
  }, [linkToken, plaidLinkReady, plaidLinkOpen]);

  const deductionLegendItems = groupExpensesByCategory(deductibleExpenses);
  const deductionChartHeight = getDeductionChartHeight(deductionLegendItems.length);

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await axios.delete(`/api/linked_accounts/${currentUser?.uid}`, {
        headers: { key: 'dev-test-key' }
      });
      setPlaidAccounts(prevAccounts => prevAccounts.filter(acc => acc.account_id !== accountId));
    } catch (error) {
      setError("Failed to remove bank account");
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        overflowX: "hidden",
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: "url(/images/PennyPilot-cloud-background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.5,
          zIndex: -1,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            minHeight: "calc(100vh - 128px)",
            px: { xs: 2, sm: 0 },
            gap: 2,
          }}
        >
          <Box sx={{ 
            position: 'relative', 
            mt: 9, 
            mb: -5, 
            pt: 4,
            display: 'flex',
            justifyContent: 'flex-end',
            width: '100%',
            pr: { xs: 2, sm: 4, md: 6 }
          }}>
            <PilotAvatar 
              message={currentUser ? `Ready for takeoff, ${currentUser.email?.split("@")[0]}?` : "Log in to fly!"} 
              sx={{ position: 'relative', zIndex: 2 }}
            />
            <motion.div
              style={{
                position: "absolute",
                top: "2%", 
                left: 0,
                zIndex: 1,
                width: "20vw",
                maxWidth: "150px",
                minWidth: "100px",
              }}
              animate={planeControls}
            >
              <img
                src="/images/PennyPilot-plane.png"
                alt="Blue Cartoon Plane"
                style={{ width: "100%", height: "auto" }}
              />
            </motion.div>
          </Box>
          
          <Typography variant="h5" gutterBottom>
            Welcome, Captain! Your Flight Path:
          </Typography>
          
          {currentUser && (
            <>
              <Card sx={{...cardStyle, mb: 4}}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>Budget Overview</Typography>
                    {isLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
                        <LoadingSpinner />
                      </Box>
                    ) : budgets.length > 0 ? (
                      <>
                        <Typography variant="body1" sx={{ fontSize: '1.2rem', fontWeight: 500, mb: 2 }}>
                          Budget Status: Active ✈️
                        </Typography>
                        <Box sx={{ mb: 2, maxHeight: 150, overflowY: "auto" }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Your Budgets
                          </Typography>
                          <List>
                            {budgets.map((budget, index) => (
                              <ListItem
                                button
                                key={budget.id || index}
                                onClick={() => handleBudgetSelect(budget)}
                                sx={{
                                  borderRadius: 1,
                                  mb: 0.5,
                                  backgroundColor: selectedBudget?.id === budget.id ? "primary.light" : "transparent",
                                  "&:hover": { backgroundColor: "primary.light" },
                                  minHeight: 28,
                                  px: 1.5,
                                  width: '96%',
                                  mx: 'auto',
                                }}
                              >
                                <ListItemText
                                  primary={budget.name}
                                  primaryTypographyProps={{ fontWeight: selectedBudget?.id === budget.id ? "bold" : "normal", fontSize: "0.95rem" }}
                                  sx={{ my: 0 }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1" sx={{ fontSize: '1.2rem', fontWeight: 500, mb: 2 }}>
                        Budget needs to be set up ⚠️
                      </Typography>
                    )}
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => navigate("/budget")}
                      sx={buttonStyle}
                    >
                      {budgets.length > 0 ? "Manage Budgets" : "Set Up Budget"}
                    </Button>
                  </Box>
                  
                  {budgets.length > 0 && selectedBudget && (
                    <Box sx={{ flex: 1, height: 300 }}>
                      <Typography variant="h6" gutterBottom>
                        {selectedBudget.name} Breakdown
                      </Typography>
                      {isLoading ? (
                        <LoadingSpinner />
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                              <Legend 
                                layout="horizontal"
                                align="center"
                                verticalAlign="bottom"
                                wrapperStyle={{ paddingTop: 20 }}
                              />
                              <Pie
                                data={[
                                  { name: "Income", value: sum(selectedBudget.data.income) },
                                  { name: "Expenses", value: sum(selectedBudget.data.expenses) },
                                  { name: "Savings", value: sum(selectedBudget.data.savings) }
                                ].map(d => ({ ...d, total: sum(selectedBudget.data.income) + sum(selectedBudget.data.expenses) + sum(selectedBudget.data.savings) }))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="45%"
                                outerRadius={80}
                                label={({ value }) => `$${value.toFixed(2)}`}
                                labelLine={false}
                              >
                                {BUDGET_COLORS.map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip content={<PiePercentTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              </Card>

              <Card sx={cardStyle}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Tax Deductions Summary
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 8, mb: 2 }}>
                      Total Tax Deductions: ${totalDeductibleSpent.toFixed(2)}
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => navigate("/tax-prep")}
                      sx={buttonStyle}
                    >
                      Manage Deductions
                    </Button>
                  </Box>
                  
                  <Box sx={{ flex: 1, minHeight: deductionChartHeight, height: 'auto', paddingBottom: 2, mb: 1 }}>
                    <ResponsiveContainer width="100%" height={deductionChartHeight}>
                      <PieChart margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
                        <Pie
                          data={deductionLegendItems.map(d => ({ ...d, total: deductionLegendItems.reduce((sum, item) => sum + item.value, 0) }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={80}
                          label={({ value }) => `$${value.toFixed(2)}`}
                          labelLine={false}
                        >
                          {deductionLegendItems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DEDUCTION_COLORS[index % DEDUCTION_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PiePercentTooltip />} />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ marginTop: 10, fontSize: '14px', flexWrap: 'wrap', maxWidth: '100%', overflowY: 'auto', maxHeight: 300 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              </Card>

              <Card sx={cardStyle}>
                <Typography variant="h6" gutterBottom>
                  Financial Goals
                </Typography>
                <br />
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 3,
                  alignItems: 'flex-start'
                }}>
                  <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    height: '100%',
                  }}>
                    <Box sx={{ 
                      width: '100%',
                      maxHeight: 150,
                      overflowY: 'auto',
                      minHeight: 100,
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#888',
                        borderRadius: '4px',
                        '&:hover': {
                          background: '#555',
                        },
                      },
                    }}>
                      {goalsList.length === 0 ? (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          height: '100%',
                          p: 3,
                          textAlign: 'center'
                        }}>
                          <Typography variant="body1" color="text.secondary">
                            No goals created yet
                          </Typography>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate("/goals")}
                            sx={{ mt: 2 }}
                          >
                            Create Your First Goal
                          </Button>
                        </Box>
                      ) : (
                        <List>
                          {goalsList.map(goal => (
                            <ListItem
                              key={goal.id}
                              button
                              onClick={() => setSelectedGoalId(goal.id.toString())}
                              sx={{
                                borderRadius: 1,
                                mb: 0.5,
                                backgroundColor: goal.id.toString() === selectedGoalId ? 'primary.light' : 'transparent',
                                '&:hover': { backgroundColor: 'primary.light' },
                                minHeight: 28,
                                px: 1.5,
                                width: '96%',
                                mx: 'auto',
                              }}
                            >
                              <ListItemText
                                primary={goal.name}
                                secondary={`Target: $${goal.amount}`}
                                primaryTypographyProps={{ 
                                  fontWeight: goal.id.toString() === selectedGoalId ? 700 : 400,
                                  fontSize: '0.95rem'
                                }}
                                sx={{ my: 0 }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>

                    {selectedGoal && (
                      <Box sx={{ 
                        width: '100%',
                        maxWidth: 300,
                        minWidth: 200,
                        height: 180,
                        borderRadius: 1,
                        p: 1,
                        mx: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <ResponsiveContainer width="100%" height={100}>
                          <BarChart data={chartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#1976d2" />
                          </BarChart>
                        </ResponsiveContainer>
                        <Typography variant="body2" align="center" sx={{ mt: 0.5 }}>
                           ${savedAmount.toFixed(2)} saved of ${selectedGoal.amount} target
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 1,
                    height: '100%',
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Badges Earned
                    </Typography>
                    {earnedBadges.length === 0 ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%',
                        p: 3,
                        textAlign: 'center'
                      }}>
                        <Typography variant="body1" color="text.secondary">
                          No badges earned yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Create goals to earn badges!
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                      }}>
                        {earnedBadges.map(badge => {
                          const badgeSize = Math.min(
                            80,
                            Math.max(
                              40,
                              earnedBadges.length <= 3 ? 80 :
                              earnedBadges.length <= 6 ? 60 :
                              40
                            )
                          );
                          
                          return (
                            <Box
                              key={badge.altText}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Avatar
                                src={badge.imgSrc}
                                alt={badge.altText}
                                sx={{ 
                                  width: badgeSize, 
                                  height: badgeSize,
                                  boxShadow: 2,
                                  transition: 'transform 0.2s',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                  },
                                }}
                                title={badge.tooltip}
                              />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  textAlign: 'center',
                                  fontSize: badgeSize <= 40 ? '0.7rem' : '0.75rem',
                                }}
                              >
                                {badge.altText}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/goals")}
                  sx={{ mt: 2 }}
                >
                  View All Goals
                </Button>
              </Card>
            </>
          )}
          
          {!currentUser && (
            <Typography>Please log in to see your flight path.</Typography>
          )}
        </Box>
        <Box sx={{ height: "40px" }} />
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          message={error}
          ContentProps={{ sx: { backgroundColor: "error.main" } }}
        />
        <Card sx={{ p: 3, mt: 4, mb: 4, borderRadius: 2, boxShadow: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccountBalanceIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
            <Typography variant="h6" gutterBottom>
              Bank Accounts {usingCache && "(Cached)"}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {plaidLoading && (
              <Box
                component="img"
                src="/images/PennyPilot-logo.png"
                alt="Loading..."
                sx={{
                  width: 40,
                  height: 40,
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
            )}
            
            <Button
              variant="outlined"
              onClick={handleConnectBank}
              disabled={plaidLoading}
              sx={{
                py: 1,
                px: 2,
                fontSize: '0.95rem',
                mt: 2,
                borderRadius: 2,
                borderWidth: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                boxShadow: 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: '#fff',
                  borderColor: 'primary.main',
                  boxShadow: (theme) => `0 4px 14px ${alpha(theme.palette.primary.main, 0.2)}`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {plaidAccounts.length > 0 ? "CONNECT ANOTHER BANK ACCOUNT" : "Connect Your Bank Account"}
            </Button>
          </Box>
          {plaidError && <Alert severity={usingCache ? "warning" : "error"}>{plaidError}</Alert>}
          <List>
            {plaidAccounts.map((acct: any) => (
              <Box key={acct.account_id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">
                    {acct.name} - {acct.balances?.current?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleDeleteAccount(acct.account_id)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}
          </List>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Total Balance: ${plaidAccounts.reduce((sum, acct) => sum + (acct.balances?.current || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Typography>
          <Typography variant="h6" sx={{ mt: 3 }}>
            Recent Spending
          </Typography>
          {plaidTransactions.length > 0 ? (
            <List>
              {recentSpending.map((txn: any) => (
                <ListItem key={txn.id}>
                  <ListItemText
                    primary={`${txn.date}: ${txn.description}`}
                    secondary={`-$${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'left', pl: 1 }}>
              No recent transactions available
            </Typography>
          )}
        </Card>
      </Container>
    </Box>
  );
}