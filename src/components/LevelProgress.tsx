import React from "react";
import LinearProgress from "@mui/material/LinearProgress";
import "./LevelProgress.css";

type Props = {
  xp: number;
};

function getLevelInfo(xp: number) {
  let level = 1;
  let totalXP = xp;
  let requiredXP = 100;

  while (totalXP >= requiredXP) {
    totalXP -= requiredXP;
    level++;
    requiredXP = 100 + level * 20;
  }

  return {
    level,
    xpIntoLevel: totalXP,
    xpForNext: requiredXP,
    percent: (totalXP / requiredXP) * 100,
  };
}

const LevelProgress: React.FC<Props> = ({ xp }) => {
  const { level, xpIntoLevel, xpForNext, percent } = getLevelInfo(xp);

  return (
    <div className="level-progress">
      <div className="level-header">
        <span>Level {level}</span>
        <span>{xpIntoLevel} / {xpForNext} XP</span>
      </div>
      <LinearProgress variant="determinate" value={percent} />
    </div>
  );
};

export default LevelProgress;
