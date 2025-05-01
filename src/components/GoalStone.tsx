import React from "react";
import "./Goals.css";
// import PilotAvatar from "./PilotAvatar";

type GoalStoneProps = {
  position: "left" | "right";
  status: "completed" | "current" | "locked";
  showAvatar: boolean;
};

const GoalStone: React.FC<GoalStoneProps> = ({ position, status, showAvatar }) => {
  return (
    <div className={`goal-stone-wrapper ${position}`}>
      {/* {showAvatar && (
        <PilotAvatar message=""/>
      )} */}

      <div className={`goal-stone ${status}`}>
      </div>
    </div>
  );
};

export default GoalStone;
