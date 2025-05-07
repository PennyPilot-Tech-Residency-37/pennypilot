import { useState, useEffect } from "react";
import { Container, Typography, Box, Button, Grid, ThemeProvider, createTheme, List, ListItem, ListItemText } from "@mui/material";
import BudgetSetup from "./BudgetGuide";
import BudgetGroup from "./BudgetGroup";
import BudgetSummaryChart from "./BudgetSummaryChart";
import { BudgetData } from "../types/types";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { db } from "../types/firebaseConfig";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "../context/auth";
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';

interface Budget {
  id?: string;
  name: string;
  data: BudgetData;
  createdAt?: string;
}

// Custom MUI theme for consistency
const theme = createTheme({
  spacing: 8,
  typography: {
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  palette: {
    primary: { main: "#1976d2" },
    background: { default: "#fafafa" },
  },
});


const BudgetBoard = () => {
  const { currentUser } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [linkReady, setLinkReady] = useState(false);
  
  // Fetch budgets from Firestore on mount
  useEffect(() => {
    if (!currentUser) return;
    const budgetRef = collection(db, "users", currentUser.uid, "budget");
    const budgetQuery = query(budgetRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(budgetQuery, (snapshot) => {
      const fetchedBudgets = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || `Budget ${doc.id}`,
        data: {
          income: doc.data().income || [],
          expenses: doc.data().expenses || [],
          savings: doc.data().savings || [],
        },
        createdAt: doc.data().createdAt,
      })) as Budget[];
      setBudgets(fetchedBudgets);
      if (fetchedBudgets.length > 0) {
        setCurrentBudget(fetchedBudgets[0]);
      } else {
        setCurrentBudget(null);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: async (public_token, metadata) => {
      try {
        const res = await axios.post("/api/create_link_token", {
          public_token,
          key: 'dev-test-key',
        });
        console.log('✅ Access token exchange successful:', res.data);
      } catch (err) {
        console.error('❌ Error exchanging token:', err);
      }
    },
    onLoad: () => {
      setLinkReady(true);
    },
  });

  const handleConnectBank = async () => {
    try {
      const res = await axios.post("/api/create_link_token", {
        key: "dev-test-key",
      });
      const token = res.data.link_token;
      setLinkToken(token);
      console.log("✅ Link token received:", token);
    } catch (err) {
      console.error("❌ Failed to fetch link token:", err);
    }
  };
  
  const handleFinishSetup = async (data: BudgetData, name: string) => {
    if (!currentUser) return;
    const newBudget = {
      name: name || `Budget ${budgets.length + 1}`,
      income: data.income || [],
      expenses: data.expenses || [],
      savings: data.savings || [],
      createdAt: new Date().toISOString(),
    };
    const budgetRef = collection(db, "users", currentUser.uid, "budget");
    await addDoc(budgetRef, newBudget);
    setShowSetup(false); // Firestore onSnapshot will update state
  };

  // Update budget in Firestore
  const handleBudgetUpdate = async (
    type: "income" | "expenses" | "savings",
    items: { name: string; amount: string; spent?: string }[]
  ) => {
    if (!currentBudget || !currentUser) return;
    const updatedBudget = {
      ...currentBudget,
      data: {
        ...currentBudget.data,
        [type]: items,
      },
    };
    if (currentBudget.id) {
      const budgetRef = doc(db, "users", currentUser.uid, "budget", currentBudget.id);
      await updateDoc(budgetRef, {
        name: updatedBudget.name,
        income: updatedBudget.data.income,
        expenses: updatedBudget.data.expenses,
        savings: updatedBudget.data.savings,
        createdAt: updatedBudget.createdAt || new Date().toISOString(),
      });
    }
    setCurrentBudget(updatedBudget);
    setBudgets(budgets.map((b) => (b.id === currentBudget.id ? updatedBudget : b)));
  };

  const handleBudgetSelect = (budget: BudgetData) => {
    const selectedBudget = budgets.find((b) => b.data === budget);
    if (selectedBudget) {
      setCurrentBudget(selectedBudget);
    }
  };

  const handleCreateNewBudget = () => {
    setShowSetup(true);
  };

  // Pie chart helpers (unchanged)
  const COLORS = ["#1976d2", "#f57c00", "#fbc02d"];
  function getChartData(data: BudgetData) {
    const sum = (arr: { amount: string }[]) =>
      arr.reduce((acc: number, val: { amount: string }) => acc + (parseFloat(val.amount) || 0), 0);
    return [
      { name: "Income", value: sum(data.income) },
      { name: "Expenses", value: sum(data.expenses) },
      { name: "Savings", value: sum(data.savings) },
    ];
  }
  const MiniPieChart = ({ data }: { data: BudgetData }) => (
    <ResponsiveContainer width={80} height={80}>
      <PieChart>
        <Pie
          data={getChartData(data)}
          dataKey="value"
          cx="50%"
          cy="50%"
          outerRadius={30}
          innerRadius={15}
          label={false}
        >
          {getChartData(data).map((entry, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl" sx={{ mt: 8, mb: 8, position: "relative", px: { xs: 2, sm: 4, md: 6 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            minHeight: "100%",
            px: { xs: 2, sm: 0 },
          }}
        >
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {currentBudget ? currentBudget.name : "Create Your Budget"}
            </Typography>
            {currentBudget && (
              <Typography variant="subtitle1" color="text.secondary">
                Manage your income, expenses, and savings
              </Typography>
            )}
          </Box>

          {!showSetup && !currentBudget && (
            <Button
              variant="contained"
              color="primary"
              aria-label="Create a new budget"
              onClick={() => setShowSetup(true)}
            >
              Create a New Budget
            </Button>
          )}

          {showSetup && (
            <BudgetSetup
              open={showSetup}
              onClose={() => setShowSetup(false)}
              onFinish={handleFinishSetup}
            />
          )}

<Button
  variant="contained"
  color="primary"
  onClick={async () => {
    if (!linkToken) {
      await handleConnectBank();
    }
    // Wait for Plaid to become ready before opening
    if (ready && linkToken) {
      open();
    }
  }}
>
  Connect Your Bank Account
</Button>






          {currentBudget && (
            <Box
              sx={{
                border: "2px solid #e0e0e0",
                borderRadius: 2,
                padding: 3,
                backgroundColor: "#fafafa",
                width: "100%",
              }}
            >
              <Grid container spacing={4} sx={{ mt: 4 }} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" align="left" gutterBottom>
                    Budget Table
                  </Typography>
                  <Box sx={{ width: "100%" }}>
                    <BudgetGroup
                      title="Income"
                      items={currentBudget.data.income}
                      onItemsChange={(items) => handleBudgetUpdate("income", items)}
                    />
                    <BudgetGroup
                      title="Expenses"
                      items={currentBudget.data.expenses}
                      onItemsChange={(items) => handleBudgetUpdate("expenses", items)}
                    />
                    <BudgetGroup
                      title="Savings"
                      items={currentBudget.data.savings}
                      onItemsChange={(items) => handleBudgetUpdate("savings", items)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ width: "100%" }}>
                    <BudgetSummaryChart
                      data={currentBudget.data}
                      onBudgetSelect={handleBudgetSelect}
                      currentBudgets={budgets}
                      onCreateBudget={handleCreateNewBudget}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default BudgetBoard;