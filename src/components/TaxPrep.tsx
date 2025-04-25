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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import PilotAvatar from "./PilotAvatar";
import { db } from "../types/firebaseConfig";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function TaxPrep() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State for deductible expenses form
  const [deductibleAmount, setDeductibleAmount] = useState<number | "">("");
  const [deductibleCategory, setDeductibleCategory] = useState<string>("");
  const [deductibleCustomCategory, setDeductibleCustomCategory] = useState<string>("");
  const [deductibleNotes, setDeductibleNotes] = useState<string>("");

  // State for deductible expenses list and totals
  const [deductibleExpenses, setDeductibleExpenses] = useState<any[]>([]);
  const [totalDeductibleSpent, setTotalDeductibleSpent] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [editingDeductibleId, setEditingDeductibleId] = useState<string | null>(null);
  const [isSavingDeductible, setIsSavingDeductible] = useState<boolean>(false);
  const [deductibleFormResetKey, setDeductibleFormResetKey] = useState<number>(0);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      setError("Please log in to continue.");
      return;
    }

    const fetchDeductibleExpenses = async () => {
      try {
        const userDeductibleRef = collection(db, "users", currentUser.uid, "deductibleExpenses");
        const snapshot = await getDocs(userDeductibleRef);
        const expenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDeductibleExpenses(expenses);
        const totalSpent = expenses.reduce((sum: number, expense: any) => sum + (expense.deductibleAmount || 0), 0);
        setTotalDeductibleSpent(totalSpent);
      } catch (err) {
        setError("Failed to fetch deductible expenses. Please try again.");
      }
    };

    // Note: fetchTransactions is commented out as per backend requirements
    /*
    const fetchTransactions = async () => {
      try {
        const response = await axios.post(
          "https://api.pennypilot.com/get-plaid-transactions",
          { user_id: currentUser.uid, categories: ["Charitable Donations", "Business Expenses", "Medical Expenses"] },
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        setTransactions(response.data.transactions);
      } catch (err) {
        setError("Unable to load transactions. Check your connection.");
      }
    };
    fetchTransactions();
    */

    fetchDeductibleExpenses();
    const interval = setInterval(fetchDeductibleExpenses, 10000);
    return () => clearInterval(interval);
  }, [currentUser, navigate]);

  const handleEditDeductible = (expense: any) => {
    setEditingDeductibleId(expense.id);
    setDeductibleAmount(expense.deductibleAmount);
    const predefinedCategories = ["Charitable Donations", "Business Expenses", "Medical Expenses"];
    if (predefinedCategories.includes(expense.category)) {
      setDeductibleCategory(expense.category);
      setDeductibleCustomCategory("");
    } else {
      setDeductibleCategory("Other");
      setDeductibleCustomCategory(expense.category);
    }
    setDeductibleNotes(expense.notes || "");
  };

  const handleDeleteDeductible = async (expenseId: string) => {
    if (!currentUser) return;
    try {
      const expenseRef = doc(db, "users", currentUser.uid, "deductibleExpenses", expenseId);
      await deleteDoc(expenseRef);
      const userDeductibleRef = collection(db, "users", currentUser.uid, "deductibleExpenses");
      const snapshot = await getDocs(userDeductibleRef);
      const expenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDeductibleExpenses(expenses);
      const totalSpent = expenses.reduce((sum: number, expense: any) => sum + (expense.deductibleAmount || 0), 0);
      setTotalDeductibleSpent(totalSpent);
    } catch (err) {
      setError("Failed to delete deductible expense. Please try again.");
    }
  };

  const resetDeductibleForm = () => {
    setDeductibleAmount("");
    setDeductibleCategory("");
    setDeductibleCustomCategory("");
    setDeductibleNotes("");
    setEditingDeductibleId(null);
    setDeductibleFormResetKey(Date.now()); // Forces re-render to clear fields
  };

  const handleSaveDeductible = async () => {
    if (!currentUser || isSavingDeductible) return;

    // Clear form immediately for new submissions
    if (!editingDeductibleId) {
      resetDeductibleForm();
    }

    if (deductibleAmount === "" || deductibleAmount <= 0) {
      setError("Deductible amount must be a positive number greater than 0.");
      return;
    }
    if (!deductibleCategory) {
      setError("Please select a tax category for the deductible expense.");
      return;
    }
    if (deductibleCategory === "Other" && !deductibleCustomCategory) {
      setError("Please enter a custom category for the deductible expense.");
      return;
    }

    setIsSavingDeductible(true);
    try {
      const finalCategory = deductibleCategory === "Other" ? deductibleCustomCategory : deductibleCategory;
      const userDeductibleRef = collection(db, "users", currentUser.uid, "deductibleExpenses");

      if (editingDeductibleId) {
        const expenseRef = doc(db, "users", currentUser.uid, "deductibleExpenses", editingDeductibleId);
        await updateDoc(expenseRef, {
          deductibleAmount,
          category: finalCategory,
          notes: deductibleNotes,
          createdAt: new Date().toISOString(),
        });
        resetDeductibleForm(); // Clear form after successful edit
      } else {
        await addDoc(userDeductibleRef, {
          deductibleAmount,
          category: finalCategory,
          notes: deductibleNotes,
          createdAt: new Date().toISOString(),
        });
      }

      const snapshot = await getDocs(userDeductibleRef);
      const expenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDeductibleExpenses(expenses);
      const totalSpent = expenses.reduce((sum: number, expense: any) => sum + (expense.deductibleAmount || 0), 0);
      setTotalDeductibleSpent(totalSpent);

      setSuccess(editingDeductibleId ? "Deductible expense updated successfully!" : "Deductible expense logged successfully!");

      // Backend API call (commented out for Plaid API)
      /*
      await axios.post(
        "https://api.pennypilot.com/add-entry",
        {
          user_id: currentUser.uid,
          collection_name: "deductibleExpenses",
          data: { deductibleAmount, category: finalCategory, notes: deductibleNotes },
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      const response = await axios.post(
        "https://api.pennypilot.com/get-entries",
        { user_id: currentUser.uid, collection_name: "deductibleExpenses" },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      const expenses = response.data.entries;
      setDeductibleExpenses(expenses);
      const totalSpent = expenses.reduce((sum: number, expense: any) => sum + (expense.deductibleAmount || 0), 0);
      setTotalDeductibleSpent(totalSpent);
      */
    } catch (err) {
      setError("Failed to save deductible expense. Please try again.");
    } finally {
      setIsSavingDeductible(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 10 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          minHeight: "calc(100vh - 128px)",
          justifyContent: "center",
          px: { xs: 2, sm: 0 },
        }}
      >
        <PilotAvatar
          message={
            currentUser
              ? deductibleExpenses.length > 0
                ? "Deductibles logged, Captain!"
                : "Log your expenses, Captain!"
              : "Log in to track expenses!"
          }
        />
        <Typography variant="h5" gutterBottom>
          Freelancer's Tax Deductible Logbook
        </Typography>
        {currentUser ? (
          <>
            {/* Section: Log Money Spent on Tax-Deductible Items */}
            <Card sx={{ p: 2, mb: 2, width: { xs: "100%", sm: "90%", md: "70%", lg: "60%" } }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Log money already spent on tax-deductible items.
              </Typography>
              <TextField
                key={`deductible-amount-${deductibleFormResetKey}`}
                label="Amount Spent ($)"
                type="number"
                value={deductibleAmount}
                onChange={(e) => setDeductibleAmount(e.target.value ? parseFloat(e.target.value) : "")}
                fullWidth
                sx={{ mb: 2 }}
              />
              <Select
                key={`deductible-category-${deductibleFormResetKey}`}
                value={deductibleCategory || ""}
                onChange={(e) => setDeductibleCategory(e.target.value)}
                displayEmpty
                fullWidth
                sx={{ mb: 2 }}
              >
                <MenuItem value="" disabled>
                  Select Tax Category
                </MenuItem>
                <MenuItem value="Charitable Donations">Charitable Donations</MenuItem>
                <MenuItem value="Business Expenses">Business Expenses</MenuItem>
                <MenuItem value="Medical Expenses">Medical Expenses</MenuItem>
                <MenuItem value="Other">Other (Custom)</MenuItem>
              </Select>
              {deductibleCategory === "Other" && (
                <TextField
                  key={`deductible-custom-category-${deductibleFormResetKey}`}
                  label="Custom Category"
                  value={deductibleCustomCategory}
                  onChange={(e) => setDeductibleCustomCategory(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              )}
              <TextField
                key={`deductible-notes-${deductibleFormResetKey}`}
                label="Notes"
                value={deductibleNotes}
                onChange={(e) => setDeductibleNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleSaveDeductible}
                sx={{ mt: 2 }}
              >
                {editingDeductibleId ? "Update Expense" : "Log Expense"}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={resetDeductibleForm}
                sx={{ mt: 2, ml: 2 }}
              >
                Clear Form
              </Button>
              {editingDeductibleId && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={resetDeductibleForm}
                  sx={{ mt: 2, ml: 2 }}
                >
                  Cancel Edit
                </Button>
              )}
            </Card>

            {/* Table of Logged Deductible Expenses */}
            <Card sx={{ p: 2, mb: 2, width: { xs: "100%", sm: "90%", md: "70%", lg: "60%" } }}>
              <Typography variant="h6" gutterBottom>
                Logged Deductible Expenses
              </Typography>
              {deductibleExpenses.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Amount Spent</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deductibleExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>${expense.deductibleAmount}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.notes || "N/A"}</TableCell>
                        <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEditDeductible(expense)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteDeductible(expense.id)} color="secondary">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography>No deductible expenses logged yet.</Typography>
              )}
            </Card>

            {/* Summary Section */}
            <Card sx={{ p: 2, mb: 2, width: { xs: "100%", sm: "90%", md: "70%", lg: "60%" } }}>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Typography>
                Total Spent on Tax-Deductible Items: ${totalDeductibleSpent.toFixed(2)}
              </Typography>
            </Card>
          </>
        ) : (
          <Typography>Please log in to log your tax data.</Typography>
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
      <Box sx={{ height: "100px" }} />
    </Container>
  );
}