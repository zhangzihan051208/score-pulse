import type { ScoreMap } from "./types";

export type TakeRow = {
  userId: string;
  author: string;
  scores: ScoreMap;
  updatedAt: string;
  body?: string;
  commentId?: string;
  isYou: boolean;
};

type RatingRow = {
  userId: string;
  author: string;
  scores: ScoreMap;
  updatedAt: string;
  isYou: boolean;
};

type CommentRow = {
  id: string;
  userId: string;
  author: string;
  body: string;
  createdAt: string;
  scores?: ScoreMap;
  isYou: boolean;
};

/** One card per user: scores always from rating row when present, else comment scores. */
export function mergeTakes(
  ratings: RatingRow[],
  comments: CommentRow[],
): TakeRow[] {
  const byUser = new Map<string, TakeRow>();

  for (const r of ratings) {
    byUser.set(r.userId, {
      userId: r.userId,
      author: r.author,
      scores: r.scores,
      updatedAt: r.updatedAt,
      isYou: r.isYou,
    });
  }

  const commentsByUser = new Map<string, CommentRow[]>();
  for (const c of comments) {
    const list = commentsByUser.get(c.userId) ?? [];
    list.push(c);
    commentsByUser.set(c.userId, list);
  }

  for (const [userId, list] of commentsByUser) {
    const latest = [...list].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )[0];
    const existing = byUser.get(userId);
    if (existing) {
      existing.body = latest.body;
      existing.commentId = latest.id;
      if (+new Date(latest.createdAt) > +new Date(existing.updatedAt)) {
        existing.updatedAt = latest.createdAt;
      }
    } else if (latest.scores) {
      byUser.set(userId, {
        userId,
        author: latest.author,
        scores: latest.scores,
        updatedAt: latest.createdAt,
        body: latest.body,
        commentId: latest.id,
        isYou: latest.isYou,
      });
    }
  }

  return [...byUser.values()].sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
  );
}

export function scoresForAggregation(takes: TakeRow[]): ScoreMap[] {
  return takes.map((t) => t.scores);
}
