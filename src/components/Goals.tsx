import React, { useState } from "react";
import GoalsPath from "./GoalsPath";
import GoalsSidebar from "./GoalsSideBar";
import CreateGoalModal from "./CreateGoalModal"; // Make sure this file exists
import "./Goals.css";

type Goal = {
  id: number;
  name: string;
  completed: boolean;
};

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateGoal = (goalName: string) => {
    const newGoal = {
      id: Date.now(),
      name: goalName,
      completed: false
    };
    setGoals([...goals, newGoal]);
  };

  return (
    <div className="goals-page-container">
      <GoalsSidebar
        goals={goals}
        onOpenModal={() => setIsModalOpen(true)}
      />
      <GoalsPath goals={goals} />
      <CreateGoalModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateGoal}
      />
    </div>
  );
};

export default GoalsPage;
