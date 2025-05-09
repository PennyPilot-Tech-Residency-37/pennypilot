import React from "react";

type Goal = {
  id: number;
  name: string;
  completed: boolean;
};

type Props = {
  goals: Goal[];
  setActiveGoalId: (id: number) => void;
};

const GoalList: React.FC<Props> = ({ goals, setActiveGoalId }) => {
  return (
    <>
      {goals.map(goal => (
        <button
          key={goal.id}
          className="sidebar-goal-item-link"
          onClick={() => setActiveGoalId(goal.id)}
        >
          {goal.name}
        </button>
      ))}
    </>
  );
};

export default GoalList;
