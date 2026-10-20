import type { ScoreMap } from "@/lib/types";

export type CommentReply = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  isYou: boolean;
  hidden: boolean;
};

export type CommunityTake = {
  userId: string;
  author: string;
  scores: ScoreMap;
  updatedAt: string;
  body?: string;
  isYou: boolean;
  commentId?: string;
  likeCount?: number;
  likedByYou?: boolean;
  replyCount?: number;
  hidden?: boolean;
  replies?: CommentReply[];
};
