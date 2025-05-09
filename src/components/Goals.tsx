import React, { useState, useEffect } from "react";
import GoalsPath from "./GoalsPath";
import GoalsSidebar from "./GoalsSideBar";
import CreateGoalModal from "./CreateGoalModal";
import "./Goals.css";

type GoalInput = {
  id: number;
  name: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly";
  startDate: Date;
  dueDate: Date;
  stepsCompleted: number[];
  completed: boolean;
};

type FormGoalData = {
  name: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly";
  startDate: Date;
  dueDate: Date;
};

const GoalsPage = () => {
  const [goals, setGoals] = useState<GoalInput[]>(() => {
    // ✅ Load and rehydrate goals from localStorage
    const stored = localStorage.getItem("goals");
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      return parsed.map((goal: any) => ({
        ...goal,
        startDate: new Date(goal.startDate),
        dueDate: new Date(goal.dueDate),
      }));
    } catch (e) {
      console.error("Failed to parse stored goals:", e);
      return [];
    }
  });

  const [activeGoalId, setActiveGoalId] = useState<number | null>(() => {
    const storedId = localStorage.getItem("activeGoalId");
    return storedId ? Number(storedId) : null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Persist to localStorage
  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (activeGoalId !== null) {
      localStorage.setItem("activeGoalId", activeGoalId.toString());
    }
  }, [activeGoalId]);

  // ✅ Set a fallback goal if localStorage is empty or invalid
  useEffect(() => {
    if (goals.length > 0 && !goals.find((g) => g.id === activeGoalId)) {
      setActiveGoalId(goals[0].id);
    }
  }, [goals, activeGoalId]);

  const handleCreateGoal = (goalData: FormGoalData) => {
    const newGoal: GoalInput = {
      ...goalData,
      id: Date.now(),
      stepsCompleted: [],
      completed: false,
    };
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    setActiveGoalId(newGoal.id);
  };

  const activeGoal = goals.find((goal) => goal.id === activeGoalId);

  return (
    <div className="goals-page-container">
      <GoalsSidebar
        goals={goals}
        onOpenModal={() => setIsModalOpen(true)}
        setActiveGoalId={setActiveGoalId}
      />

      {activeGoal && (
        <GoalsPath
          goalInput={activeGoal}
          onUpdateGoal={(updatedGoal) => {
            const updatedGoals = goals.map((g: GoalInput) =>
              g.id === updatedGoal.id ? updatedGoal : g
            );
            setGoals(updatedGoals);
          }}
        />
      )}

      <CreateGoalModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateGoal}
      />
    </div>
  );
};

export default GoalsPage;
