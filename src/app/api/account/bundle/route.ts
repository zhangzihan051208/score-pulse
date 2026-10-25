import { normalizeFavorites } from "@/lib/favorite-teams";
import { isVipActive } from "@/lib/vip";
import { json } from "@/lib/http";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readProfile } from "@/lib/supabase/profile-row";
import { requestUser } from "@/lib/supabase/request-user";

const MATCH_ATHLETE_ID = "__match__";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return json(request, { error: "Supabase not configured" }, 503);
  }
  const { supabase, user } = await requestUser(request);
  if (!supabase || !user) return json(request, { error: "Sign in required" }, 401);

  const [{ data: profile, error: profileError }, { data: ratings, error: ratingError }, { data: comments, error: commentError }] =
    await Promise.all([
      readProfile(supabase, user.id),
      supabase
        .from("ratings")
        .select("event_id, athlete_id, sport, scores, rating_mode, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(200)
        .then(async (result) => {
          if (result.error && /rating_mode/.test(result.error.message)) {
            const fallback = await supabase
              .from("ratings")
              .select("event_id, athlete_id, sport, scores, updated_at")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(200);
            return {
              data: (fallback.data ?? []).map((row) => ({ ...row, rating_mode: "full" })),
              error: fallback.error,
            };
          }
          return result;
        }),
      supabase
        .from("comments")
        .select("event_id, athlete_id, body, created_at, author")
        .eq("user_id", user.id)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  if (profileError || ratingError || commentError) {
    return json(
      request,
      { error: profileError?.message || ratingError?.message || commentError?.message },
      500,
    );
  }

  const commentKey = (eventId: string, athleteId: string) => `${eventId}:${athleteId}`;
  const commentByKey = new Map(
    (comments ?? []).map((row) => [commentKey(row.event_id, row.athlete_id), row]),
  );

  const playerRatings = [];
  const matches = [];
  for (const row of ratings ?? []) {
    const scores = (row.scores ?? {}) as Record<string, number>;
    const comment = commentByKey.get(commentKey(row.event_id, row.athlete_id));
    if (row.athlete_id === MATCH_ATHLETE_ID) {
      matches.push({
        eventId: row.event_id,
        sport: row.sport,
        score: typeof scores.match === "number" ? scores.match : 0,
        comment: comment?.body ?? "",
        author: comment?.author ?? profile?.display_name ?? "Fan",
        updatedAt: row.updated_at,
      });
      continue;
    }
    playerRatings.push({
      eventId: row.event_id,
      athleteId: row.athlete_id,
      sport: row.sport,
      scores,
      ratingMode: row.rating_mode === "overall_only" ? "overall_only" : "full",
      comment: comment?.body ?? "",
      author: comment?.author ?? profile?.display_name ?? "Fan",
      updatedAt: row.updated_at,
    });
  }

  return json(request, {
    email: user.email ?? "",
    profile: {
      displayName: profile?.display_name?.trim() || user.email?.split("@")[0] || "Fan",
      bio: profile?.bio?.trim() || "",
      favoriteTeams: normalizeFavorites(profile?.favorite_teams),
      isVip: isVipActive(profile?.vip_until),
      updatedAt: profile?.updated_at ?? null,
    },
    ratings: playerRatings,
    matches,
  });
}
