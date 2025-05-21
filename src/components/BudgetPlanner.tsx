import { useState, useEffect } from "react";
import { Container, Typography, Box, Button, Grid, ThemeProvider, createTheme, List, ListItem, ListItemText, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, MenuItem, Select, FormControl, InputLabel, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar, IconButton, CircularProgress } from "@mui/material";
import BudgetSetup from "./BudgetGuide";
import BudgetGroup from "./BudgetGroup";
import BudgetSummaryChart from "./BudgetSummaryChart";
import { BudgetData } from "../types/types";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { db } from "../types/firebaseConfig";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/auth";
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { categorizeTransactions } from "../utils/categorizeTransactions";
import { Add as AddIcon, Notifications as NotificationsIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface Budget {
  id?: string;
  name: string;
  data: BudgetData;
  createdAt?: string;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  account_id: string;
  isRecurring?: boolean;
  recurringPattern?: string;
}

interface SpendingAnalytics {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  categoryBreakdown: { category: string; amount: number }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
}

interface CustomCategory {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'savings';
  keywords: string[];
}

interface BudgetAlert {
  id: string;
  type: 'spending' | 'income' | 'savings';
  threshold: number;
  message: string;
  triggered: boolean;
}
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
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const stored = localStorage.getItem("budgets");
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(() => {
    const stored = localStorage.getItem("currentBudget");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });
  const [showSetup, setShowSetup] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [analytics, setAnalytics] = useState<SpendingAnalytics | null>(null);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<CustomCategory>>({});
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<BudgetAlert>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [editBudgetName, setEditBudgetName] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const isDashboardReady = currentBudget && accounts.length > 0 && transactions.length > 0;
  // const { fetchLinkToken, openPlaid, ready } = usePlaid();
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    Income: true,
    Expenses: true,
    Savings: true,
  });

  
  useEffect(() => {
    console.log("Loading budgets from localStorage...");
    const storedBudgets = localStorage.getItem("budgets");
    console.log("Stored budgets:", storedBudgets);
    if (storedBudgets) {
      try {
        const parsed = JSON.parse(storedBudgets);
        console.log("Parsed budgets:", parsed);
        const fixed = parsed.map((b: any, index: number) => ({
          ...b,
          id: b.id || `local-${index}-${Date.now()}`
        }));
        console.log("Fixed budgets:", fixed);
        setBudgets(fixed);
        if (!currentBudget && fixed.length > 0) {
          console.log("Setting current budget to:", fixed[0]);
          setCurrentBudget(fixed[0]);
        }
      } catch (e) {
        console.error("Failed to parse stored budgets:", e);
      }
    }
  }, []);
  

  useEffect(() => {
    console.log("Saving budgets to localStorage:", budgets);
    if (budgets.length > 0) {
      localStorage.setItem("budgets", JSON.stringify(budgets));
    }
  }, [budgets]);

  useEffect(() => {
    console.log("Saving current budget to localStorage:", currentBudget);
    if (currentBudget) {
      localStorage.setItem("currentBudget", JSON.stringify(currentBudget));
    }
  }, [currentBudget]);

  useEffect(() => {
    const storedAccounts = localStorage.getItem("plaidAccounts");
    if (storedAccounts) {
      try {
        setAccounts(JSON.parse(storedAccounts));
      } catch (e) {
        console.error("Failed to parse stored Plaid accounts:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem("plaidAccounts", JSON.stringify(accounts));
    }
  }, [accounts]);

  useEffect(() => {
    const handleStorage = () => {
      const storedBudgets = localStorage.getItem("budgets");
      if (storedBudgets) {
        try {
          const parsed = JSON.parse(storedBudgets);
          setBudgets(parsed);
        } catch (e) {
          console.error("Failed to parse stored budgets:", e);
        }
      }
      const storedCurrent = localStorage.getItem("currentBudget");
      if (storedCurrent) {
        try {
          setCurrentBudget(JSON.parse(storedCurrent));
        } catch (e) {
          console.error("Failed to parse current budget:", e);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: async (public_token, metadata) => {
      try {
        const res = await axios.post("/api/exchange_public_token", {
          public_token,
          key: 'dev-test-key',
          user_id: currentUser?.uid,
        });
        console.log('✅ Access token exchange successful:', res.data);
  
        await fetchAccounts();
  
        const txRes = await axios.get(`/api/transactions`, {
          params: {
            user_id: currentUser?.uid,
            start_date: dateRange.start,
            end_date: dateRange.end
          },
          headers: {
            key: 'dev-test-key'
          }
        });
  
        const categorized = categorizeTransactions(txRes.data.transactions);
  
        const newBudget: Budget = {
          id: Date.now().toString(),
          name: `Auto Budget - ${new Date().toLocaleDateString()}`,
          data: {
            income: categorized.income.map(t => ({ name: t.description, amount: Math.abs(t.amount).toString() })),
            expenses: categorized.expenses.map(t => ({ name: t.description, amount: Math.abs(t.amount).toString() })),
            savings: categorized.savings.map(t => ({ name: t.description, amount: Math.abs(t.amount).toString() }))
          },
          createdAt: new Date().toISOString()
        };
  
        const updatedBudgets = [...budgets, newBudget];
        setBudgets(updatedBudgets);
        setCurrentBudget(newBudget);
        localStorage.setItem("budgets", JSON.stringify(updatedBudgets));
        localStorage.setItem("currentBudget", JSON.stringify(newBudget));
  
        setNotification({ message: "Your budget was created from your bank data!", type: "success" });
  
      } catch (err) {
        console.error('❌ Error creating budget from Plaid data:', err);
        setNotification({ message: "Something went wrong while generating your budget.", type: "error" });
      }
    }
  });
  
  

  const handleConnectBank = async () => {
    setPlaidLoading(true);
    try {
      const res = await axios.post("/api/create_link_token", {
        key: "dev-test-key",
        user_id: currentUser?.uid,
      });
      const token = res.data.link_token;
      setLinkToken(token);
    } catch (err) {
      console.error("❌ Failed to fetch link token:", err);
      setPlaidLoading(false);
    }
  };  
  useEffect(() => {
    if (linkToken && ready) {
      open();
      setPlaidLoading(false);
    }
  }, [linkToken, ready]);
  
  
  

    const handleFinishSetup = async (data: BudgetData, name: string) => {
      console.log("Creating new budget with data:", data, "name:", name);
      const newBudget = {
        id: Date.now().toString(),
        name: name || `Budget ${budgets.length + 1}`,
        data: {
          income: data.income || [],
          expenses: data.expenses || [],
          savings: data.savings || [],
        },
        createdAt: new Date().toISOString(),
      };
      console.log("New budget object:", newBudget);

      // Append new budget to existing budgets
      const updatedBudgets = [...budgets, newBudget];
      console.log("Updated budgets array:", updatedBudgets);
      setBudgets(updatedBudgets);
      localStorage.setItem("budgets", JSON.stringify(updatedBudgets));

      // Set as current budget
      console.log("Setting current budget to:", newBudget);
      setCurrentBudget(newBudget);
      localStorage.setItem("currentBudget", JSON.stringify(newBudget));
      
      setShowSetup(false);
    };

  // Update budget
  const handleBudgetUpdate = (
    type: "income" | "expenses" | "savings",
    items: { name: string; amount: string; spent?: string }[]
  ) => {
    console.log("Updating budget:", type, items);
    if (!currentBudget) return;
    
    const updatedBudget = {
      ...currentBudget,
      data: {
        ...currentBudget.data,
        [type]: items,
      },
    };
    console.log("Updated budget:", updatedBudget);

    // Update current budget
    setCurrentBudget(updatedBudget);
    localStorage.setItem("currentBudget", JSON.stringify(updatedBudget));

    // Update budgets list
    const updatedBudgets = budgets.map((b) => 
      b.id === currentBudget.id ? updatedBudget : b
    );
    console.log("Updated budgets list:", updatedBudgets);
    setBudgets(updatedBudgets);
    localStorage.setItem("budgets", JSON.stringify(updatedBudgets));
  };

  const handleBudgetSelect = (budget: Budget) => {
    console.log("Selecting budget:", budget);
    setCurrentBudget(budget);
  };

  const handleCreateNewBudget = () => {
    setShowSetup(true);
  };
  const fetchAccounts = async () => {
    if (!currentUser) return;
    setLoadingAccounts(true);
    try {
      const res = await axios.get(`/api/linked_accounts/${currentUser.uid}`, {
        headers: {
          'key': 'dev-test-key'
        }
      });
      console.log("Accounts fetched from backend:", res.data);
      if (res.data) {
        setAccounts(res.data);
      }      
    } catch (err) {
      console.error('❌ Error fetching accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Fetch accounts on component mount or login
  useEffect(() => {
    if (currentUser) {
      fetchAccounts();
    }
  }, [currentUser]);
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

  // Add automatic categorization function
  const autoCategorizeTransaction = (description: string): string => {
    const lowerDesc = description.toLowerCase();
    
    // Income patterns
    if (lowerDesc.includes('deposit') || lowerDesc.includes('salary') || lowerDesc.includes('payment received')) {
      return 'Income';
    }
    
    // Expense patterns
    if (lowerDesc.includes('grocery') || lowerDesc.includes('food') || lowerDesc.includes('restaurant')) {
      return 'Expense';
    }
    
    // Savings patterns
    if (lowerDesc.includes('transfer') || lowerDesc.includes('savings')) {
      return 'Savings';
    }
    
    return 'Uncategorized';
  };

  // Update fetchTransactions to include analytics
  const fetchTransactions = async (accountId?: string) => {
    if (!currentUser) return;
    setLoadingTransactions(true);
    try {
      const res = await axios.get(`/api/transactions`, {
        params: {
          account_id: accountId,
          user_id: currentUser.uid,
          start_date: dateRange.start,
          end_date: dateRange.end
        },
        headers: {
          'key': 'dev-test-key'
        }
      });
      
      const categorized = categorizeTransactions(res.data.transactions);
      const merged = [...categorized.income, ...categorized.expenses, ...categorized.savings];
      
      setTransactions(merged);
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error('❌ Error fetching transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };
  console.log('Accounts List:', accounts.map(a => a.account_id));


  // Filter transactions based on search and category
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = (transaction.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Update useEffect to fetch transactions when accounts change
  useEffect(() => {
    if (currentUser && accounts.length > 0) {
      fetchTransactions(selectedAccount || undefined);
    }
  }, [currentUser, accounts, selectedAccount]);

  // Add function to categorize transaction
  const categorizeTransaction = async (transactionId: string, category: string) => {
    try {
      await axios.put(`/api/transactions/${transactionId}`, {
        category,
        key: 'dev-test-key'
      });
      // Refresh transactions after categorization
      fetchTransactions(selectedAccount || undefined);
    } catch (err) {
      console.error('❌ Error categorizing transaction:', err);
    }
  };

  // Add custom category
  const handleAddCategory = async () => {
    try {
      const res = await axios.post('/api/categories', {
        ...newCategory,
        key: 'dev-test-key'
      });
      setCustomCategories([...customCategories, res.data]);
      setShowCategoryDialog(false);
      setNewCategory({});
      setNotification({ message: 'Category added successfully', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to add category', type: 'error' });
    }
  };

  // Add budget alert
  const handleAddAlert = async () => {
    try {
      const res = await axios.post('/api/alerts', {
        ...newAlert,
        key: 'dev-test-key'
      });
      setAlerts([...alerts, res.data]);
      setShowAlertDialog(false);
      setNewAlert({});
      setNotification({ message: 'Alert added successfully', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to add alert', type: 'error' });
    }
  };

  // Export transactions to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Transaction Report', 14, 15);
    
    const tableData = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      `$${Math.abs(t.amount).toFixed(2)}`,
      t.category,
      t.isRecurring ? 'Yes' : 'No'
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Description', 'Amount', 'Category', 'Recurring']],
      body: tableData,
      startY: 25
    });

    doc.save('transactions.pdf');
  };

  // Export transactions to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Recurring'];
    const csvData = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      Math.abs(t.amount).toFixed(2),
      t.category,
      t.isRecurring ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transactions.csv';
    link.click();
  };

  // Detect recurring transactions
  const detectRecurringTransactions = async () => {
    try {
      const res = await axios.post('/api/detect-recurring', {
        user_id: currentUser?.uid,
        key: 'dev-test-key'
      });
      setTransactions(res.data.transactions);
      setNotification({ message: 'Recurring transactions detected', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to detect recurring transactions', type: 'error' });
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditBudgetId(budget.id!);
    setEditBudgetName(budget.name);
  };
  const handleEditBudgetSave = () => {
    setBudgets(budgets.map(b => b.id === editBudgetId ? { ...b, name: editBudgetName } : b));
    if (currentBudget && currentBudget.id === editBudgetId) {
      setCurrentBudget({ ...currentBudget, name: editBudgetName });
    }
    setEditBudgetId(null);
    setEditBudgetName("");
  };
  const handleEditBudgetCancel = () => {
    setEditBudgetId(null);
    setEditBudgetName("");
  };

  // Delete budget
  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
    if (currentBudget && currentBudget.id === id) {
      setCurrentBudget(budgets.length > 1 ? budgets.find(b => b.id !== id) || null : null);
    }
    setShowDeleteConfirm(null);
  };

  // Add backup functionality
  const backupUserData = () => {
    try {
      const backupData = {
        budgets,
        currentBudget,
        customCategories,
        alerts,
        preferences: {
          dateRange,
          categoryFilter,
          selectedAccount,
        },
        lastBackup: new Date().toISOString(),
      };

      // Store in localStorage
      localStorage.setItem("userDataBackup", JSON.stringify(backupData));
      setLastBackupTime(new Date().toISOString());
      setNotification({ message: "Data backed up successfully", type: "success" });
    } catch (err) {
      console.error("Failed to backup data:", err);
      setNotification({ message: "Failed to backup data", type: "error" });
    }
  };

  // Restore user data
  const restoreUserData = () => {
    try {
      const stored = localStorage.getItem("userDataBackup");
      if (stored) {
        const backupData = JSON.parse(stored);
        setBudgets(backupData.budgets || []);
        setCurrentBudget(backupData.currentBudget || null);
        setCustomCategories(backupData.customCategories || []);
        setAlerts(backupData.alerts || []);
        
        if (backupData.preferences) {
          setDateRange(backupData.preferences.dateRange || dateRange);
          setCategoryFilter(backupData.preferences.categoryFilter || "all");
          setSelectedAccount(backupData.preferences.selectedAccount || null);
        }

        setLastBackupTime(backupData.lastBackup);
        setNotification({ message: "Data restored successfully", type: "success" });
      }
    } catch (err) {
      console.error("Failed to restore data:", err);
      setNotification({ message: "Failed to restore data", type: "error" });
    }
  };

  // Auto-backup every hour
  useEffect(() => {
    const backupInterval = setInterval(() => {
      backupUserData();
    }, 3600000); // 1 hour

    return () => clearInterval(backupInterval);
  }, [budgets, currentBudget, customCategories, alerts]);

  // Add backup button to the UI
  const renderBackupControls = () => (
    <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
      <Button
        variant="outlined"
        onClick={backupUserData}
        disabled={isBackingUp}
        startIcon={isBackingUp ? <CircularProgress size={20} /> : null}
      >
        {isBackingUp ? "Backing up..." : "Backup Data"}
      </Button>
      <Button
        variant="outlined"
        onClick={restoreUserData}
        disabled={isBackingUp}
      >
        Restore Data
      </Button>
      {lastBackupTime && (
        <Typography variant="caption" color="text.secondary">
          Last backup: {new Date(lastBackupTime).toLocaleString()}
        </Typography>
      )}
    </Box>
  );

  // Add error handling for localStorage quota
  const safeSetLocalStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        setNotification({ 
          message: "Storage limit reached. Please backup and clear some data.", 
          type: "error" 
        });
      }
    }
  };

  // Update all localStorage.setItem calls to use safeSetLocalStorage
  useEffect(() => {
    if (budgets.length > 0) {
      safeSetLocalStorage("budgets", budgets);
    }
  }, [budgets]);

  useEffect(() => {
    if (currentBudget) {
      safeSetLocalStorage("currentBudget", currentBudget);
    }
  }, [currentBudget]);

  useEffect(() => {
    if (accounts.length > 0) {
      safeSetLocalStorage("plaidAccounts", accounts);
    }
  }, [accounts]);

  const handleToggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

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
          <Box
  sx={{
    display: "flex",
    justifyContent: isDashboardReady ? "flex-end" : "center",
    alignItems: "center",
    width: "100%",
    mt: isDashboardReady ? 0 : 6,
    mb: isDashboardReady ? 2 : 4,
    flexWrap: "wrap",
    gap: 2,
  }}
>
  {budgets.length === 0 && (
    <Button
      variant="contained"
      onClick={() => {
        setShowSetup(true);
        setEditBudgetId(null);
        setEditBudgetName("");
      }}
    >
      Create a New Budget
    </Button>
  )}
</Box>

          {showSetup && (
            <BudgetSetup
              open={showSetup}
              onClose={() => setShowSetup(false)}
              onFinish={(data, name) => {
                handleFinishSetup(data, name);
                setShowSetup(false);
              }}
            />
          )}

          {/* Bank image background with button overlay */}
          {(!currentBudget || accounts.length === 0) && (
          <Box
            sx={{
              position: "relative",
              width: { xs: '100%', sm: 400, md: 480 },
              height: "auto",
              mx: "auto",
              my: 9,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
              borderRadius: 4,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease-in-out",
              overflow: "hidden",
              '&:hover': {
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
              },
              p: 4,
            }}
          >
            <Box
              component="img"
              src="/images/Bank.png"
              alt="Bank background"
              sx={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                opacity: 0.75,
                mb: 4,
                maxHeight: "300px",
              }}
            />
              </Box>
              )}

          {/* Budget Section */}
          {currentBudget && (
            <Box sx={{ mt: 1, width: "100%" }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Budget Table
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <BudgetGroup
                      title="Income"
                      items={currentBudget.data.income.map(item => ({ ...item, activity: ('activity' in item ? (item as any).activity : "0") }))}
                      onItemsChange={(items) => handleBudgetUpdate("income", items)}
                      transactions={[]}
                      expanded={!!expandedGroups["Income"]}
                      onToggle={() => handleToggleGroup("Income")}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <BudgetGroup
                      title="Expenses"
                      items={currentBudget.data.expenses.map(item => ({ ...item, activity: ('activity' in item ? (item as any).activity : "0") }))}
                      onItemsChange={(items) => handleBudgetUpdate("expenses", items)}
                      transactions={[]}
                      expanded={!!expandedGroups["Expenses"]}
                      onToggle={() => handleToggleGroup("Expenses")}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <BudgetGroup
                      title="Savings"
                      items={currentBudget.data.savings.map(item => ({ ...item, activity: ('activity' in item ? (item as any).activity : "0") }))}
                      onItemsChange={(items) => handleBudgetUpdate("savings", items)}
                      transactions={[]}
                      expanded={!!expandedGroups["Savings"]}
                      onToggle={() => handleToggleGroup("Savings")}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  <BudgetSummaryChart
                    data={currentBudget.data}
                    onBudgetSelect={handleBudgetSelect}
                    currentBudgets={budgets}
                    onCreateBudget={handleCreateNewBudget}
                    onDeleteBudget={handleDeleteBudget}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Connect Bank Account and Connected Accounts Section - moved here */}
          <Box sx={{ mt: 1, mb: 2, width: '100%' }}>
            <Button
              variant="outlined"
              onClick={handleConnectBank}
              disabled={plaidLoading}
              sx={{ mb: 2 }}
            >
              {plaidLoading ? <CircularProgress size={20} /> : "Connect Bank Account"}
            </Button>
            <br /><br />
            <Typography variant="h6" gutterBottom>
              Connected Bank Accounts
            </Typography>
            {loadingAccounts ? (
              <Typography>Loading accounts...</Typography>
            ) : accounts.length > 0 ? (
              <List>
                {accounts.map((account) => (
                  <ListItem 
                    key={account.account_id}
                    sx={{ 
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                      boxShadow: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => setSelectedAccount(account.account_id)}
                  >
                    <ListItemText
                      primary={account.name}
                      secondary={
                        account.balances?.current !== undefined && !isNaN(account.balances.current)
                          ? `Balance: $${account.balances.current.toFixed(2)}`
                          : "Balance: N/A"
                      }
                    />
                    {selectedAccount === account.account_id && (
                      <Chip label="Selected" color="primary" size="small" />
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" gutterBottom>
                No bank accounts connected
              </Typography>
            )}
          </Box>

          {/* Transactions Section */}
          {selectedAccount && (
            <Box sx={{ mt: 4, mb: 4, width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>

              {/* Search and Filter Controls */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Search Transactions"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      <MenuItem value="Income">Income</MenuItem>
                      <MenuItem value="Expense">Expense</MenuItem>
                      <MenuItem value="Savings">Savings</MenuItem>
                      <MenuItem value="Uncategorized">Uncategorized</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>

              {/* Analytics Cards */}
              {analytics && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Income
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          ${analytics.totalIncome.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Expenses
                        </Typography>
                        <Typography variant="h5" color="error.main">
                          ${analytics.totalExpenses.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Savings
                        </Typography>
                        <Typography variant="h5" color="primary.main">
                          ${analytics.totalSavings.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Spending Trends Chart */}
              {analytics && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Monthly Spending Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#4caf50" />
                      <Bar dataKey="expenses" name="Expenses" fill="#f44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}

              {/* Export and Actions Buttons */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={exportToPDF}>
                  Export to PDF
                </Button>
                <Button variant="outlined" onClick={exportToCSV}>
                  Export to CSV
                </Button>
                <Button variant="outlined" onClick={detectRecurringTransactions}>
                  Detect Recurring Transactions
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCategoryDialog(true)}
                >
                  Add Custom Category
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<NotificationsIcon />}
                  onClick={() => setShowAlertDialog(true)}
                >
                  Set Budget Alert
                </Button>
              </Box>

              {/* Transactions Table */}
              {loadingTransactions ? (
                <Typography>Loading transactions...</Typography>
              ) : filteredTransactions.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell align="right" sx={{
                            color: transaction.amount < 0 ? 'error.main' : 'success.main'
                          }}>
                            ${Math.abs(transaction.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.category || 'Uncategorized'} 
                              color={transaction.category ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => categorizeTransaction(transaction.id, 'Income')}
                              sx={{ mr: 1 }}
                            >
                              Income
                            </Button>
                            <Button
                              size="small"
                              onClick={() => categorizeTransaction(transaction.id, 'Expense')}
                              sx={{ mr: 1 }}
                            >
                              Expense
                            </Button>
                            <Button
                              size="small"
                              onClick={() => categorizeTransaction(transaction.id, 'Savings')}
                            >
                              Savings
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">
                  No transactions found
                </Typography>
              )}
            </Box>
          )}

          {/* Custom Category Dialog */}
          <Dialog open={showCategoryDialog} onClose={() => setShowCategoryDialog(false)}>
            <DialogTitle>Add Custom Category</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Category Name"
                value={newCategory.name || ''}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                sx={{ mt: 2 }}
              />
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newCategory.type || ''}
                  label="Type"
                  onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as any })}
                >
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="savings">Savings</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Keywords (comma-separated)"
                value={newCategory.keywords?.join(',') || ''}
                onChange={(e) => setNewCategory({ ...newCategory, keywords: e.target.value.split(',') })}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
              <Button onClick={handleAddCategory} variant="contained">Add</Button>
            </DialogActions>
          </Dialog>

          {/* Budget Alert Dialog */}
          <Dialog open={showAlertDialog} onClose={() => setShowAlertDialog(false)}>
            <DialogTitle>Set Budget Alert</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Alert Type</InputLabel>
                <Select
                  value={newAlert.type || ''}
                  label="Alert Type"
                  onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as any })}
                >
                  <MenuItem value="spending">Spending</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="savings">Savings</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="number"
                label="Threshold Amount"
                value={newAlert.threshold || ''}
                onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                sx={{ mt: 2 }}
              />
              <TextField
                fullWidth
                label="Alert Message"
                value={newAlert.message || ''}
                onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowAlertDialog(false)}>Cancel</Button>
              <Button onClick={handleAddAlert} variant="contained">Add</Button>
            </DialogActions>
          </Dialog>

          {/* Notification Snackbar */}
          <Snackbar
            open={!!notification}
            autoHideDuration={6000}
            onClose={() => setNotification(null)}
          >
            <Alert
              onClose={() => setNotification(null)}
              severity={notification?.type}
              sx={{ width: '100%' }}
            >
              {notification?.message}
            </Alert>
          </Snackbar>

          {/* Backup Controls at the bottom */}
          <Box sx={{ mt: 4, mb: 2, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Button
              variant="outlined"
              onClick={backupUserData}
              disabled={isBackingUp}
              startIcon={isBackingUp ? <CircularProgress size={20} /> : null}
            >
              {isBackingUp ? "Backing up..." : "Backup Data"}
            </Button>
            <Button
              variant="outlined"
              onClick={restoreUserData}
              disabled={isBackingUp}
            >
              Restore Data
            </Button>
            {lastBackupTime && (
              <Typography variant="caption" color="text.secondary">
                Last backup: {new Date(lastBackupTime).toLocaleString()}
              </Typography>
            )}
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};
export default BudgetBoard;  