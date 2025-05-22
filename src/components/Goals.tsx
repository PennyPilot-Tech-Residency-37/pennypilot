import React, { useState, useEffect } from "react";
import GoalsPath from "./GoalsPath";
import GoalsSidebar from "./GoalsSideBar";
import CreateGoalModal from "./CreateGoalModal";
import "./Goals.css";
import { Button } from "@mui/material";

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
      return [];
    }
  });

  const [activeGoalId, setActiveGoalId] = useState<number | null>(() => {
    const storedId = localStorage.getItem("activeGoalId");
    return storedId ? Number(storedId) : null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add safe localStorage handling
  const safeSetLocalStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
      }
    }
  };

  useEffect(() => {
    safeSetLocalStorage("goals", goals);
  }, [goals]);

  useEffect(() => {
    if (activeGoalId !== null) {
      safeSetLocalStorage("activeGoalId", activeGoalId.toString());
    }
  }, [activeGoalId]);

  useEffect(() => {
    if (goals.length > 0 && !goals.find((g) => g.id === activeGoalId)) {
      setActiveGoalId(goals[0].id);
    }
  }, [goals, activeGoalId]);

  // Add backup functionality
  const backupGoals = () => {
    try {
      const backupData = {
        goals,
        activeGoalId,
        lastBackup: new Date().toISOString(),
      };
      safeSetLocalStorage("goalsBackup", backupData);
    } catch (err) {
    }
  };

  // Restore goals from backup
  const restoreGoals = () => {
    try {
      const stored = localStorage.getItem("goalsBackup");
      if (stored) {
        const backupData = JSON.parse(stored);
        setGoals(backupData.goals.map((goal: any) => ({
          ...goal,
          startDate: new Date(goal.startDate),
          dueDate: new Date(goal.dueDate),
        })));
        setActiveGoalId(backupData.activeGoalId);
      }
    } catch (err) {
    }
  };

  // Auto-backup every hour
  useEffect(() => {
    const backupInterval = setInterval(backupGoals, 3600000); // 1 hour
    return () => clearInterval(backupInterval);
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
  const handleEditGoal = (id: number, updatedName: string) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, name: updatedName } : goal))
    );
  };
  
  const handleDeleteGoal = (id: number) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  };
  

  const activeGoal = goals.find((goal) => goal.id === activeGoalId);

  return (
    <div className="goals-page-container">
<GoalsSidebar
  goals={goals}
  onOpenModal={() => setIsModalOpen(true)}
  setActiveGoalId={setActiveGoalId}
  onEditGoal={handleEditGoal}
  onDeleteGoal={handleDeleteGoal}
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
