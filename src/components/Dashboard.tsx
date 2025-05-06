import { useState, useEffect } from "react";
import React from "react";
import { Card, Typography, Container, Box, Button, List, ListItem, ListItemText, CircularProgress, Snackbar } from "@mui/material";
import { collection, getDocs, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../types/firebaseConfig";
import PilotAvatar from "./PilotAvatar";
import { useAuth } from "../context/auth";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { alpha, Theme } from '@mui/material/styles';
import { useNavigate } from "react-router-dom";
import { BudgetData } from "../types/types";
import { motion, useAnimation } from "framer-motion";

interface UserData {
  budgetSet: boolean;
}

interface DeductibleExpense {
  deductibleAmount: number;
  category: string;
}

interface Budget {
  id?: string;
  name: string;
  data: BudgetData;
  createdAt?: string;
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

const LoadingLogo = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    p: 2,
    animation: 'spin 1.5s linear infinite',
    '@keyframes spin': {
      '0%': {
        transform: 'rotate(0deg)',
      },
      '100%': {
        transform: 'rotate(360deg)',
      },
    },
  }}>
    <img 
      src="/images/PennyPilot-logo.png" 
      alt="Loading..." 
      style={{ 
        width: '60px', 
        height: 'auto',
        objectFit: 'contain'
      }} 
    />
  </Box>
);

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
          } as BudgetData,
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

  console.log("budgets", budgets);
  console.log("selectedBudget", selectedBudget);

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
            gap: 3,
          }}
        >
          <Box sx={{ 
            position: 'relative', 
            mt: 12, 
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
                      <LoadingLogo />
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
                        <LoadingLogo />
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
                  
                  <Box sx={{ flex: 1, height: 300 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={groupExpensesByCategory(deductibleExpenses)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
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
                            paddingTop: "20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            justifyContent: "flex-start"
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                      Emergency Fund
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontSize: '1.1rem',
                      color: (theme) => theme.palette.success.main,
                      fontWeight: 500
                    }}>
                      On Track 🚀
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                      Retirement Savings
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontSize: '1.1rem',
                      color: (theme) => theme.palette.warning.main,
                      fontWeight: 500
                    }}>
                      In Progress ⚡
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                      Debt Reduction
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontSize: '1.1rem',
                      color: (theme) => theme.palette.success.main,
                      fontWeight: 500
                    }}>
                      Ahead of Schedule 🌟
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate("/goals")}
                  sx={buttonStyle}
                >
                  View Goals
                </Button>
              </Card>
            </>
          )}
          
          {!currentUser && (
            <Typography>Please log in to see your flight path.</Typography>
          )}
        </Box>
        <Box sx={{ height: "300px" }} />
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          message={error}
          ContentProps={{ sx: { backgroundColor: "error.main" } }}
        />
      </Container>
    </Box>
  );
}