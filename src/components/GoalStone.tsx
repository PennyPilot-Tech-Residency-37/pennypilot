import React from "react";
import "./Goals.css";
import PilotAvatar from "./PilotAvatar";

type GoalStoneProps = {
  position: "left" | "right" | "start";
  status: "completed" | "current" | "locked" | "start";
  showAvatar: boolean;
  onClick?: () => void;
};

const GoalStone: React.FC<GoalStoneProps> = ({
  position,
  status,
  showAvatar,
  onClick,
}) => {
  const isCurrent = status === "current";

  return (
<div className={`goal-stone-wrapper ${position}`}>
  <div className="goal-stone-container">
    {showAvatar && (
      <div className="peter-wrapper">
        <PilotAvatar sx={{ width: "300px" }} />
      </div>
    )}

    <img
      src={`/images/stone-${status}.png`}
      alt={`${status} stepping stone`}
      className={`goal-stone-img ${status}`}
    />

    {isCurrent && (
      <button className="complete-step-button" onClick={onClick}>
        ✅
      </button>
    )}
  </div>
</div>

  );
};

export default GoalStone;
