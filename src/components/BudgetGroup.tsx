import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    TextField,
    Grid,
    Box,
    IconButton,
  } from "@mui/material";
  import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
  } from "@dnd-kit/sortable";
  import { CSS } from "@dnd-kit/utilities";
  import { useState } from "react";
  
  const SortableItem = ({ item, index }: { item: any; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.name });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      marginBottom: 8,
    };
  
    return (
      <Grid
        container
        spacing={2}
        alignItems="center"
        ref={setNodeRef}
        style={style}
        {...attributes}
        className="budget-row"
      >
        <Grid item xs={1}>
          <IconButton {...listeners} sx={{ cursor: "grab" }}>
            <DragIndicatorIcon />
          </IconButton>
        </Grid>
        <Grid item xs={3}>
          <TextField fullWidth defaultValue={item.name} variant="outlined" />
        </Grid>
        <Grid item xs={2}>
          <TextField fullWidth type="number" defaultValue={item.assigned} variant="outlined" />
        </Grid>
        <Grid item xs={2}>
          <TextField fullWidth type="number" defaultValue={item.activity} variant="outlined" />
        </Grid>
        <Grid item xs={2}>
          <Typography fontWeight="bold">
            ${(item.assigned - item.activity).toFixed(2)}
          </Typography>
        </Grid>
      </Grid>
    );
  };
  
  const BudgetGroup = ({ title }: { title: string }) => {
    const [items, setItems] = useState([
      { name: "Rent", assigned: 500, activity: 100 },
      { name: "Utilities", assigned: 200, activity: 50 },
    ]);
  
    const sensors = useSensors(useSensor(PointerSensor));
  
    const handleDragEnd = (event: any) => {
      const { active, over } = event;
      if (active.id !== over?.id) {
        const oldIndex = items.findIndex((item) => item.name === active.id);
        const newIndex = items.findIndex((item) => item.name === over?.id);
        setItems(arrayMove(items, oldIndex, newIndex));
      }
    };
  
    return (
      <Accordion sx={{ borderBottom: "1px solid #e0e0e0", borderRadius: 0, boxShadow: "none" }}>
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
              <Typography fontWeight="bold">Assigned</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography fontWeight="bold">Activity</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography fontWeight="bold">Available</Typography>
            </Grid>
          </Grid>
  
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.name)} strategy={verticalListSortingStrategy}>
              {items.map((item, index) => (
                <SortableItem key={item.name} item={item} index={index} />
              ))}
            </SortableContext>
          </DndContext>
        </AccordionDetails>
      </Accordion>
    );
  };
  
  export default BudgetGroup;
  