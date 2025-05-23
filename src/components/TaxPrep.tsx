import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Snackbar,
  IconButton,
  CircularProgress,
  ButtonGroup,
  TableSortLabel,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Grid,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import PilotAvatar from "./PilotAvatar";
import { db } from "../types/firebaseConfig";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from "firebase/firestore";
import { alpha } from '@mui/material/styles';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, TextRun, WidthType } from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DeductibleExpense {
  id?: string;
  deductibleAmount: number;
  category: string;
  notes: string;
  createdAt: string;
}

type SortField = 'deductibleAmount' | 'createdAt' | 'category';
type SortOrder = 'asc' | 'desc';

const formatUserName = (user: any) => {
  if (!user) return '';
  return user.displayName || user.email?.split('@')[0] || '';
};

const COLORS = ["#1976d2", "#f57c00", "#fbc02d", "#43a047"]; // Blue, Orange, Yellow, Green

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

// Updated renderPieLabel to show amounts with $
const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  index,
  value,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  index: number;
  value: number;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill={COLORS[index % COLORS.length]}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={16}
      fontWeight={400}
    >
      ${value.toFixed(2)} {/* Added $ symbol and formatted to 2 decimal places */}
    </text>
  );
};

export default function TaxPrep() {
  const { currentUser, getUserData, setUserData } = useAuth();
  const navigate = useNavigate();

  // Form state
  const initialFormState = {
    deductibleAmount: "",
    category: "",
    customCategory: "",
    notes: "",
  };
  const [formData, setFormData] = useState(initialFormState);
  
  // App state
  const [deductibleExpenses, setDeductibleExpenses] = useState<DeductibleExpense[]>([]);
  const [totalDeductibleSpent, setTotalDeductibleSpent] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Predefined categories
  const predefinedCategories = ["Charitable Donations", "Business Expenses", "Medical Expenses", "Home Office Expenses", "Student Loan Interest", "Mortgage Interest", "Retirement Contributions", "Other"];

  // Load user-specific data
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        setDeductibleExpenses([]);
        setTotalDeductibleSpent(0);
        return;
      }

      let expenses = await getUserData('taxPrep', 'deductibleExpenses');
      if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
        // Fallback to localStorage if user data is empty
        const local = localStorage.getItem('deductibleExpenses');
        if (local) {
          try {
            expenses = JSON.parse(local);
          } catch {}
        }
      }
        if (Array.isArray(expenses)) {
          setDeductibleExpenses(expenses);
          const total = expenses.reduce((sum: number, expense: DeductibleExpense) => sum + expense.deductibleAmount, 0);
          setTotalDeductibleSpent(total);
      } else {
      }
    };

    loadUserData();
  }, [currentUser, getUserData]);

  // Clear data when component unmounts
  useEffect(() => {
    return () => {
      if (currentUser) {
        setUserData('taxPrep', 'deductibleExpenses', deductibleExpenses);
      }
    };
  }, [currentUser, deductibleExpenses, setUserData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
  };

  // Update handleSave to use local storage
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!currentUser) {
      setError("You must be logged in to save expenses.");
      setIsLoading(false);
      return;
    }

    const amount = Number(formData.deductibleAmount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount.");
      setIsLoading(false);
      return;
    }

    if (!formData.category) {
      setError("Please select a category.");
      setIsLoading(false);
      return;
    }

    try {
      const finalCategory = formData.category === "Other" ? formData.customCategory : formData.category;
      const expenseData = {
        id: editingId || Date.now().toString(),
        deductibleAmount: amount,
        category: finalCategory,
        notes: formData.notes,
        createdAt: editingId
          ? deductibleExpenses.find(e => e.id === editingId)?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
      };
      let updatedExpenses;
      if (editingId) {
        updatedExpenses = deductibleExpenses.map(e => e.id === editingId ? expenseData : e);
        setEditingId(null);
      } else {
        updatedExpenses = [...deductibleExpenses, expenseData];
      }
      setDeductibleExpenses(updatedExpenses);
      await setUserData('taxPrep', 'deductibleExpenses', updatedExpenses);
      localStorage.setItem('deductibleExpenses', JSON.stringify(updatedExpenses));
      setFormData(initialFormState);
      setSuccess(editingId ? "Expense updated successfully!" : "Expense added successfully!");
    } catch (err) {
      setFormData({
        deductibleAmount: amount.toString(),
        category: formData.category,
        customCategory: formData.customCategory,
        notes: formData.notes
      });
      setError("Failed to save expense. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (expense: DeductibleExpense) => {
    setEditingId(expense.id || null);
    setFormData({
      deductibleAmount: expense.deductibleAmount.toString(),
      category: predefinedCategories.includes(expense.category) ? expense.category : "Other",
      customCategory: predefinedCategories.includes(expense.category) ? "" : expense.category,
      notes: expense.notes,
    });
  };

  // Update handleDelete to use local storage
  const handleDelete = async (id: string) => {
    try {
      const updatedExpenses = deductibleExpenses.filter(e => e.id !== id);
      setDeductibleExpenses(updatedExpenses);
      await setUserData('taxPrep', 'deductibleExpenses', updatedExpenses);
      localStorage.setItem('deductibleExpenses', JSON.stringify(updatedExpenses));
      setSuccess("Expense deleted successfully!");
    } catch (err) {
      setError("Failed to delete expense. Please try again.");
    }
  };

  const handleExport = () => {
    if (!deductibleExpenses.length) {
      setError("No expenses to export.");
      return;
    }

    // Create CSV content
    const headers = ["Date", "Category", "Amount", "Notes"];
    const csvContent = [
      headers.join(","),
      ...deductibleExpenses.map(expense => [
        new Date(expense.createdAt).toLocaleDateString(),
        expense.category,
        expense.deductibleAmount,
        `"${expense.notes.replace(/"/g, '""')}"` // Escape quotes in notes
      ]).join("\n")
    ].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `deductible-expenses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export as Word
  const handleExportWord = () => {
    if (!deductibleExpenses.length) {
      setError("No expenses to export.");
      return;
    }
    const tableRows = [
      new DocxTableRow({
        children: [
          new DocxTableCell({ children: [new Paragraph("Date")], width: { size: 25, type: WidthType.PERCENTAGE } }),
          new DocxTableCell({ children: [new Paragraph("Category")], width: { size: 25, type: WidthType.PERCENTAGE } }),
          new DocxTableCell({ children: [new Paragraph("Amount")], width: { size: 25, type: WidthType.PERCENTAGE } }),
          new DocxTableCell({ children: [new Paragraph("Notes")], width: { size: 25, type: WidthType.PERCENTAGE } }),
        ],
      }),
      ...deductibleExpenses.map(expense => new DocxTableRow({
        children: [
          new DocxTableCell({ children: [new Paragraph(new Date(expense.createdAt).toLocaleDateString())] }),
          new DocxTableCell({ children: [new Paragraph(expense.category)] }),
          new DocxTableCell({ children: [new Paragraph(`$${expense.deductibleAmount}`)] }),
          new DocxTableCell({ children: [new Paragraph(expense.notes)] }),
        ],
      }))
    ];
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: "Deductible Expenses", heading: "Heading1" }),
            new DocxTable({ rows: tableRows }),
          ],
        },
      ],
    });
    Packer.toBlob(doc).then((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deductible-expenses-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  };

  // Export as PDF
  const handleExportPDF = () => {
    if (!deductibleExpenses.length) {
      setError("No expenses to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Deductible Expenses", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["Date", "Category", "Amount", "Notes"]],
      body: deductibleExpenses.map(expense => [
        new Date(expense.createdAt).toLocaleDateString(),
        expense.category,
        `$${expense.deductibleAmount}`,
        expense.notes
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 118, 210] },
    });
    doc.save(`deductible-expenses-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const LoadingSpinner = () => (
    <Box
      component="img"
      src="/images/PennyPilot-logo.png"
      sx={{
        position: 'absolute',
        top: '50%',
        right: '25%',
        width: 60,
        height: 60,
        transform: 'translateY(-50%)',
        animation: 'spin 1s linear infinite',
        '@keyframes spin': {
          '0%': { transform: 'translateY(-50%) rotate(0deg)' },
          '100%': { transform: 'translateY(-50%) rotate(360deg)' }
        }
      }}
    />
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleCategoryFilterChange = (event: SelectChangeEvent) => {
    setCategoryFilter(event.target.value);
  };

  const getFilteredAndSortedExpenses = () => {
    let filtered = [...deductibleExpenses];
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'deductibleAmount') {
        comparison = a.deductibleAmount - b.deductibleAmount;
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Calculate total for percentage in tooltip
  const totalDeductibleValue = groupExpensesByCategory(deductibleExpenses).reduce(
    (sum, entry) => sum + entry.value,
    0
  );

  // Update backup functionality to use local storage
  const backupExpenses = async () => {
    try {
      const backupData = {
        deductibleExpenses,
        totalDeductibleSpent,
        lastBackup: new Date().toISOString(),
      };
      await setUserData('taxPrep', 'expensesBackup', backupData);
    } catch (err) {
      setError("Failed to backup expenses");
    }
  };

  // Update restore functionality to use local storage
  const restoreExpenses = async () => {
    try {
      const backupData = await getUserData('taxPrep', 'expensesBackup');
      if (backupData && typeof backupData === 'object') {
        if (Array.isArray(backupData.deductibleExpenses)) {
          setDeductibleExpenses(backupData.deductibleExpenses);
        }
        if (typeof backupData.totalDeductibleSpent === 'number') {
          setTotalDeductibleSpent(backupData.totalDeductibleSpent);
        }
      }
    } catch (err) {
      setError('Failed to restore expenses');
    }
  };

  // Auto-backup every hour
  useEffect(() => {
    const backupInterval = setInterval(backupExpenses, 3600000); // 1 hour
    return () => clearInterval(backupInterval);
  }, [deductibleExpenses, totalDeductibleSpent]);

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ 
          position: 'relative', 
          mt: 8,
          mb: -4,
          pt: 4,
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
          pr: { xs: 2, sm: 4, md: 6 }
        }}>
          <PilotAvatar
            message={
              currentUser
                ? `Ready to track your tax deductions, ${currentUser.email?.split("@")[0]}?`
                : "Log in to track expenses!"
            }
            sx={{ 
              position: 'relative', 
              zIndex: 2,
              mb: 4
            }}
          />
        </Box>

        {currentUser && (
          <>
            {/* Entry Form */}
            <Card 
              sx={{ 
                p: 2,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                borderRadius: 3,
                background: (theme) => `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
              }}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                {editingId ? "Edit Deductible Expense" : "Add Deductible Expense"}
              </Typography>
              <form onSubmit={handleSave}>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="deductibleAmount"
                      label="Amount"
                      type="number"
                      value={formData.deductibleAmount}
                      onChange={handleInputChange}
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={formData.category}
                        label="Category"
                        onChange={handleInputChange}
                        required
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            '&:hover': {
                              borderColor: 'primary.main',
                            },
                          },
                        }}
                      >
                        <MenuItem value="" disabled>Select Category</MenuItem>
                        {predefinedCategories.map((cat) => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {formData.category === "Other" && (
                    <Grid item xs={12}>
                      <TextField
                        name="customCategory"
                        label="Custom Category"
                        value={formData.customCategory}
                        onChange={handleInputChange}
                        required
                        fullWidth
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField
                      name="notes"
                      label="Notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button 
                        type="submit" 
                        variant="outlined"
                        sx={{
                          py: 1,
                          px: 2,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.95rem',
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
                        {editingId ? "Update" : "Add"} Expense
                      </Button>
                      {editingId && (
                        <Button 
                          variant="outlined" 
                          onClick={resetForm}
                          sx={{
                            py: 1.5,
                            px: 4,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                          }}
                        >
                          Cancel Edit
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Card>

            {/* Summary Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ 
                    p: 2,
                    height: '100%',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 3,
                    background: (theme) => `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                    Total Tax Deductions:
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1.5, fontWeight: 700, color: 'success.main' }}>
                    ${totalDeductibleSpent.toFixed(2)}
                  </Typography>
                  <br /><br />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExport}
                      disabled={!deductibleExpenses.length}
                      sx={{
                        py: 1,
                        px: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.95rem',
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
                      Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExportWord}
                      disabled={!deductibleExpenses.length}
                      sx={{
                        py: 1,
                        px: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.95rem',
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
                      Export Word
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExportPDF}
                      disabled={!deductibleExpenses.length}
                      sx={{
                        py: 1,
                        px: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.95rem',
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
                      Export PDF
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ 
                    p: 2,
                    height: '100%',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 3,
                    background: (theme) => `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
                  }}
                >
                  <Typography variant="h6" sx={{ mt: 2, mb: 3, fontWeight: 800, color: 'primary.main', textAlign: 'center' }}>
                    Expenses by Category
                  </Typography>
                  <Box sx={{ flex: 1, height: 350 }}>
                    <ResponsiveContainer width="110%" height={350}>
                      <PieChart>
                        <Pie
                          data={groupExpensesByCategory(deductibleExpenses)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          label={renderPieLabel}
                          labelLine={true}
                        >
                          {groupExpensesByCategory(deductibleExpenses).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{ 
                            paddingTop: 20,
                            fontSize: '14px',
                            lineHeight: '24px',
                            bottom: 5,
                          }}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${((value / totalDeductibleValue) * 100).toFixed(1)}%`,
                            'Percentage'
                          ]}
                          contentStyle={{
                            fontSize: "12px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "rgba(255,255,255,0.95)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* Space below chart section and above logged expenses */}
            <Box sx={{ height: 24 }} />

            {/* Expenses Table */}
            <Card 
              sx={{ 
                p: 2,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Logged Expenses
                </Typography>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    onChange={handleCategoryFilterChange}
                    label="Filter by Category"
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {predefinedCategories.map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <LoadingSpinner />
                </Box>
              ) : getFilteredAndSortedExpenses().length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === 'deductibleAmount'}
                          direction={sortField === 'deductibleAmount' ? sortOrder : 'asc'}
                          onClick={() => handleSort('deductibleAmount')}
                        >
                          Amount
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === 'category'}
                          direction={sortField === 'category' ? sortOrder : 'asc'}
                          onClick={() => handleSort('category')}
                        >
                          Category
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortField === 'createdAt'}
                          direction={sortField === 'createdAt' ? sortOrder : 'asc'}
                          onClick={() => handleSort('createdAt')}
                        >
                          Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredAndSortedExpenses().map((expense) => (
                      <TableRow key={expense.id} sx={{ height: 18}}>
                        <TableCell>${Number(expense.deductibleAmount).toFixed(2)}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.notes}</TableCell>
                        <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleEdit(expense)} 
                            color="primary"
                            sx={{
                              transition: 'all 0.2s ease-in-out',
                              '&:active': {
                                transform: 'scale(0.9)',
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(expense.id!)} 
                            color="error"
                            sx={{
                              transition: 'all 0.2s ease-in-out',
                              '&:active': {
                                transform: 'scale(0.9)',
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                  {categoryFilter !== 'all' 
                    ? `No expenses found in category "${categoryFilter}"`
                    : "No expenses logged yet."}
                </Typography>
              )}
            </Card>
          </>
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          message={error}
          ContentProps={{ sx: { backgroundColor: "error.main" } }}
        />
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess("")}
          message={success}
          ContentProps={{ sx: { backgroundColor: "success.main" } }}
        />
      </Box>
      <Box sx={{ height: "200px" }} />
    </Container>
  );
}