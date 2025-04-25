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
  Tooltip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteIcon from "@mui/icons-material/Delete";
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
import { useState } from "react";
import "./Budget.css";

interface BudgetItem {
  name: string;
  amount: string;
  spent?: string;
}

interface BudgetGroupProps {
  title: string;
  items: BudgetItem[];
}

const SortableItem = ({ item, index, onItemChange, onDelete }: { item: BudgetItem; index: number; onItemChange: (index: number, key: string, value: string) => void; onDelete: (index: number) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.name || index });

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
      spacing={2}
      alignItems="center"
      ref={setNodeRef}
      sx={{ width: '100%' }}
      style={style}
      {...attributes}
      className="budget-row custom-width"
    >
      <Grid item xs={1}>
        <IconButton {...listeners} sx={{ cursor: "grab" }}>
          <DragIndicatorIcon />
        </IconButton>
      </Grid>
      <Grid item xs={3}>
        <TextField
          fullWidth
          value={item.name}
          variant="outlined"
          onChange={(e) => onItemChange(index, "name", e.target.value)}
        />
      </Grid>
      <Grid item xs={2}>
        <TextField
          fullWidth
          type="number"
          value={item.amount}
          variant="outlined"
          onChange={(e) => onItemChange(index, "amount", e.target.value)}
        />
      </Grid>
      <Grid item xs={2}>
        <TextField
          fullWidth
          type="number"
          value={item.spent ?? ""}
          variant="outlined"
          onChange={(e) => onItemChange(index, "spent", e.target.value)}
        />
      </Grid>
      <Grid item xs={2}>
        <Typography fontWeight="bold">{`$${remaining.toFixed(2)}`}</Typography>
      </Grid>
      <Grid item xs={2}>
        <IconButton onClick={() => onDelete(index)}>
          <DeleteIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
};

const BudgetGroup = ({ title, items }: BudgetGroupProps) => {
  const [groupItems, setGroupItems] = useState(items);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = groupItems.findIndex((item, idx) => (item.name || idx) === active.id);
      const newIndex = groupItems.findIndex((item, idx) => (item.name || idx) === over?.id);
      setGroupItems(arrayMove(groupItems, oldIndex, newIndex));
    }
  };

  const handleItemChange = (index: number, key: string, value: string) => {
    if (key === "spent") {
      const updated = [...groupItems];
      updated[index] = { ...updated[index], [key]: value };
      setGroupItems(updated);
      return;
    }
  
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      const updated = [...groupItems];
      updated[index] = { ...updated[index], [key]: value };
      setGroupItems(updated);
    }
  };
  
  

  const handleDelete = (index: number) => {
    setGroupItems(groupItems.filter((_, i) => i !== index));
  };

  const handleAddLine = () => {
    setGroupItems([...groupItems, { name: "", amount: "", spent: "" }]);
  };

  return (
    <Accordion defaultExpanded sx={{ borderBottom: "1px solid #e0e0e0", borderRadius: 0, boxShadow: "none" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={1}></Grid>
          <Grid item xs={3}>
            <Typography fontWeight="bold">Line Item</Typography>
          </Grid>
          <Grid item xs={2}>
            <Tooltip title={<span>The amount you’ve planned to spend in this category.</span>} placement="top" componentsProps={{ tooltip: { sx: { whiteSpace: "normal", maxWidth: 200 } } }}>
              <Typography fontWeight="bold">Budgeted</Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={2}>
            <Tooltip title={<span>What you’ve spent so far — editable anytime.</span>} placement="top" componentsProps={{ tooltip: { sx: { whiteSpace: "normal", maxWidth: 180 } } }}>
              <Typography fontWeight="bold">Spent</Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={2}>
            <Tooltip title={<span>What’s still available to spend based on your budget.</span>} placement="top" componentsProps={{ tooltip: { sx: { whiteSpace: "normal", maxWidth: 180 } } }}>
              <Typography fontWeight="bold">Remaining</Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={2}></Grid>
        </Grid>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={groupItems.map((i, idx) => i.name || idx)} strategy={verticalListSortingStrategy}>
            {groupItems.map((item, index) => (
              <SortableItem key={item.name || index} item={item} index={index} onItemChange={handleItemChange} onDelete={handleDelete} />
            ))}
          </SortableContext>
        </DndContext>

        <Box mt={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleAddLine}
            sx={{ borderStyle: "dashed", textTransform: "none" }}
          >
            + Add a new line
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default BudgetGroup;
