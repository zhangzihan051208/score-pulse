"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DimensionChips } from "@/components/rating-guide-panel";
import { PlayerAvatar } from "@/components/player-avatar";
import { Overall } from "@/components/score-rows";
import { useI18n } from "@/i18n/use-i18n";
import type { PlayerEventRating } from "@/lib/rankings-server";
import { playerHubHref, rankingsHref } from "@/lib/player-routes";
import type { ScoreMap, Sport } from "@/lib/types";

type HubPayload = {
  profile: {
    display_name: string;
    team_id: string | null;
    team_name: string | null;
    photo_url: string | null;
    position_key: string;
  } | null;
  careerOverall: number | null;
  careerAvg: ScoreMap | null;
  totalRatings: number;
  byEvent: PlayerEventRating[];
};

export function PlayerHubPageInner({
  sport,
  playerId,
}: {
  sport: Sport;
  playerId: string;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<HubPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `/api/players/${encodeURIComponent(sport)}/${encodeURIComponent(playerId)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d: HubPayload | null) => setData(d))
      .finally(() => setLoading(false));
  }, [playerId, sport]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-3 py-10 text-sm text-muted-foreground">
        {t.common.loadingPage}
      </div>
    );
  }

  const name = data?.profile?.display_name ?? playerId;
  const teamId = data?.profile?.team_id ?? undefined;
  const teamName = data?.profile?.team_name ?? undefined;
  const positionKey = (data?.profile?.position_key ?? "nba.guard") as import("@/lib/position-ratings").PositionKey;
  const teamHref =
    teamId && (sport === "nba" || sport === "soccer")
      ? `/teams/${encodeURIComponent(teamId)}?sport=${sport}${teamName ? `&name=${encodeURIComponent(teamName)}` : ""}`
      : teamId
        ? rankingsHref({ sport, teamId })
        : undefined;

  return (
    <div className="mx-auto max-w-2xl px-3 py-6 pb-24">
      <Link href={`/boards/${sport}`} className="text-xs text-muted-foreground hover:underline">
        ← {t.sports[sport]}
      </Link>

      <header className="mt-4 flex gap-4">
        <PlayerAvatar
          athlete={{
            name,
            shortName: name.slice(0, 2),
            photoUrl: data?.profile?.photo_url ?? undefined,
          }}
          size="xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{t.player.hubKicker}</p>
          <h1 className="truncate text-2xl font-bold">{name}</h1>
          {teamName ? (
            teamHref ? (
              <Link href={teamHref} className="text-sm text-primary hover:underline">
                {teamName}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">{teamName}</p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">{t.player.noTeam}</p>
          )}
          {data?.careerOverall != null && (
            <div className="mt-2 flex items-end gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">{t.player.careerAvg}</p>
                <Overall value={data.careerOverall} />
              </div>
              <p className="pb-1 text-xs text-muted-foreground">
                {data.totalRatings.toLocaleString()} {t.event.ratings}
              </p>
            </div>
          )}
        </div>
      </header>

      {data?.careerAvg && (
        <div className="mt-4 rounded-lg bg-muted/45 px-3 py-2">
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">
            {t.player.careerAxes}
          </p>
          <DimensionChips positionKey={positionKey} scores={data.careerAvg} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {teamId ? (
          <Link
            href={rankingsHref({ sport, teamId })}
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
          >
            {t.player.teamRankLink}
          </Link>
        ) : null}
        <Link
          href={rankingsHref({ sport })}
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
        >
          {t.player.globalRankLink}
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.player.eventRankTitle}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t.player.eventRankHint}</p>
        {!data?.byEvent.length ? (
          <p className="mt-4 text-sm text-muted-foreground">{t.player.noRatingsYet}</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {data.byEvent.map((row, idx) => (
              <li key={row.eventId}>
                <EventRatingRow
                  rank={idx + 1}
                  row={row}
                  sport={sport}
                  playerId={playerId}
                  positionKey={positionKey}
                />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function EventRatingRow({
  rank,
  row,
  sport,
  playerId,
  positionKey,
}: {
  rank: number;
  row: PlayerEventRating;
  sport: Sport;
  playerId: string;
  positionKey: import("@/lib/position-ratings").PositionKey;
}) {
  const { t } = useI18n();
  const href = row.eventSlug
    ? `/events/${row.eventSlug}/${encodeURIComponent(playerId)}`
    : undefined;

  const inner = (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
      <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {row.eventTitle ?? `${t.player.matchFallback} ${row.eventId.slice(0, 8)}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {[row.eventDate, `${row.ratingCount} ${t.event.ratings}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <Overall value={row.overall} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-colors hover:border-primary/40">
        {inner}
      </Link>
    );
  }

  return inner;
}
