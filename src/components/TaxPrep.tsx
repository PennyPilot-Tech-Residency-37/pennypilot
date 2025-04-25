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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
import { SelectChangeEvent } from "@mui/material";

interface DeductibleExpense {
  id?: string;
  deductibleAmount: number;
  category: string;
  notes: string;
  createdAt: string;
}

const formatUserName = (user: any) => {
  if (!user) return '';
  return user.displayName || user.email?.split('@')[0] || '';
};

export default function TaxPrep() {
  const { currentUser } = useAuth();
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
  const [totalDeductibleSpent, setTotalDeductibleSpent] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Predefined categories
  const predefinedCategories = ["Charitable Donations", "Business Expenses", "Medical Expenses", "Other"];

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    // Set up real-time listener
    const userDeductibleRef = collection(db, "users", currentUser.uid, "deductibleExpenses");
    const q = query(
      userDeductibleRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribeListener = onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as DeductibleExpense[];
      
      setDeductibleExpenses(expenses);
      calculateTotal(expenses);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching expenses:', error);
      setError("Failed to fetch expenses. Please try again.");
      setIsLoading(false);
    });

    setUnsubscribe(() => unsubscribeListener);

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, navigate]);

  const calculateTotal = (expenses: DeductibleExpense[]) => {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.deductibleAmount), 0);
    setTotalDeductibleSpent(total);
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsLoading(true);

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
        deductibleAmount: amount,
        category: finalCategory,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
      };

      const userDeductibleRef = collection(db, "users", currentUser.uid, "deductibleExpenses");

      // Reset form immediately after validation but before the save operation
      setFormData(initialFormState);
      
      if (editingId) {
        const expenseRef = doc(db, "users", currentUser.uid, "deductibleExpenses", editingId);
        await updateDoc(expenseRef, expenseData);
        setEditingId(null);
      } else {
        await addDoc(userDeductibleRef, expenseData);
      }

      setSuccess(editingId ? "Expense updated successfully!" : "Expense added successfully!");
    } catch (err) {
      // If there's an error, restore the form data
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

  const handleDelete = async (id: string) => {
    if (!currentUser) return;

    try {
      const expenseRef = doc(db, "users", currentUser.uid, "deductibleExpenses", id);
      await deleteDoc(expenseRef);
      setSuccess("Expense deleted successfully!");
    } catch (err) {
      setError("Failed to delete expense. Please try again.");
    }
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

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ position: 'relative', mt: 12, mb: 2, pt: 4 }}>
          <PilotAvatar
            message={
              currentUser
                ? `Track your tax deductions, ${formatUserName(currentUser)}!`
                : "Log in to track expenses!"
            }
          />
        </Box>

        {currentUser && (
          <>
            {/* Entry Form */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {editingId ? "Edit Deductible Expense" : "Add Deductible Expense"}
              </Typography>
              <form onSubmit={handleSave}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    name="deductibleAmount"
                    label="Amount ($)"
                    type="number"
                    value={formData.deductibleAmount}
                    onChange={handleInputChange}
                    required
                    fullWidth
                  />

                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    displayEmpty
                    required
                    fullWidth
                  >
                    <MenuItem value="" disabled>Select Category</MenuItem>
                    {predefinedCategories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>

                  {formData.category === "Other" && (
                    <TextField
                      name="customCategory"
                      label="Custom Category"
                      value={formData.customCategory}
                      onChange={handleInputChange}
                      required
                      fullWidth
                    />
                  )}

                  <TextField
                    name="notes"
                    label="Notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    fullWidth
                  />

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button type="submit" variant="contained" color="primary">
                      {editingId ? "Update" : "Add"} Expense
                    </Button>
                    {editingId && (
                      <Button variant="outlined" onClick={resetForm}>
                        Cancel Edit
                      </Button>
                    )}
                  </Box>
                </Box>
              </form>
            </Card>

            {/* Summary Card */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Typography variant="h4">
                Total Deductions: ${totalDeductibleSpent.toFixed(2)}
              </Typography>
            </Card>

            {/* Expenses Table */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Logged Expenses
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <LoadingSpinner />
                </Box>
              ) : deductibleExpenses.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Amount</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deductibleExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>${Number(expense.deductibleAmount).toFixed(2)}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.notes}</TableCell>
                        <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEdit(expense)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(expense.id!)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                  No expenses logged yet.
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