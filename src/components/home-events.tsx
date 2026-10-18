"use client";

import { useMemo, useState } from "react";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { events, SPORT_LABEL } from "@/lib/data";
import type { EventStatus, Sport } from "@/lib/types";
import { SPORTS } from "@/lib/types";

const statusFilters: { id: "all" | EventStatus; label: string }[] = [
  { id: "all", label: "全部赛程" },
  { id: "live", label: "进行中" },
  { id: "upcoming", label: "未开赛" },
  { id: "ended", label: "已结束" },
];

export function HomeEvents() {
  const [status, setStatus] = useState<"all" | EventStatus>("all");
  const [sport, setSport] = useState<"all" | Sport>("all");

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (status !== "all" && event.status !== status) return false;
      if (sport !== "all" && event.sport !== sport) return false;
      return true;
    });
  }, [status, sport]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={status === item.id ? "default" : "outline"}
              onClick={() => setStatus(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={sport === "all" ? "secondary" : "ghost"}
            onClick={() => setSport("all")}
          >
            全部项目
          </Button>
          {SPORTS.map((id) => (
            <Button
              key={id}
              size="sm"
              variant={sport === id ? "secondary" : "ghost"}
              onClick={() => setSport(id)}
            >
              {SPORT_LABEL[id]}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-16 text-center text-sm text-muted-foreground">
          这个筛选下没有赛事。换一个项目或状态看看。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
