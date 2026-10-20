import type { CommentReply, CommunityTake } from "@/lib/community-take-types";

export type { CommentReply };

type DbComment = {
  id: string;
  user_id: string;
  author: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  hidden: boolean;
};

export function enrichTakesWithSocial(
  takes: CommunityTake[],
  comments: DbComment[],
  likeCountById: Map<string, number>,
  likedByYou: Set<string>,
  viewerId?: string,
): CommunityTake[] {
  const topByUser = new Map<string, DbComment>();
  const repliesByParent = new Map<string, DbComment[]>();

  for (const c of comments) {
    if (c.parent_id) {
      const list = repliesByParent.get(c.parent_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_id, list);
    } else {
      topByUser.set(c.user_id, c);
    }
  }

  return takes
    .map((t) => {
      const top = topByUser.get(t.userId);
      const commentId = top?.id;
      const hidden = Boolean(top?.hidden && !t.isYou);
      const replies: CommentReply[] = commentId
        ? (repliesByParent.get(commentId) ?? [])
            .filter((r) => !r.hidden || r.user_id === viewerId)
            .sort(
              (a, b) =>
                +new Date(a.created_at) - +new Date(b.created_at),
            )
            .map((r) => ({
              id: r.id,
              author: r.author,
              body: r.body,
              createdAt: r.created_at,
              isYou: viewerId === r.user_id,
              hidden: r.hidden,
            }))
        : [];

      return {
        ...t,
        commentId,
        likeCount: commentId ? likeCountById.get(commentId) ?? 0 : 0,
        likedByYou: commentId ? likedByYou.has(commentId) : false,
        replyCount: replies.length,
        hidden,
        replies,
      };
    })
    .filter((t) => !t.hidden);
}
