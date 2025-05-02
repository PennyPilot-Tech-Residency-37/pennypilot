import React from "react";
import "./Goals.css";
import GoalStone from "./GoalStone";

type Props = {
  goals: { id: number; name: string; completed: boolean }[];
};

const GoalsPath: React.FC<Props> = ({ goals }) => {
  const currentGoalIndex = goals.findIndex(goal => !goal.completed);
  const currentGoal = goals[currentGoalIndex] || goals[goals.length - 1];

  return (
    <div className="avatar-path-container">
      <div className="goal-title-banner">
        {currentGoal?.name}
      </div>

      {goals.map((goal, index) => {
        const position = index % 2 === 0 ? "left" : "right";
        const status = goal.completed
          ? "completed"
          : index === currentGoalIndex
          ? "current"
          : "locked";

        return (
          <GoalStone
            key={goal.id}
            position={position}
            status={status}
            showAvatar={index === currentGoalIndex}
          />
        );
      })}
    </div>
  );
};

export default GoalsPath;
