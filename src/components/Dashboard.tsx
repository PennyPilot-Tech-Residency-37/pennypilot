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
import { usePlaid } from "../context/PlaidContext";
import axios from "axios";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
} from "date-fns";

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

// Example goals data structure for demo (replace with your actual data):
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const planeControls = useAnimation();
  const [userData, setUserData] = useState<UserData>({ budgetSet: false });
  const [deductibleExpenses, setDeductibleExpenses] = useState<DeductibleExpense[]>([]);
  const [totalDeductibleSpent, setTotalDeductibleSpent] = useState<number>(0);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const { fetchLinkToken, openPlaid, ready } = usePlaid();
  const [plaidAccounts, setPlaidAccounts] = useState<any[]>([]);
  const [plaidTransactions, setPlaidTransactions] = useState<any[]>([]);
  const [plaidLoading, setPlaidLoading] = useState(true);
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
      console.error("Failed to parse stored goals:", e);
      return [];
    }
  });

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

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const userQuery = query(collection(db, "users"), where("uid", "==", currentUser.uid));
        const userSnapshot = await getDocs(userQuery);
        const userData = userSnapshot.docs[0]?.data() as UserData;
        if (userData) setUserData(userData);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to fetch user data.");
      }
    };
    fetchUserData();

    // Fetch budgets in real-time
    const budgetRef = collection(db, "users", currentUser.uid, "budget");
    const budgetQuery = query(budgetRef, orderBy("createdAt", "asc"));
    const unsubscribeBudgets = onSnapshot(budgetQuery, (snapshot) => {
      const fetchedBudgets = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || `Budget ${doc.id}`,
          data: {
            income: data.income || [],
            expenses: data.expenses || [],
            savings: data.savings || [],
          } as BudgetDataStructure,
          createdAt: data.createdAt,
        };
      }) as Budget[];

      console.log("Fetched budgets:", fetchedBudgets); // Debug log
      setBudgets(fetchedBudgets);

      if (fetchedBudgets.length > 0) {
        // If there's no selected budget or the previously selected budget is no longer in the list, select the first one
        const currentSelectedId = selectedBudget?.id;
        const stillExists = fetchedBudgets.some(b => b.id === currentSelectedId);
        if (!stillExists) {
          setSelectedBudget(fetchedBudgets[0]);
        }
      } else {
        setSelectedBudget(null);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching budgets:", err);
      setError("Failed to fetch budgets. Please try again.");
      setIsLoading(false);
    });

    // Fetch deductible expenses in real-time
    const userDeductibleRef = collection(db, "users", currentUser.uid, "deductibleExpenses");
    const deductibleQuery = query(userDeductibleRef, orderBy("createdAt", "desc"));
    const unsubscribeDeductibles = onSnapshot(deductibleQuery, (snapshot) => {
      const expenses = snapshot.docs.map((doc) => doc.data()) as DeductibleExpense[];
      setDeductibleExpenses(expenses);
      const total = expenses.reduce((sum, expense) => sum + Number(expense.deductibleAmount), 0);
      setTotalDeductibleSpent(total);
    }, (err) => {
      console.error("Error fetching deductible expenses:", err);
      setError("Failed to fetch deductible expenses.");
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeBudgets();
      unsubscribeDeductibles();
    };
  }, [currentUser, selectedBudget?.id]); // Re-run if currentUser or selectedBudget.id changes

  // Helper: Fetch cached data from Firestore
  const fetchCachedData = async () => {
    if (!currentUser) return;
    try {
      const accountsSnap = await getDoc(doc(db, "users", currentUser.uid, "plaidCache", "accounts"));
      const transactionsSnap = await getDoc(doc(db, "users", currentUser.uid, "plaidCache", "transactions"));
      setPlaidAccounts(accountsSnap.exists() ? accountsSnap.data().accounts : []);
      setPlaidTransactions(transactionsSnap.exists() ? transactionsSnap.data().transactions : []);
      setUsingCache(true);
    } catch (err) {
      setPlaidError("Failed to load cached bank data.");
    }
  };

  // Main effect: fetch Plaid data, cache it, or use fallback
  useEffect(() => {
    if (!currentUser) return;
    setPlaidLoading(true);
    setPlaidError(null);
    setUsingCache(false);

    const fetchPlaidData = async () => {
      try {
        // 1. Fetch accounts
        const accountsRes = await axios.get(`/api/linked_accounts/${currentUser.uid}`, {
          headers: { key: "dev-test-key" }
        });
        setPlaidAccounts(accountsRes.data);

        // 2. Fetch transactions
        const transactionsRes = await axios.get(`/api/transactions`, {
          params: { user_id: currentUser.uid },
          headers: { key: "dev-test-key" }
        });
        setPlaidTransactions(transactionsRes.data);

        // 3. Cache in Firestore
        await setDoc(doc(db, "users", currentUser.uid, "plaidCache", "accounts"), {
          accounts: accountsRes.data,
          updatedAt: new Date().toISOString()
        });
        await setDoc(doc(db, "users", currentUser.uid, "plaidCache", "transactions"), {
          transactions: transactionsRes.data,
          updatedAt: new Date().toISOString()
        });

        setPlaidLoading(false);
      } catch (err) {
        setPlaidError("Could not fetch live bank data. Showing cached data if available.");
        // Try to load from cache
        await fetchCachedData();
        setPlaidLoading(false);
      }
    };

    fetchPlaidData();
    // Optionally, refetch on tab focus for freshness
    const onFocus = () => fetchPlaidData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line
  }, [currentUser]);

  // Example analytics: total balance and recent spending
  const totalBalance = plaidAccounts.reduce((sum, acct) => sum + (acct.balance || 0), 0);
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
    console.log("Selected budget:", budget); // Debug log
    setSelectedBudget(budget);
  };

  const handleConnectBank = async () => {
    await fetchLinkToken();
    const waitForReady = async () => {
      if (ready) {
        openPlaid();
      } else {
        setTimeout(waitForReady, 100);
      }
    };
    waitForReady();
  };

  console.log("budgets", budgets);
  console.log("selectedBudget", selectedBudget);

  // Remove the Firestore useEffect and replace with localStorage listener
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
          console.error("Failed to parse stored goals:", e);
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
  
  // Load Plaid accounts from localStorage on mount
  useEffect(() => {
    const storedAccounts = localStorage.getItem("plaidAccounts");
    if (storedAccounts) {
      try {
        setPlaidAccounts(JSON.parse(storedAccounts));
      } catch (e) {
        console.error("Failed to parse stored Plaid accounts from localStorage:", e);
      }
    }
  }, []);

  // Save Plaid accounts to localStorage on every change
  useEffect(() => {
    localStorage.setItem("plaidAccounts", JSON.stringify(plaidAccounts));
  }, [plaidAccounts]);

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
                      <LoadingSpinner />
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
                                  mb: 1,
                                  backgroundColor: selectedBudget?.id === budget.id ? "primary.light" : "transparent",
                                  "&:hover": { backgroundColor: "primary.light" },
                                }}
                              >
                                <ListItemText
                                  primary={budget.name}
                                  primaryTypographyProps={{ fontWeight: selectedBudget?.id === budget.id ? "bold" : "normal" }}
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
                            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <Legend 
                                layout="horizontal"
                                align="right"
                                verticalAlign="top"
                                wrapperStyle={{ paddingBottom: 20 }}
                              />
                              <Pie
                                data={budgetChartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="55%"
                                outerRadius={80}
                                label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                labelLine={false}
                              >
                                {budgetChartData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={BUDGET_COLORS[index % BUDGET_COLORS.length]}
                                  />
                                ))}
                              </Pie>
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
                    <Typography variant="h4" sx={{ mb: 2 }}>
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
                  
                  <Box sx={{ flex: 1, height: 300, paddingBottom: 6 }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={groupExpensesByCategory(deductibleExpenses)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%" 
                          outerRadius={80}
                          label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                          labelLine={false}
                        >
                          {groupExpensesByCategory(deductibleExpenses).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DEDUCTION_COLORS[index % DEDUCTION_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{
                            paddingTop: "120px", // Further increased to move legend lower into the available space
                            fontSize: "14px", // Ensure readability
                            lineHeight: "24px", // Proper spacing between legend items
                            bottom: 80,
                          }}
                        />
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
                  {/* Left side: Goals list and chart */}
                  <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    height: '100%',
                  }}>
                    {/* Goals list */}
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
                                mb: 1,
                                backgroundColor: goal.id.toString() === selectedGoalId ? 'primary.light' : 'transparent',
                                '&:hover': { backgroundColor: 'primary.light' },
                              }}
                            >
                              <ListItemText
                                primary={goal.name}
                                secondary={`Target: $${goal.amount}`}
                                primaryTypographyProps={{ 
                                  fontWeight: goal.id.toString() === selectedGoalId ? 700 : 400 
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>

                    {/* Bar chart for selected goal */}
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

                  {/* Right side: Badges */}
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
                          // Calculate badge size based on number of badges
                          const badgeSize = Math.min(
                            80, // Maximum size
                            Math.max(
                              40, // Minimum size
                              earnedBadges.length <= 3 ? 80 : // Large badges for 3 or fewer
                              earnedBadges.length <= 6 ? 60 : // Medium badges for 4-6
                              40 // Small badges for 7 or more
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
        {/* --- Plaid Bank Info Section --- */}
        <Card sx={{ p: 3, mt: 4, mb: 4, borderRadius: 2, boxShadow: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccountBalanceIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
            <Typography variant="h6" gutterBottom>
              Bank Accounts {usingCache && "(Cached)"}
            </Typography>
          </Box>
          {plaidLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 1 }}>
              <LoadingSpinner />
            </Box>
          )}
          {plaidError && <Alert severity={usingCache ? "warning" : "error"}>{plaidError}</Alert>}
          <List>
            {plaidAccounts.map((acct: any) => (
              <ListItem key={acct.id}>
                <ListItemText
                  primary={acct.name}
                  secondary={`Balance: $${acct.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "N/A"}`}
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Total Balance: ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Typography>
          <Typography variant="h6" sx={{ mt: 3 }}>
            Recent Spending
          </Typography>
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
        </Card>
      </Container>
    </Box>
  );
}