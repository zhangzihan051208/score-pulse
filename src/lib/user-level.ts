export type UserLevelInfo = {
  level: number;
  titleKey: "rookie" | "regular" | "analyst" | "veteran" | "legend";
  commentCount: number;
  likesReceived: number;
  points: number;
  nextLevelAt: number | null;
};

/** Level from published comments + likes received on those comments. */
export function computeUserLevel(
  commentCount: number,
  likesReceived: number,
): UserLevelInfo {
  const points = commentCount * 2 + likesReceived;
  let level = 1;
  if (points >= 120) level = 5;
  else if (points >= 60) level = 4;
  else if (points >= 30) level = 3;
  else if (points >= 10) level = 2;

  const thresholds = [0, 10, 30, 60, 120, 999999];
  const nextLevelAt =
    level >= 5 ? null : thresholds[level] ?? null;

  const titleKey: UserLevelInfo["titleKey"] =
    level >= 5
      ? "legend"
      : level >= 4
        ? "veteran"
        : level >= 3
          ? "analyst"
          : level >= 2
            ? "regular"
            : "rookie";

  return {
    level,
    titleKey,
    commentCount,
    likesReceived,
    points,
    nextLevelAt,
  };
}
