import React, { useState } from "react";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type Goal = {
  id: number;
  name: string;
  completed: boolean;
};

type Props = {
  goals: Goal[];
  setActiveGoalId: (id: number) => void;
  onEditGoal: (id: number, newName: string) => void;
  onDeleteGoal: (id: number) => void;
};

const GoalList: React.FC<Props> = ({
  goals,
  setActiveGoalId,
  onEditGoal,
  onDeleteGoal,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [selectedGoalName, setSelectedGoalName] = useState<string>("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editGoalName, setEditGoalName] = useState("");
  const [editGoalId, setEditGoalId] = useState<number | null>(null);

  const handleDeleteClick = (id: number, name: string) => {
    setSelectedGoalId(id);
    setSelectedGoalName(name);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedGoalId !== null) {
      onDeleteGoal(selectedGoalId);
      setDeleteConfirmOpen(false);
      setSelectedGoalId(null);
    }
  };

  const handleEditClick = (id: number, name: string) => {
    setEditGoalId(id);
    setEditGoalName(name);
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editGoalId !== null && editGoalName.trim() !== "") {
      onEditGoal(editGoalId, editGoalName.trim());
      setEditModalOpen(false);
      setEditGoalId(null);
    }
  };

  return (
    <>
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="sidebar-goal-item-link"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#1a1a2e",
            borderRadius: "8px",
            color: "white",
          }}
        >
          <span
            onClick={() => setActiveGoalId(goal.id)}
            style={{ cursor: "pointer", flexGrow: 1 }}
          >
            {goal.name}
          </span>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => handleEditClick(goal.id, goal.name)}
                sx={{ color: "#90caf9" }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(goal.id, goal.name)}
                sx={{ color: "#f44336" }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      ))}

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedGoalName}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle>Edit Goal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Goal Name"
            value={editGoalName}
            onChange={(e) => setEditGoalName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GoalList;
