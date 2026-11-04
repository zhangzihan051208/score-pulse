import Link from "next/link";
import { FormPips } from "@/components/form-pips";
import { TeamCrest } from "@/components/team-crest";
import type { Dict } from "@/i18n/dict";
import type { LeagueTablePayload, StandingRow } from "@/lib/league-table";

function teamHref(sport: "nba" | "soccer", row: StandingRow) {
  if (!row.teamId) return null;
  const params = new URLSearchParams({ sport, name: row.team });
  return `/teams/${encodeURIComponent(row.teamId)}?${params}`;
}

function pct(row: StandingRow) {
  if (row.played === 0) return "—";
  return (row.win / row.played).toFixed(3).slice(1);
}

export function LeagueStandings({
  table,
  t,
}: {
  table: LeagueTablePayload;
  t: Dict;
}) {
  if (table.groups.every((group) => group.rows.length === 0)) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
        {t.table.empty}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {table.groups.map((group) =>
        group.rows.length === 0 ? null : (
          <section key={group.id} className="space-y-2">
            {group.id !== "table" ? (
              <h2 className="text-sm font-semibold">
                {group.id === "east" ? t.table.east : t.table.west}
              </h2>
            ) : null}
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/50 text-[11px] tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">{t.table.rank}</th>
                    <th className="px-2 py-2 text-left font-medium">{t.table.team}</th>
                    {table.sport === "nba" ? (
                      <>
                        <th className="px-2 py-2 text-right font-medium">{t.table.won}</th>
                        <th className="px-2 py-2 text-right font-medium">{t.table.lost}</th>
                        <th className="px-2 py-2 text-right font-medium">{t.table.pct}</th>
                      </>
                    ) : (
                      <>
                        <th className="px-2 py-2 text-right font-medium">{t.table.played}</th>
                        <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">{t.table.won}</th>
                        <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">{t.table.drawn}</th>
                        <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">{t.table.lost}</th>
                        <th className="px-2 py-2 text-right font-medium">{t.table.gd}</th>
                        <th className="px-2 py-2 text-right font-medium">{t.table.points}</th>
                      </>
                    )}
                    <th className="px-3 py-2 text-right font-medium">{t.table.form}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => {
                    const href = teamHref(table.sport, row);
                    const name = (
                      <span className="truncate font-medium">{row.team}</span>
                    );
                    return (
                      <tr key={`${group.id}-${row.teamId || row.team}`} className="border-t" title={row.note}>
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.rank}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <TeamCrest name={row.team} badgeUrl={row.badgeUrl} size="sm" />
                            {href ? (
                              <Link href={href} className="min-w-0 max-w-[7.5rem] truncate sm:max-w-none hover:underline">
                                {name}
                              </Link>
                            ) : (
                              <span className="max-w-[7.5rem] truncate sm:max-w-none">{name}</span>
                            )}
                          </div>
                        </td>
                        {table.sport === "nba" ? (
                          <>
                            <td className="px-2 py-2 text-right tabular-nums">{row.win}</td>
                            <td className="px-2 py-2 text-right tabular-nums">{row.loss}</td>
                            <td className="px-2 py-2 text-right tabular-nums">{pct(row)}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-2 text-right tabular-nums">{row.played}</td>
                            <td className="hidden px-2 py-2 text-right tabular-nums sm:table-cell">{row.win}</td>
                            <td className="hidden px-2 py-2 text-right tabular-nums sm:table-cell">{row.draw}</td>
                            <td className="hidden px-2 py-2 text-right tabular-nums sm:table-cell">{row.loss}</td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold tabular-nums">{row.points}</td>
                          </>
                        )}
                        <td className="px-3 py-2">
                          <div className="flex justify-end">
                            <FormPips form={row.form} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground">{t.table.formHint}</p>
          </section>
        ),
      )}
    </div>
  );
}
