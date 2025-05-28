import React, { useEffect, useState } from "react";
import "./Goals.css";
import GoalStone from "./GoalStone";
import {
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  addDays,
  addWeeks,
  addMonths,
} from "date-fns";

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

type SteppingStone = {
  id: number;
  amount: number;
  completed: boolean;
  dueDate: Date;
};

type Props = {
  goalInput: GoalInput;
  onUpdateGoal: (goal: GoalInput) => void;
};


const GoalsPath: React.FC<Props> = ({ goalInput, onUpdateGoal }) => {
  const [steppingStones, setSteppingStones] = useState<SteppingStone[]>([]);

  useEffect(() => {
    const { amount, frequency, startDate, dueDate, stepsCompleted } = goalInput;
    let stepCount: number;
    let incrementFn: (date: Date, i: number) => Date;
  
    switch (frequency) {
      case "daily":
        stepCount = differenceInDays(dueDate, startDate);
        incrementFn = (date, i) => addDays(date, i);
        break;
      case "weekly":
        stepCount = differenceInWeeks(dueDate, startDate);
        incrementFn = (date, i) => addWeeks(date, i);
        break;
      case "monthly":
        stepCount = differenceInMonths(dueDate, startDate);
        incrementFn = (date, i) => addMonths(date, i);
        break;
      default:
        stepCount = 1;
        incrementFn = (date, _) => date;
    }
  
    if (stepCount <= 0) stepCount = 1;
    const stepAmount = amount / stepCount;
    const totalSaved = stepsCompleted.reduce((sum, val) => sum + val, 0);
    const savedSteps = Math.floor(totalSaved / stepAmount);
  
    const steps: SteppingStone[] = Array.from({ length: stepCount }, (_, i) => ({
      id: i,
      amount: parseFloat(stepAmount.toFixed(2)),
      completed: i < savedSteps,
      dueDate: incrementFn(startDate, i),
    }));
  
    setSteppingStones(steps);
  }, [goalInput]);
  

  const currentIndex = steppingStones.findIndex((s) => !s.completed);

  const handleCompleteStep = (index: number) => {
    const updatedSteps = steppingStones.map((step, i) =>
      i === index ? { ...step, completed: true } : step
    );
  
    setSteppingStones(updatedSteps);
  
    const updatedGoal: GoalInput = {
      ...goalInput,
      stepsCompleted: [...goalInput.stepsCompleted, steppingStones[index].amount],
    };
  
    const allCompleted = updatedSteps.every((step) => step.completed);
    updatedGoal.completed = allCompleted;
  
    onUpdateGoal(updatedGoal);
  };
  
  return (
    <>
      <div className="goal-title-banner">{goalInput.name}</div>
  
      <div className="avatar-path-container">
        {steppingStones.map((stone, index) => {
          const position = index % 2 === 0 ? "left" : "right";
          const status = stone.completed
            ? "completed"
            : index === currentIndex
            ? "current"
            : "locked";
  
          return (
            <GoalStone
              key={stone.id}
              position={position}
              status={status}
              showAvatar={index === currentIndex}
              onClick={() => handleCompleteStep(index)}
            />
          );
        })}
      </div>
    </>
  );
};

export default GoalsPath;
