import React, { useState } from "react";
import { Modal, Box, TextField, Button } from "@mui/material";
import "./Goals.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (goalName: string) => void;
};

const CreateGoalModal: React.FC<Props> = ({ open, onClose, onCreate }) => {
  const [goalName, setGoalName] = useState("");

  const handleSubmit = () => {
    if (goalName.trim()) {
      onCreate(goalName.trim());
      setGoalName("");
      onClose();
    }
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
          className="modal-input"
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          className="modal-submit-btn"
        >
          Let’s Do This!
        </Button>
      </Box>
    </Modal>
  );
};

export default CreateGoalModal;
