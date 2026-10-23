import { TeamPageInner } from "@/components/team-page";
import { SPORTS, type Sport } from "@/lib/types";

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ sport?: string; name?: string }>;
}) {
  const { teamId } = await params;
  const sp = await searchParams;
  const sport: Sport =
    sp.sport && (SPORTS as readonly string[]).includes(sp.sport)
      ? (sp.sport as Sport)
      : "soccer";
  return (
    <TeamPageInner teamId={teamId} sport={sport} nameHint={sp.name} />
  );
}
