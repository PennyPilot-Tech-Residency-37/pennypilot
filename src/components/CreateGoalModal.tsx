import React, { useState } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import "./Goals.css";

type FormGoalData = {
  name: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly";
  startDate: Date;
  dueDate: Date;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (goalData: FormGoalData) => void;
};

const CreateGoalModal: React.FC<Props> = ({ open, onClose, onCreate }) => {
  const [goalName, setGoalName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [dueDate, setDueDate] = useState("");
  const [formErrors, setFormErrors] = useState({
    name: false,
    amount: false,
    dueDate: false,
  });

  const handleSubmit = () => {
    const errors = {
      name: !goalName.trim(),
      amount: !amount,
      dueDate: !dueDate,
    };
    setFormErrors(errors);

    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) return;

    const newGoal: FormGoalData = {
      name: goalName.trim(),
      amount: parseFloat(amount),
      frequency,
      startDate: new Date(),
      dueDate: new Date(dueDate),
    };

    onCreate(newGoal);
    setGoalName("");
    setAmount("");
    setDueDate("");
    setFrequency("weekly");
    setFormErrors({ name: false, amount: false, dueDate: false });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="goal-modal-box">
        <h2 className="modal-title">🎯 Create a New Goal</h2>

        <TextField
          fullWidth
          label="Goal Title"
          value={goalName}
          onChange={(e) => setGoalName(e.target.value)}
          margin="normal"
          error={formErrors.name}
          helperText={formErrors.name ? "Goal title is required." : ""}
        />

        <TextField
          fullWidth
          label="Total Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          margin="normal"
          error={formErrors.amount}
          helperText={formErrors.amount ? "Amount is required." : ""}
        />

        <TextField
          fullWidth
          select
          label="Frequency"
          value={frequency}
          onChange={(e) =>
            setFrequency(e.target.value as "daily" | "weekly" | "monthly")
          }
          margin="normal"
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Due Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          margin="normal"
          error={formErrors.dueDate}
          helperText={formErrors.dueDate ? "Due date is required." : ""}
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          className="modal-submit-btn"
          fullWidth
        >
          Let’s Do This!
        </Button>
      </Box>
    </Modal>
  );
};

export default CreateGoalModal;
