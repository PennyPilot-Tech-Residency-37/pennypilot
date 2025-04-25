import React, { useState, useEffect } from "react";
import { Card, Typography, Container, Box, Button } from "@mui/material";
import { collection, getDocs, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../types/firebaseConfig";
import PilotAvatar from "./PilotAvatar";
import { useAuth } from "../context/auth";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { alpha } from '@mui/material/styles';
import { useNavigate } from "react-router-dom";
import { BudgetData } from "../types/budget";

interface UserData {
  budgetSet: boolean;
}

interface DeductibleExpense {
  deductibleAmount: number;
  category: string;
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

export default function HomeDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData>({ budgetSet: false });
  const [deductibleExpenses, setDeductibleExpenses] = useState<DeductibleExpense[]>([]);
  const [totalDeductibleSpent, setTotalDeductibleSpent] = useState<number>(0);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch user data and budget data
    const fetchData = async () => {
      const userQuery = query(collection(db, "users"), where("uid", "==", currentUser.uid));
      const userSnapshot = await getDocs(userQuery);
      const userData = userSnapshot.docs[0]?.data() as UserData;
      if (userData) setUserData(userData);

      const budgetQuery = query(collection(db, "users", currentUser.uid, "budget"));
      const budgetSnapshot = await getDocs(budgetQuery);
      const budgetData = budgetSnapshot.docs[0]?.data() as BudgetData;
      if (budgetData) setBudgetData(budgetData);
    };
    fetchData();

    // Set up real-time listener for deductible expenses
    const userDeductibleRef = collection(db, "users", currentUser.uid, "deductibleExpenses");
    const q = query(userDeductibleRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map((doc) => doc.data()) as DeductibleExpense[];
      setDeductibleExpenses(expenses);
      const total = expenses.reduce((sum, expense) => sum + Number(expense.deductibleAmount), 0);
      setTotalDeductibleSpent(total);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const cardStyle = {
    p: 3,
    width: { xs: "100%", sm: "90%", md: "70%", lg: "60%" },
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    border: '1px solid',
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
    borderRadius: 2,
    background: (theme) => `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
  };

  const buttonStyle = {
    mt: 2,
    transition: 'all 0.2s ease-in-out',
    '&:active': {
      transform: 'scale(0.95)',
    },
    '&:hover': {
      boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
  };

  const sum = (arr: { name: string; amount: string }[]) =>
    arr?.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0) || 0;

  const budgetChartData = budgetData ? [
    { name: "Income", value: sum(budgetData.income) },
    { name: "Expenses", value: sum(budgetData.expenses) },
    { name: "Savings", value: sum(budgetData.savings) },
  ] : [];

  return (
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
        <Box sx={{ position: 'relative', mt: 12, mb: 2, pt: 4 }}>
          <PilotAvatar message={currentUser ? `Ready for takeoff, ${currentUser.email?.split("@")[0]}?` : "Log in to fly!"} />
        </Box>
        
        <Typography variant="h5" gutterBottom>
          Welcome, Captain! Your Flight Path:
        </Typography>
        
        {currentUser && (
          <>
            <Card sx={cardStyle}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>Budget Overview</Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.2rem', fontWeight: 500, mb: 2 }}>
                    {budgetData ? "Budget Status: Active ✈️" : "Budget needs to be set up ⚠️"}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigate("/budget")}
                    sx={buttonStyle}
                  >
                    {budgetData ? "View Budget" : "Set Up Budget"}
                  </Button>
                </Box>
                
                {budgetData && (
                  <Box sx={{ flex: 1, height: 300 }}>
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
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Legend 
                        layout="horizontal"
                        align="right"
                        verticalAlign="top"
                        wrapperStyle={{ paddingBottom: 20 }}
                      />
                      <Pie
                        data={groupExpensesByCategory(deductibleExpenses)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="55%"
                        outerRadius={80}
                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                        labelLine={false}
                      >
                        {groupExpensesByCategory(deductibleExpenses).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={DEDUCTION_COLORS[index % DEDUCTION_COLORS.length]}
                          />
                        ))}
                      </Pie>
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
    </Container>
  );
}