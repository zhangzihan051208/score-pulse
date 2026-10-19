import { HomeBoards } from "@/components/home-boards";
import { listLiveMatchEvents } from "@/lib/fixtures-sync";

export default async function HomePage() {
  const initialEvents = await listLiveMatchEvents(["nba", "soccer"], 48);
  return <HomeBoards initialEvents={initialEvents} />;
}
