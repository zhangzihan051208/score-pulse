import type { Sport } from "@/lib/types";

export function playerHubHref(sport: Sport | string, athleteId: string) {
  return `/players/${encodeURIComponent(sport)}/${encodeURIComponent(athleteId)}`;
}

export function rankingsHref(params?: {
  sport?: string;
  teamId?: string;
  board?: "overall" | "dimension";
  dim?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.sport) sp.set("sport", params.sport);
  if (params?.teamId) sp.set("teamId", params.teamId);
  if (params?.board) sp.set("board", params.board);
  if (params?.dim) sp.set("dim", params.dim);
  const q = sp.toString();
  return q ? `/rankings?${q}` : "/rankings";
}
