import type { Metadata } from "next";
import { CommunityFeed } from "@/components/community-feed";

export const metadata: Metadata = {
  title: "社区动态",
};

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold">社区动态</h1>
        <p className="mt-2 text-muted-foreground">
          示范评论和你在本机提交的评分、评论会按时间排在这里。点进去可以继续改分。
        </p>
      </div>
      <CommunityFeed />
    </div>
  );
}
