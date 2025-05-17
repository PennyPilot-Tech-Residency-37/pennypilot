import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  LinearProgress,
  Box,
  Tooltip,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import "./Budget.css";

const theme = createTheme({
  spacing: 8,
  typography: {
    h6: { fontWeight: 600 },
  },
  palette: {
    primary: { main: "#1976d2" },
    success: { main: "#4caf50" },
    error: { main: "#f44336" },
  },
});

interface BudgetItem {
  name: string;
  amount: string; // Expected (Income), Budgeted (Expenses), Target (Savings)
}

interface BudgetGroupProps {
  title: "Income" | "Expenses" | "Savings";
  items: BudgetItem[];
  onItemsChange?: (items: BudgetItem[]) => void;
  transactions: any[]; // Plaid transactions
}

const SortableItem = ({
  item,
  index,
  title,
  onItemChange,
  onDelete,
  transactions,
}: {
  item: BudgetItem;
  index: number;
  title: "Income" | "Expenses" | "Savings";
  onItemChange: (index: number, key: string, value: string) => void;
  onDelete: (index: number) => void;
  transactions: any[];
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.name || index,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate actual amount (Received, Spent, Saved)
  const calculateActual = () => {
    const filterCategory = title === "Income" ? "Income" : title === "Expenses" ? "Expense" : "Savings";
    return transactions
      .filter((t) => t.category === filterCategory && (t.description ?? "").toLowerCase().includes((item.name ?? "").toLowerCase()))
      .reduce((sum, t) => sum + (title === "Income" ? t.amount : Math.abs(t.amount)), 0)
      .toFixed(2);
  };

  const actual = calculateActual();
  const planned = parseFloat(item.amount) || 0;
  const difference = (planned - parseFloat(actual)).toFixed(2);
  const progress = (parseFloat(actual) / planned) * 100 || 0;

  return (
    <TableRow ref={setNodeRef} style={style} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
      <TableCell colSpan={4} sx={{ padding: 0, borderBottom: "none" }}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {/* First Line */}
          <Box sx={{ display: "flex", alignItems: "center", padding: 1 }}>
            <TableCell sx={{ width: 40, padding: 0.5, borderBottom: "none" }}>
              <IconButton
                {...listeners}
                sx={{ cursor: "grab", "&:hover": { color: "primary.main" }, padding: 0.5 }}
                aria-label="Drag to reorder"
              >
                <DragIndicatorIcon fontSize="small" />
              </IconButton>
            </TableCell>
            <TableCell sx={{ width: "35%", padding: 0.5, borderBottom: "none" }}>
              <TextField
                fullWidth
                value={item.name}
                variant="outlined"
                onChange={(e) => onItemChange(index, "name", e.target.value)}
                size="small"
                inputProps={{ style: { fontSize: "0.875rem" } }}
                sx={{ "& .MuiOutlinedInput-root": { height: 32 } }}
                aria-label={`${title} name`}
              />
            </TableCell>
            <TableCell align="right" sx={{ width: "25%", padding: 0.5, borderBottom: "none" }}>
              <TextField
                fullWidth
                type="number"
                value={item.amount}
                variant="outlined"
                onChange={(e) => onItemChange(index, "amount", e.target.value)}
                size="small"
                inputProps={{ style: { fontSize: "0.875rem" } }}
                sx={{ "& .MuiOutlinedInput-root": { height: 32 } }}
                aria-label={`${title === "Income" ? "Expected" : title === "Expenses" ? "Budgeted" : "Target"} amount`}
              />
            </TableCell>
            <TableCell align="right" sx={{ width: "20%", padding: 0.5, borderBottom: "none", fontSize: "0.875rem" }}>
              {`$${actual}`}
            </TableCell>
          </Box>
          {/* Second Line */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", bgcolor: "#f5f5f5" }}>
            <Box sx={{ width: "40%", display: "flex", alignItems: "center" }}>
              <Typography
                sx={{ fontSize: "0.875rem", color: parseFloat(difference) < 0 ? "error.main" : "success.main" }}
              >
                Difference: ${difference}
              </Typography>
            </Box>
            <Box sx={{ width: "50%", display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>{`${Math.round(progress)}%`}</Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(progress, 100)}
                color={progress > 100 ? "error" : "primary"}
                sx={{ width: 120, height: 4 }}
              />
            </Box>
            <Box sx={{ width: "10%", display: "flex", justifyContent: "flex-end" }}>
              <IconButton
                onClick={() => onDelete(index)}
                aria-label={`Delete ${item.name}`}
                size="small"
                sx={{ padding: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
};

const BudgetGroup = ({ title, items, onItemsChange, transactions }: BudgetGroupProps) => {
  const [groupItems, setGroupItems] = useState<BudgetItem[]>(items);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setGroupItems(items);
  }, [items]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = groupItems.findIndex((item, idx) => (item.name || idx) === active.id);
      const newIndex = groupItems.findIndex((item, idx) => (item.name || idx) === over?.id);
      const newItems = arrayMove(groupItems, oldIndex, newIndex);
      setGroupItems(newItems);
      onItemsChange?.(newItems);
    }
  };

  const handleItemChange = async (index: number, key: string, value: string) => {
    const updated = [...groupItems];
    updated[index] = { ...updated[index], [key]: value };
    setGroupItems(updated);
    onItemsChange?.(updated);

    // Sync to Notion
    try {
      await axios.post("/api/notion/sync", {
        user_id: "current_user_id", // Replace with actual user ID
        page_type: "budget",
        group: title.toLowerCase(),
        data: updated.map((item) => ({
          name: item.name,
          amount: parseFloat(item.amount) || 0,
          actual: parseFloat(
            transactions
              .filter((t) =>
                t.category === (title === "Income" ? "Income" : title === "Expenses" ? "Expense" : "Savings") &&
              (t.description ?? "").toLowerCase().includes(item.name.toLowerCase())
              )
              .reduce((sum, t) => sum + (title === "Income" ? t.amount : Math.abs(t.amount)), 0)
              .toFixed(2)
          ),
          difference: (parseFloat(item.amount) || 0) - parseFloat(
            transactions
              .filter((t) =>
                t.category === (title === "Income" ? "Income" : title === "Expenses" ? "Expense" : "Savings") &&
              (t.description ?? "").toLowerCase().includes(item.name.toLowerCase())
              )
              .reduce((sum, t) => sum + (title === "Income" ? t.amount : Math.abs(t.amount)), 0)
              .toFixed(2)
          ),
        })),
      });
    } catch (err) {
      console.error("Failed to sync to Notion:", err);
    }
  };

  const handleDelete = (index: number) => {
    const updated = groupItems.filter((_, i) => i !== index);
    setGroupItems(updated);
    onItemsChange?.(updated);
  };

  const handleAddLine = () => {
    const updated = [...groupItems, { name: "", amount: "" }];
    setGroupItems(updated);
    onItemsChange?.(updated);
  };

  const sum = (arr: { amount: string }[]) =>
    arr.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0);
  const sumActual = () =>
    groupItems.reduce((acc, item) => {
      return (
        acc +
        parseFloat(
          transactions
            .filter((t) =>
              t.category === (title === "Income" ? "Income" : title === "Expenses" ? "Expense" : "Savings") &&
            (t.description ?? "").toLowerCase().includes((item.name ?? "").toLowerCase())
            )
            .reduce((sum, t) => sum + (title === "Income" ? t.amount : Math.abs(t.amount)), 0)
            .toFixed(2)
        )
      );
    }, 0);

  // Column headers based on group type
  const headers = {
    Income: ["", "Source", "Expected", "Received"],
    Expenses: ["", "Category", "Budgeted", "Spent"],
    Savings: ["", "Goal", "Target", "Saved"],
  };

  return (
    <ThemeProvider theme={theme}>
      <Accordion
        defaultExpanded
        sx={{
          borderBottom: "1px solid #e0e0e0",
          borderRadius: 2,
          boxShadow: "none",
          "&:before": { display: "none" },
          "&.Mui-expanded": { margin: "16px 0" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            borderRadius: 2,
            "&.Mui-expanded": { minHeight: 48 },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
            {title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflowX: "hidden" }}>
            <Table aria-label={`${title} budget table`}>
              <TableHead>
                <TableRow>
                  {headers[title].map((header) => (
                    <TableCell
                      key={header}
                      align={header === "" ? "center" : header === "Source" || header === "Category" || header === "Goal" ? "left" : "right"}
                      sx={{ fontWeight: "bold", color: "primary.main", fontSize: "0.875rem", padding: 1 }}
                    >
                      <Tooltip
                        title={
                          header === "Expected" ? "The amount you plan to receive." :
                          header === "Budgeted" ? "The amount you've planned to spend." :
                          header === "Target" ? "The amount you aim to save." :
                          header === "Received" ? "Actual income received." :
                          header === "Spent" ? "What you've spent so far." :
                          header === "Saved" ? "Amount contributed to savings." :
                          ""
                        }
                        componentsProps={{ tooltip: { sx: { whiteSpace: "normal", maxWidth: 200 } } }}
                      >
                        <span>{header}</span>
                      </Tooltip>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={groupItems.map((i, idx) => i.name || idx)}
                    strategy={verticalListSortingStrategy}
                  >
                    {groupItems.map((item, index) => (
                      <SortableItem
                        key={item.name || index}
                        item={item}
                        index={index}
                        title={title}
                        onItemChange={handleItemChange}
                        onDelete={handleDelete}
                        transactions={transactions}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={3}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddLine}
              sx={{ textTransform: "none", borderRadius: 2, padding: "8px 16px" }}
              aria-label={`Add a new ${title.toLowerCase()} line`}
            >
              Add a new line
            </Button>
          </Box>

          {/* Totals Row */}
          <Box mt={2} sx={{ borderTop: "1px solid #e0e0e0", pt: 2, borderRadius: 2 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ width: 40, padding: 0.5 }} />
                  <TableCell sx={{ padding: 0.5 }}>
                    <Typography fontWeight="bold" sx={{ fontSize: "0.875rem" }}>
                      Total
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ padding: 0.5 }}>
                    <Typography fontWeight="bold" sx={{ fontSize: "0.875rem" }}>
                      {`$${sum(groupItems).toFixed(2)}`}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ padding: 0.5 }}>
                    <Typography fontWeight="bold" sx={{ fontSize: "0.875rem" }}>
                      {`$${sumActual().toFixed(2)}`}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ padding: 0.5, borderBottom: "none" }} />
                  <TableCell sx={{ padding: 0.5, borderBottom: "none" }} />
                  <TableCell align="right" sx={{ padding: 0.5, borderBottom: "none", fontSize: "0.875rem", color: (sum(groupItems) - sumActual()) < 0 ? "error.main" : "success.main" }}>
                    Difference: ${(sum(groupItems) - sumActual()).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ padding: 0.5, borderBottom: "none" }} />
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </AccordionDetails>
      </Accordion>
    </ThemeProvider>
  );
};

export default React.memo(BudgetGroup);