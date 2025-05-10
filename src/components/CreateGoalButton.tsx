import React from "react";
import { Button } from "@mui/material";

type Props = {
  onOpenModal: () => void;
};

const CreateGoalButton: React.FC<Props> = ({ onOpenModal }) => {
  return (
    <Button onClick={onOpenModal} variant="contained" color="primary" fullWidth>
      + Create Goal
    </Button>
  );
};

export default CreateGoalButton;
