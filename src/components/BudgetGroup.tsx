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
  Box,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
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
  spacing: 0,
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
  amount: string; // Budgeted amount
  activity: string; // Activity (now editable)
}

interface BudgetGroupProps {
  title: "Income" | "Expenses" | "Savings";
  items: BudgetItem[];
  onItemsChange?: (items: BudgetItem[]) => void;
  transactions: any[];
  expanded: boolean;
  onToggle: () => void;
}

const SortableItem = ({
  item,
  index,
  title,
  onItemChange,
  transactions,
}: {
  item: BudgetItem;
  index: number;
  title: "Income" | "Expenses" | "Savings";
  onItemChange: (index: number, key: string, value: string) => void;
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

  const actual = parseFloat(item.activity) || 0;
  const budgeted = parseFloat(item.amount) || 0;
  const available = budgeted + actual;
  const progress = budgeted > 0 ? Math.min((Math.abs(actual) / budgeted) * 100, 100) : 0;

  return (
    <TableRow ref={setNodeRef} style={style} sx={{ "&:hover": { bgcolor: "action.hover" }, height: "18px" }}>
      <TableCell sx={{ width: 24, padding: "0", borderBottom: "none" }}>
        <IconButton
          {...listeners}
          sx={{ cursor: "grab", "&:hover": { color: "primary.main" }, padding: "2px" }}
          aria-label="Drag to reorder"
        >
          <DragIndicatorIcon sx={{ fontSize: "12px" }} />
        </IconButton>
      </TableCell>
      <TableCell colSpan={4} sx={{ padding: 0, borderBottom: "none" }}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "18px" }}>
          {/* Main Row: 14px (total height - 4px progress bar) */}
          <Box sx={{ display: "flex", alignItems: "center", padding: "0 4px", height: "14px" }}>
            <TableCell sx={{ width: "35%", padding: "0", borderBottom: "none" }}>
              <TextField
                fullWidth
                value={item.name}
                variant="standard"
                onChange={(e) => onItemChange(index, "name", e.target.value)}
                size="small"
                inputProps={{ style: { fontSize: "0.6875rem", padding: "0", lineHeight: "14px" } }}
                sx={{ "& .MuiInput-root": { padding: 0, height: "14px" } }}
                aria-label={`${title} name`}
              />
            </TableCell>
            <TableCell align="right" sx={{ width: "20%", padding: "0", borderBottom: "none" }}>
              <TextField
                fullWidth
                type="number"
                value={item.amount}
                variant="standard"
                onChange={(e) => onItemChange(index, "amount", e.target.value)}
                size="small"
                inputProps={{ style: { fontSize: "0.6875rem", textAlign: "right", padding: "0", lineHeight: "14px" } }}
                sx={{ "& .MuiInput-root": { padding: 0, height: "14px" } }}
                aria-label={`Budgeted amount`}
              />
            </TableCell>
            <TableCell align="right" sx={{ width: "20%", padding: "0", borderBottom: "none" }}>
              <TextField
                fullWidth
                type="number"
                value={item.activity}
                variant="standard"
                onChange={(e) => onItemChange(index, "activity", e.target.value)}
                size="small"
                inputProps={{ style: { fontSize: "0.6875rem", textAlign: "right", padding: "0", lineHeight: "14px" } }}
                sx={{ "& .MuiInput-root": { padding: 0, height: "14px" } }}
                aria-label={`Activity amount`}
              />
            </TableCell>
            <TableCell align="right" sx={{ width: "25%", padding: "0", borderBottom: "none" }}>
              <Typography
                sx={{
                  color: available < 0 ? "error.main" : available > 0 ? "success.main" : "text.primary",
                  fontWeight: 500,
                  fontSize: "0.625rem",
                  lineHeight: "14px",
                }}
              >
                {`$${available.toFixed(2)}`}
              </Typography>
            </TableCell>
          </Box>
          {/* Progress Bar: 4px */}
          <Box sx={{ padding: "0 4px", height: "4px", bgcolor: "#f5f5f5" }}>
            <Box
              sx={{
                width: `${progress}%`,
                height: "100%",
                bgcolor: progress > 100 ? "error.main" : "primary.main",
                borderRadius: "2px",
                transition: "width 0.3s ease-in-out",
              }}
            />
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
};

