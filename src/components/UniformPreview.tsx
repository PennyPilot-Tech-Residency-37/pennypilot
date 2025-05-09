import React from "react";
import "./Goals.css";
import Tooltip from "@mui/material/Tooltip";

type Props = {
  tooltip: string;
  imgSrc: string;
  altText: string;
  unlockAt: number;
  currentLevel: number;
};

const UniformPreview: React.FC<Props> = ({ tooltip, imgSrc, altText, unlockAt, currentLevel }) => {
  const isUnlocked = currentLevel >= unlockAt;

  return (
    <Tooltip title={tooltip}>
      <div className={`preview-icon ${isUnlocked ? "unlocked" : "locked"}`}>
        <img src={imgSrc} alt={altText} />
      </div>
    </Tooltip>
  );
};

export default UniformPreview;
