import { TeamPageInner } from "@/components/team-page";

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ sport?: string; name?: string }>;
}) {
  const { teamId } = await params;
  const sp = await searchParams;
  const sport = sp.sport === "nba" ? "nba" : "soccer";
  return (
    <TeamPageInner teamId={teamId} sport={sport} nameHint={sp.name} />
  );
}
