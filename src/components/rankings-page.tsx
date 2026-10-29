"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HonorBoard } from "@/components/honor-board";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamCrest } from "@/components/team-crest";
import { Overall } from "@/components/score-rows";
import { useI18n } from "@/i18n/use-i18n";
import { dimensionIds, POSITION_PROFILES, type PositionKey } from "@/lib/position-ratings";
import { playerHubHref } from "@/lib/player-routes";
import type { LeaderboardEntry } from "@/lib/rankings-server";
import { SPORTS, type Sport } from "@/lib/types";
import { cn } from "cn";

type Payload = {
  sport: Sport;
  board: "overall" | "dimension";
  dimId?: string;
  teamId?: string;
  entries: LeaderboardEntry[];
};

export function RankingsPageInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const hallRaw = searchParams.get("hall");
  const hall =
    hallRaw === "teams" || hallRaw === "legends" || hallRaw === "community"
      ? hallRaw
      : "players";
  const sportParam = searchParams.get("sport");
  const sport = (
    sportParam === "all"
      ? "all"
      : sportParam && (SPORTS as readonly string[]).includes(sportParam)
        ? sportParam
        : hall === "community"
          ? "nba"
          : "soccer"
  ) as Sport | "all";
  const communitySport: Sport = sport === "all" ? "nba" : sport;
  const teamId = searchParams.get("teamId")?.trim() || "";
  const board =
    searchParams.get("board") === "dimension" ? "dimension" : "overall";

  const positionKey = useMemo((): PositionKey => {
    if (communitySport === "esports") return "esports.player";
    if (communitySport === "soccer") return "soccer.striker";
    if (communitySport === "nba") return "nba.guard";
    if (communitySport === "nfl") return "nfl.quarterback";
    if (communitySport === "f1") return "f1.driver";
    if (communitySport === "tennis") return "tennis.player";
    if (communitySport === "ufc") return "ufc.striker";
    return "nba.guard";
  }, [communitySport]);

  const dimIds = useMemo(
    () => [
      ...(POSITION_PROFILES[positionKey]?.dimensions ?? dimensionIds(positionKey)),
    ],
    [positionKey],
  );

  const dimId = searchParams.get("dim")?.trim() || dimIds[0] || "scoring";

  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamQuery, setTeamQuery] = useState("");
  const [teamPick, setTeamPick] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [teamMeta, setTeamMeta] = useState<{
    id: string;
    name: string;
    badgeUrl?: string;
  } | null>(null);

  const teamSearchSport =
    communitySport === "soccer" ? "soccer" : communitySport === "nba" ? "nba" : null;

  const load = useCallback(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set("sport", communitySport);
    sp.set("board", board);
    if (board === "dimension") sp.set("dim", dimId);
    if (teamId) sp.set("teamId", teamId);
    fetch(`/api/rankings?${sp}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Payload | null) => setData(d))
      .finally(() => setLoading(false));
  }, [board, communitySport, dimId, teamId]);

  useEffect(() => {
    if (hall !== "community") {
      setLoading(false);
      return;
    }
    load();
  }, [hall, load]);

  useEffect(() => {
    if (!teamId || !teamSearchSport) {
      setTeamMeta(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/teams/${encodeURIComponent(teamId)}?sport=${teamSearchSport}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { team?: { id: string; name: string; badgeUrl?: string } } | null) => {
        if (cancelled || !d?.team) return;
        setTeamMeta({
          id: d.team.id,
          name: d.team.name,
          badgeUrl: d.team.badgeUrl,
        });
      })
      .catch(() => {
        if (!cancelled) setTeamMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId, teamSearchSport]);

  const setParam = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    router.replace(`/rankings?${sp.toString()}`);
  };

  const searchTeam = async () => {
    const q = teamQuery.trim();
    if (q.length < 2 || !teamSearchSport) return;
    const res = await fetch(
      `/api/teams/search?q=${encodeURIComponent(q)}&sport=${teamSearchSport}&limit=8`,
    );
    const json = (await res.json()) as {
      teams?: { id: string; name: string }[];
    };
    const first = json.teams?.[0];
    if (first) {
      setTeamPick(first);
      setParam({ teamId: first.id });
    }
  };

  const scope = teamId ? "team" : "global";

  return (
    <div className="mx-auto max-w-2xl px-3 py-6 pb-24">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">
        ← {t.nav.home}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{t.rankings.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {hall === "community" ? t.rankings.lead : t.rankings.hallLead}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(
          [
            ["players", t.rankings.hallPlayers],
            ["teams", t.rankings.hallTeams],
            ["legends", t.rankings.hallLegends],
            ["community", t.rankings.hallCommunity],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              setParam({
                hall: key,
                sport: key === "community" && sport === "all" ? "nba" : sport,
                teamId: null,
              })
            }
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium",
              hall === key ? "bg-primary text-primary-foreground" : "border",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {hall !== "community" ? (
          <button
            type="button"
            onClick={() => setParam({ sport: "all", teamId: null })}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium",
              sport === "all" ? "bg-foreground text-background" : "bg-muted",
            )}
          >
            {t.rankings.hallAll}
          </button>
        ) : null}
        {SPORTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setParam({ sport: s, teamId: null })}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium",
              sport === s ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {t.sports[s]}
          </button>
        ))}
      </div>

      {hall !== "community" ? (
        <HonorBoard kind={hall} sport={sport} />
      ) : null}

      {hall === "community" ? (
        <>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium",
            scope === "global" ? "bg-foreground text-background" : "border",
          )}
          onClick={() => setParam({ teamId: null })}
        >
          {t.rankings.scopeGlobal}
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium",
            scope === "team" ? "bg-foreground text-background" : "border",
          )}
          onClick={() => {
            if (!teamId && teamPick) setParam({ teamId: teamPick.id });
          }}
        >
          {t.rankings.scopeTeam}
        </button>
      </div>

      {teamId && teamMeta ? (
        <Link
          href={`/teams/${encodeURIComponent(teamMeta.id)}?sport=${communitySport}`}
          className="mt-4 flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 hover:border-primary/40"
        >
          <TeamCrest
            name={teamMeta.name}
            badgeUrl={teamMeta.badgeUrl}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{teamMeta.name}</p>
            <p className="text-xs text-muted-foreground">{t.rankings.scopeTeam}</p>
          </div>
        </Link>
      ) : null}

      {teamSearchSport && (scope === "team" || teamQuery) ? (
        <div className="mt-3 flex gap-2">
          <input
            value={teamQuery}
            onChange={(e) => setTeamQuery(e.target.value)}
            placeholder={t.rankings.teamSearchPlaceholder}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={searchTeam}
            className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
          >
            {t.rankings.applyTeam}
          </button>
          {teamId ? (
            <button
              type="button"
              onClick={() => {
                setTeamPick(null);
                setParam({ teamId: null });
              }}
              className="rounded-md border px-3 py-2 text-xs"
            >
              {t.teams.clear}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => setParam({ board: "overall", dim: null })}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium",
            board === "overall" ? "bg-primary text-primary-foreground" : "border",
          )}
        >
          {t.rankings.boardOverall}
        </button>
        <button
          type="button"
          onClick={() => setParam({ board: "dimension", dim: dimId })}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium",
            board === "dimension" ? "bg-primary text-primary-foreground" : "border",
          )}
        >
          {t.rankings.boardDimension}
        </button>
      </div>

      {board === "dimension" && (
        <div className="mt-2 flex flex-wrap gap-1">
          {dimIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setParam({ board: "dimension", dim: id })}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px]",
                dimId === id ? "bg-muted font-semibold" : "text-muted-foreground",
              )}
            >
              {t.dims[communitySport]?.[id] ?? id}
            </button>
          ))}
        </div>
      )}

      <section className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t.common.loadingPage}</p>
        ) : !data?.entries.length ? (
          <p className="text-sm text-muted-foreground">{t.rankings.empty}</p>
        ) : (
          <ol className="space-y-2">
            {data.entries.map((e) => (
              <li key={e.athleteId}>
                <Link
                  href={playerHubHref(e.sport, e.athleteId)}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <span className="w-7 shrink-0 text-center text-sm font-bold text-muted-foreground">
                    {e.rank}
                  </span>
                  <PlayerAvatar
                    athlete={{
                      name: e.displayName,
                      shortName: e.displayName.slice(0, 2),
                      photoUrl: e.photoUrl,
                    }}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[e.teamName, `${e.ratingCount} ${t.event.ratings}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="text-right">
                    {board === "dimension" && e.highlightValue != null ? (
                      <>
                        <p className="text-lg font-bold tabular-nums">
                          {e.highlightValue.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {t.dims[communitySport]?.[dimId] ?? dimId}
                        </p>
                      </>
                    ) : (
                      <Overall value={e.overall} />
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
        </>
      ) : null}
    </div>
  );
}
