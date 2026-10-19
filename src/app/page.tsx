import { HomeBoards } from "@/components/home-boards";
import { cachedLiveMatchEvents } from "@/lib/live-data-cache";

/** Serve cached HTML; fixture rows refresh on a short interval via client poll. */
export const revalidate = 30;

export default async function HomePage() {
  const initialEvents = await cachedLiveMatchEvents(["nba", "soccer"], 48);
  return <HomeBoards initialEvents={initialEvents} />;
}
