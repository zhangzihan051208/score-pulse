/** Heat weights for ranking zones and items. */
export const HEAT = {
  rating: 3,
  commentApproved: 2,
  commentLike: 1,
  newItem: 1,
} as const;

export function heatFromCounts(counts: {
  ratings?: number;
  comments?: number;
  likes?: number;
}) {
  return (
    (counts.ratings ?? 0) * HEAT.rating +
    (counts.comments ?? 0) * HEAT.commentApproved +
    (counts.likes ?? 0) * HEAT.commentLike
  );
}
