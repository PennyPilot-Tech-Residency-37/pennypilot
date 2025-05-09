import React from "react";
import Tooltip from "@mui/material/Tooltip";

type Props = {
  tooltip: string;
  imgSrc: string;
  altText: string;
  goalCount: number;
  unlockAt: number;
};

const BadgePreview: React.FC<Props> = ({
  tooltip,
  imgSrc,
  altText,
  goalCount,
  unlockAt,
}) => {
  const isUnlocked = goalCount >= unlockAt;
  const badgeClass = isUnlocked
    ? "badge-placeholder"
    : "badge-placeholder locked";

  return (
    <Tooltip
      title={tooltip}
      arrow
      placement="top"
    >
      <img
        src={imgSrc}
        alt={altText}
        className={badgeClass}
      />
    </Tooltip>
  );
};

export default BadgePreview;
