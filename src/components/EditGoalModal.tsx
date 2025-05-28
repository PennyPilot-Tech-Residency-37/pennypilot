import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid
} from '@mui/material';

type GoalInput = {
  id: number;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  dueDate: Date;
  stepsCompleted: number[];
  completed: boolean;
};

interface EditGoalModalProps {
  open: boolean;
  onClose: () => void;
  goal: GoalInput | null;
  onSave: (updatedGoal: GoalInput) => void;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({ open, onClose, goal, onSave }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setAmount(goal.amount);
      setFrequency(goal.frequency);
      setStartDate(goal.startDate.toISOString().split('T')[0]);
      setDueDate(goal.dueDate.toISOString().split('T')[0]);
    }
  }, [goal]);

  const handleSave = () => {
    if (!goal) return;
    onSave({
      ...goal,
      name,
      amount,
      frequency,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Goal</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Goal Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Target Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              label="Frequency"
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')
              }
              fullWidth
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditGoalModal;
