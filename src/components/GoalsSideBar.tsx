import React from "react";
import "./Goals.css";
import GoalList from "./GoalList";
import CreateGoalButton from "./CreateGoalButton";
import BadgePreview from "./BadgePreview";
import LevelProgress from "./LevelProgress";
import UniformPreview from "./UniformPreview";

type Props = {
  goals: { id: number; name: string; completed: boolean }[];
  onOpenModal: () => void;
  setActiveGoalId: (id: number) => void;
};

const badgeData = [
  {
    tooltip: "Earned for creating your 1st goal",
    imgSrc: "/images/first flight badge.png",
    altText: "First Flight",
    unlockAt: 1,
  },
  {
    tooltip: "Earned for creating your 5th goal",
    imgSrc: "/images/planning cadet badge.png",
    altText: "Planning Cadet",
    unlockAt: 5,
  },
  {
    tooltip: "Earned for creating your 10th goal",
    imgSrc: "/images/goal getter badge.png",
    altText: "Goal Getter",
    unlockAt: 10,
  },
  {
    tooltip: "Earned for creating your 15th goal",
    imgSrc: "/images/mission strategist badge.png",
    altText: "Mission Strategist",
    unlockAt: 15,
  },
  {
    tooltip: "Earned for creating your 20th goal",
    imgSrc: "/images/flight commander badge.png",
    altText: "Flight Commander",
    unlockAt: 20,
  },
  {
    tooltip: "Earned for creating your 25th goal",
    imgSrc: "/images/elite pathfinder badge.png",
    altText: "Elite Pathfinder",
    unlockAt: 25,
  },
];
const uniformData = [
  {
    tooltip: "Cadet Pilot (Level 1)",
    imgSrc: "/images/cadet pilot uniform icon.png",
    altText: "Basic Uniform",
    unlockAt: 1,
  },
  {
    tooltip: "First Officer (Level 4)",
    imgSrc: "/images/first officer uniform icon.png",
    altText: "Intermediate Uniform",
    unlockAt: 4,
  },
  {
    tooltip: "Second Officer (Level 7)",
    imgSrc: "/images/second officer uniform icon.png",
    altText: "Advanced Uniform",
    unlockAt: 7,
  },
  {
    tooltip: "Captain (Level 10)",
    imgSrc: "/images/captain uniform icon.png",
    altText: "Elite Uniform",
    unlockAt: 10,
  },
  {
    tooltip: "Elite Pilot (Level 15)",
    imgSrc: "/images/elite pilot uniform icon.png",
    altText: "Elite Uniform",
    unlockAt: 15,
  },
];



const GoalsSidebar: React.FC<Props> = ({ goals, onOpenModal, setActiveGoalId }) => {
  const completedGoals = goals.filter(goal => goal.completed).length;
  const xp = goals.length * 10 + completedGoals * 10;

  return (
    <div className="goal-sidebar">
      <h2>My Goals</h2>

      {goals.length === 0 && (
        <p className="empty-state">No goals yet. Get started by setting a goal!</p>
      )}

      <CreateGoalButton onOpenModal={onOpenModal} />
      <GoalList goals={goals} setActiveGoalId={setActiveGoalId}/>

      <hr className="divider" />

      <LevelProgress xp={xp} />

      <h3>Badges</h3>
      <div className="badge-grid">
  {badgeData.map((badge) => (
    <BadgePreview
      key={badge.altText}
      tooltip={badge.tooltip}
      imgSrc={badge.imgSrc}
      altText={badge.altText}
      unlockAt={badge.unlockAt}
      goalCount={goals.length}
    />
  ))}
</div>
<h3>Uniforms</h3>
<div className="badge-grid">
  {uniformData.map((uniform) => (
    <UniformPreview
      key={uniform.altText}
      tooltip={uniform.tooltip}
      imgSrc={uniform.imgSrc}
      altText={uniform.altText}
      unlockAt={uniform.unlockAt}
      currentLevel={Math.floor(xp / 100)}
    />
  ))}
</div>
    </div>
  );
};

export default GoalsSidebar;
