import React from "react";
import "./Goals.css";
import Tooltip from '@mui/material/Tooltip';
import { Button } from "@mui/material";

type Props = {
  goals: { id: number; name: string; completed: boolean }[];
  onOpenModal: () => void;
};

const GoalsSidebar: React.FC<Props> = ({ goals, onOpenModal }) => {
  return (
    <div className="goal-sidebar">
      <h2>My Goals</h2>

      {goals.length === 0 ? (
        <p className="empty-state">No goals yet. Get started by setting a goal!</p>
      ) : null}

      <Button onClick={onOpenModal}>+ Create Goal</Button>

      {goals.map(goal => (
        <button
          key={goal.id}
          className="sidebar-goal-item-link"
          onClick={() => console.log(`Clicked goal: ${goal.name}`)}
        >
          {goal.name}
        </button>
      ))}

      <hr className="divider" />

      <h3>Badges</h3>
      <Tooltip title="Hint: create your first goal to earn a badge" arrow placement="top">
        <img
          src="/images/shield_badge_outline.png"
          alt="Badge Placeholder"
          className="badge-placeholder"
        />
      </Tooltip>
    </div>
  );
};

export default GoalsSidebar;
