import { connection } from "next/server";
import { HomeBoards } from "@/components/home-boards";
import { cachedLiveMatchEvents } from "@/lib/live-data-cache";

/** Serve cached HTML; fixture rows refresh on a short interval via client poll. */
export const revalidate = 12;

export default async function HomePage() {
  // Prerender has a 60s cap and these reads miss when the build cache is cold.
  // A real request still loads the same match list.
  await connection();
  const initialEvents = await cachedLiveMatchEvents(["nba", "soccer"], 48);
  return <HomeBoards initialEvents={initialEvents} />;
}
