import type { Metadata } from "next";
import { FeedList } from "@/components/feed-list";

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage() {
  return <FeedList />;
}
