import { useEffect, useState } from "react";
import { API_URL } from "./cloud";

export const LIVE_MS = 4000;

export type LiveTake = {
  userId: string;
  author: string;
  body?: string;
  score?: number;
  scores?: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
  isYou: boolean;
};

export type MatchThread = {
  takes: {
    userId: string;
    author: string;
    score: number;
    body: string;
    createdAt: string;
    isYou: boolean;
  }[];
};

export type PlayerThread = {
  takes: LiveTake[];
  communityAvg: Record<string, number> | null;
  ratingCount: number;
};

export type EventSummary = {
  takesByAthlete: Record<string, LiveTake[]>;
};

export async function publicGet<T>(path: string, token?: string | null): Promise<T | null> {
  try {
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${API_URL}${path}`, { headers });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function useAthleteComments(
  events: { id: string; positionKey: string; title: string }[],
  athleteId: string,
  token: string | null,
) {
  const key = events.map((event) => `${event.id}:${event.positionKey}`).join("|");
  const [rows, setRows] = useState<{ id: string; author: string; body: string; title: string }[]>([]);
  useEffect(() => {
    if (!athleteId || events.length === 0) {
      setRows([]);
      return;
    }
    let stop = false;
    const load = async () => {
      const lists = await Promise.all(
        events.slice(0, 6).map(async (event) => {
          const data = await publicGet<PlayerThread>(
            `/api/community/${encodeURIComponent(event.id)}/${encodeURIComponent(athleteId)}?positionKey=${encodeURIComponent(event.positionKey)}`,
            token,
          );
          return (data?.takes ?? [])
            .filter((take) => take.body?.trim())
            .map((take) => ({
              id: `${event.id}:${take.userId}`,
              author: take.author,
              body: take.body!.trim(),
              title: event.title,
            }));
        }),
      );
      if (!stop) setRows(lists.flat().slice(0, 24));
    };
    void load();
    const id = setInterval(() => void load(), LIVE_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
    // key captures the event list; the array identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId, key, token]);
  return rows;
}

export function useLiveJson<T>(path: string | null, token: string | null) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    if (!path) return;
    let stop = false;
    const load = () => {
      void publicGet<T>(path, token).then((json) => {
        if (!stop && json) setData(json);
      });
    };
    load();
    const id = setInterval(load, LIVE_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [path, token]);
  return data;
}
