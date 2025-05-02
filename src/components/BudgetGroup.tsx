import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Grid,
  Box,
  IconButton,
  Button,
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
import { useState, useEffect } from "react";
import "./Budget.css";

interface BudgetItem {
  name: string;
  amount: string;
  spent?: string;
}

interface BudgetGroupProps {
  title: string;
  items: BudgetItem[];
  onItemsChange?: (items: BudgetItem[]) => void;
}

// Custom theme
const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
  },
});

const SortableItem = ({
  item,
  index,
  onItemChange,
  onDelete,
}: {
  item: BudgetItem;
  index: number;
  onItemChange: (index: number, key: string, value: string) => void;
  onDelete: (index: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.name || index,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: 8,
  };

  const assigned = parseFloat(item.amount) || 0;
  const activity = parseFloat(item.spent || "0");
  const remaining = assigned - activity;

  return (
    <Grid
      container
      spacing={3}
      alignItems="center"
      ref={setNodeRef}
      sx={{ width: "100%" }}
      style={style}
      {...attributes}
      className="budget-row custom-width"
    >
      <Grid item xs={1}>
        <IconButton
          {...listeners}
          sx={{ cursor: "grab", "&:hover": { color: "primary.main" } }}
          aria-label="Drag to reorder"
        >
          <DragIndicatorIcon fontSize="large" />
        </IconButton>
      </Grid>
      <Grid item xs={3}>
        <TextField
          fullWidth
          value={item.name}
          variant="outlined"
          onChange={(e) => onItemChange(index, "name", e.target.value)}
          aria-label="Line item name"
        />
      </Grid>
      <Grid item xs={2}>
        <TextField
          fullWidth
          type="number"
          value={item.amount}
          variant="outlined"
          onChange={(e) => onItemChange(index, "amount", e.target.value)}
          aria-label="Budgeted amount"
        />
      </Grid>
      <Grid item xs={2}>
        <TextField
          fullWidth
          type="number"
          value={item.spent ?? ""}
          variant="outlined"
          onChange={(e) => onItemChange(index, "spent", e.target.value)}
          aria-label="Spent amount"
        />
      </Grid>
      <Grid item xs={2}>
        <Typography fontWeight="bold">{`$${remaining.toFixed(2)}`}</Typography>
      </Grid>
      <Grid item xs={2}>
        <IconButton onClick={() => onDelete(index)} aria-label="Delete line item">
          <DeleteIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
};

const BudgetGroup = ({ title, items, onItemsChange }: BudgetGroupProps) => {
  const [groupItems, setGroupItems] = useState<BudgetItem[]>(items);
  const sensors = useSensors(useSensor(PointerSensor));

  // Update local state when items prop changes
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

  const handleItemChange = (index: number, key: string, value: string) => {
    const updated = [...groupItems];
    updated[index] = { ...updated[index], [key]: value };
    setGroupItems(updated);
    onItemsChange?.(updated);
  };

  const handleDelete = (index: number) => {
    const updated = groupItems.filter((_, i) => i !== index);
    setGroupItems(updated);
    onItemsChange?.(updated);
  };

  const handleAddLine = () => {
    const updated = [...groupItems, { name: "", amount: "", spent: "" }];
    setGroupItems(updated);
    onItemsChange?.(updated);
  };

  const sum = (arr: { amount: string }[]) =>
    arr.reduce((acc, val) => acc + (parseFloat(val.amount) || 0), 0);

  return (
    <ThemeProvider theme={theme}>
      <Accordion
        defaultExpanded
        sx={{ 
          borderBottom: "1px solid #e0e0e0", 
          borderRadius: 2, 
          boxShadow: "none",
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '16px 0',
          }
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            borderRadius: 2,
            '&.Mui-expanded': {
              minHeight: 48,
            }
          }}
        >
          <Typography variant="h6">{title}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Grid container spacing={3} sx={{ mb: 2, backgroundColor: "#f5f5f5", p: 1, borderRadius: 2 }}>
            <Grid item xs={1}></Grid>
            <Grid item xs={3}>
              <Typography fontWeight="bold" color="primary">
                Line Item
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Tooltip
                title={<span>The amount you've planned to spend in this category.</span>}
                componentsProps={{ tooltip: { sx: { whiteSpace: "normal", maxWidth: 200 } } }}
              >
                <Typography fontWeight="bold" color="primary">
                  Budgeted
                </Typography>
              </Tooltip>
            </Grid>
            <Grid item xs={2}>
              <Tooltip
                title={<span>What you've spent so far — editable anytime.</span>}
                componentsProps={{ tooltip: { sx: { whiteSpace: "normal", maxWidth: 180 } } }}
              >
                <Typography fontWeight="bold" color="primary">
                  Spent
                </Typography>
              </Tooltip>
            </Grid>
            <Grid item xs={2}>
              <Tooltip
                title={<span>What's still available to spend based on your budget.</span>}
                componentsProps={{ tooltip: { sx: { whiteSpace: "normal", maxWidth: 180 } } }}
              >
                <Typography fontWeight="bold" color="primary">
                  Remaining
                </Typography>
              </Tooltip>
            </Grid>
            <Grid item xs={2}></Grid>
          </Grid>

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
                  onItemChange={handleItemChange}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Box mt={3}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddLine}
              sx={{ textTransform: "none" }}
              aria-label="Add a new line"
            >
              Add a new line
            </Button>
          </Box>

          {/* Totals Row */}
          <Box mt={2} sx={{ borderTop: "1px solid #e0e0e0", pt: 2, borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={1}></Grid>
              <Grid item xs={3}>
                <Typography fontWeight="bold">Total</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography fontWeight="bold">
                  ${sum(groupItems.map((i) => ({ amount: i.amount }))).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography fontWeight="bold">
                  ${sum(groupItems.map((i) => ({ amount: i.spent || "0" }))).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography fontWeight="bold">
                  $
                  {(
                    sum(groupItems.map((i) => ({ amount: i.amount }))) -
                    sum(groupItems.map((i) => ({ amount: i.spent || "0" })))
                  ).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={2}></Grid>
            </Grid>
          </Box>
        </AccordionDetails>
      </Accordion>
    </ThemeProvider>
  );
};

export default React.memo(BudgetGroup);