const BudgetGroup = ({ title, items, onItemsChange, transactions, expanded, onToggle }: BudgetGroupProps) => {
  const [groupItems, setGroupItems] = useState<BudgetItem[]>(
    items.map((item) => ({
      ...item,
      activity: item.activity || "0",
    }))
  );
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setGroupItems(
      items.map((item) => ({
        ...item,
        activity: item.activity || "0",
      }))
    );
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

    try {
      await axios.post("/api/notion/sync", {
        user_id: "current_user_id",
        page_type: "budget",
        group: title.toLowerCase(),
        data: updated.map((item) => ({
          name: item.name,
          amount: parseFloat(item.amount) || 0,
          activity: parseFloat(item.activity) || 0,
          available: (parseFloat(item.amount) || 0) + (parseFloat(item.activity) || 0),
        })),
      });
    } catch (err) {
      console.error("Failed to sync to Notion:", err);
    }
  };

  const handleAddLine = () => {
    const updated = [...groupItems, { name: "", amount: "", activity: "0" }];
    setGroupItems(updated);
    onItemsChange?.(updated);
  };

  const sumBudgeted = () =>
    groupItems.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0);
  const sumActual = () =>
    groupItems.reduce((acc, item) => acc + (parseFloat(item.activity) || 0), 0);
  const sumAvailable = () => sumBudgeted() + sumActual();

  const headers = ["", "Category", "Budgeted", "Activity", "Available"];

  return (
    <ThemeProvider theme={theme}>
      <Accordion
        expanded={expanded}
        onChange={onToggle}
        sx={{
          borderBottom: "1px solid #e0e0e0",
          borderRadius: 0,
          boxShadow: "none",
          "&:before": { display: "none" },
          "&.Mui-expanded": { margin: 0 },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ fontSize: "18px" }} />}
          sx={{
            bgcolor: "#f5f5f5",
            minHeight: "18px !important",
            padding: "0 8px",
            margin: 0,
            "&.Mui-expanded": { minHeight: "18px !important" },
            "& .MuiAccordionSummary-content": { margin: 0 }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "text.primary", fontSize: "0.875rem", lineHeight: "26px" }}>
            {title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table aria-label={`${title} budget table`}>
              <TableHead>
                <TableRow sx={{ height: "16px" }}>
                  {headers.map((header) => (
                    <TableCell
                      key={header}
                      align={header === "" ? "center" : header === "Category" ? "left" : "right"}
                      sx={{ fontWeight: "bold", color: "text.secondary", fontSize: "0.625rem", padding: "0 4px", lineHeight: "16px" }}
                    >
                      {header}
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
                        transactions={transactions}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ borderTop: "1px solid #e0e0e0", p: "0 4px" }}>
            <Table>
              <TableBody>
                <TableRow sx={{ height: "18px" }}>
                  <TableCell sx={{ width: 24, padding: "0" }} />
                  <TableCell sx={{ padding: "0 4px" }}>
                    <Typography fontWeight="bold" sx={{ fontSize: "0.6875rem", lineHeight: "18px" }}>
                      Total {title}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ padding: "0 4px" }}>
                    <Typography fontWeight="bold" sx={{ fontSize: "0.6875rem", lineHeight: "18px" }}>
                      {`$${sumBudgeted().toFixed(2)}`}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ padding: "0 4px" }}>
                    <Typography fontWeight="bold" sx={{ fontSize: "0.6875rem", lineHeight: "18px" }}>
                      {`$${sumActual().toFixed(2)}`}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ padding: "0 4px" }}>
                    <Typography
                      fontWeight="bold"
                      sx={{
                        fontSize: "0.625rem",
                        color: sumAvailable() < 0 ? "error.main" : "success.main",
                        lineHeight: "18px",
                      }}
                    >
                      {`$${sumAvailable().toFixed(2)}`}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Box p="2px 4px">
            <Button
              fullWidth
              variant="text"
              color="primary"
              startIcon={<AddIcon sx={{ fontSize: "12px" }} />}
              onClick={handleAddLine}
              sx={{ textTransform: "none", justifyContent: "flex-start", fontSize: "0.6875rem", padding: "0 4px", height: "18px", lineHeight: "18px" }}
              aria-label={`Add a new ${title.toLowerCase()} line`}
            >
              Add a new line
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </ThemeProvider>
  );
};

export default BudgetGroup;