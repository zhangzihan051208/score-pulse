import { team } from "./catalog";
import { eventById, eventBySlug } from "./events";
import { sportOfFavoriteKey } from "./favorites";

type FavMap = Record<string, { primary?: string; secondary?: string }>;

export type RatingRow = {
  id: string;
  eventSlug: string;
  eventId?: string;
  athleteId: string;
  athleteName: string;
  scores: Record<string, number>;
  comment: string;
  at: string;
  mode: "full" | "overall";
  author: string;
};

export type MatchRow = {
  id: string;
  eventSlug: string;
  eventId?: string;
  score: number;
  body: string;
  at: string;
  author: string;
};

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:43147").replace(/\/$/, "");

export type CloudAuth = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
};

export type CloudBundle = {
  email: string;
  profile: {
    displayName: string;
    bio: string;
    favoriteTeams: Record<string, { primary?: { id?: string }; secondary?: { id?: string } }>;
    isVip: boolean;
  };
  ratings: {
    eventId: string;
    athleteId: string;
    sport: string;
    scores: Record<string, number>;
    ratingMode: "full" | "overall_only";
    comment: string;
    author: string;
    updatedAt: string;
  }[];
  matches: {
    eventId: string;
    sport: string;
    score: number;
    comment: string;
    author: string;
    updatedAt: string;
  }[];
};

type AuthResult = { auth: CloudAuth } | { error: string } | { confirm: true };

async function readJson(res: Response) {
  return (await res.json().catch(() => null)) as Record<string, unknown> | null;
}

export async function signInCloud(email: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${API_URL}/api/auth/mobile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signIn", email, password }),
  });
  const data = await readJson(res);
  if (!res.ok || !data?.accessToken) {
    return { error: String(data?.error ?? "Sign in failed") };
  }
  return { auth: authFrom(data) };
}

export async function signUpCloud(email: string, password: string, displayName: string): Promise<AuthResult> {
  const res = await fetch(`${API_URL}/api/auth/mobile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signUp", email, password, displayName }),
  });
  const data = await readJson(res);
  if (data?.needsEmailConfirm) return { confirm: true };
  if (!res.ok || !data?.accessToken) return { error: String(data?.error ?? "Sign up failed") };
  return { auth: authFrom(data) };
}

export async function refreshCloud(refreshToken: string): Promise<CloudAuth | null> {
  const res = await fetch(`${API_URL}/api/auth/mobile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refresh", refreshToken }),
  });
  const data = await readJson(res);
  if (!res.ok || !data?.accessToken) return null;
  return authFrom(data);
}

function authFrom(data: Record<string, unknown>): CloudAuth {
  return {
    accessToken: String(data.accessToken),
    refreshToken: String(data.refreshToken),
    expiresAt: Number(data.expiresAt) || Math.floor(Date.now() / 1000) + 3600,
    email: String(data.email ?? ""),
  };
}

export async function api(path: string, token: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

export async function fetchBundle(token: string): Promise<CloudBundle | null> {
  const res = await api("/api/account/bundle", token);
  if (!res.ok) return null;
  return (await res.json()) as CloudBundle;
}

export async function pushProfile(token: string, body: { displayName?: string; bio?: string; favoriteTeams?: unknown }) {
  await api("/api/profile", token, { method: "PATCH", body: JSON.stringify(body) });
}

export async function pushPlayerRating(
  token: string,
  rating: RatingRow,
  displayName: string,
): Promise<string | null> {
  const event = eventBySlug(rating.eventSlug) ?? eventById(rating.eventId || "");
  if (!event) return null;
  const comment = rating.comment.trim();
  const res = await api("/api/community/post", token, {
    method: "POST",
    body: JSON.stringify({
      eventId: event.id,
      athleteId: rating.athleteId,
      sport: event.sport,
      positionKey: event.players.find((player) => player.id === rating.athleteId)?.positionKey,
      scores: rating.scores,
      ratingMode: rating.mode === "full" ? "full" : "overall_only",
      comment: comment.length >= 8 ? comment : "",
      displayName,
      athleteName: rating.athleteName,
    }),
  });
  if (res.ok) return null;
  const data = await readJson(res);
  if (data?.code === "moderation_blocked") return "moderation_blocked";
  return String(data?.error ?? "Upload failed");
}

export async function pushMatch(token: string, take: MatchRow, displayName: string): Promise<string | null> {
  const event = eventBySlug(take.eventSlug) ?? eventById(take.eventId || "");
  if (!event) return null;
  const res = await api("/api/community/match", token, {
    method: "POST",
    body: JSON.stringify({
      eventId: event.id,
      sport: event.sport,
      score: take.score,
      comment: take.body,
      displayName,
    }),
  });
  if (res.ok) return null;
  const data = await readJson(res);
  if (data?.code === "moderation_blocked") return "moderation_blocked";
  return String(data?.error ?? "Upload failed");
}

export async function deleteCloudAccount(token: string) {
  const res = await api("/api/profile", token, { method: "DELETE" });
  if (res.ok) return null;
  const data = await readJson(res);
  return String(data?.error ?? "Delete failed");
}

export function favoritesToCloud(favorites: FavMap) {
  const out: Record<string, { primary?: { id: string; name: string }; secondary?: { id: string; name: string } }> = {};
  for (const [key, slots] of Object.entries(favorites)) {
    const sport = sportOfFavoriteKey(key);
    const pack = (id?: string) => {
      if (!id) return undefined;
      return { id, name: team(sport, id)?.name ?? id };
    };
    const primary = pack(slots?.primary);
    const secondary = pack(slots?.secondary);
    if (primary || secondary) out[key] = { primary, secondary };
  }
  return out;
}

export function favoritesFromCloud(raw: CloudBundle["profile"]["favoriteTeams"]): FavMap {
  const out: FavMap = {};
  for (const [key, slots] of Object.entries(raw ?? {})) {
    out[key] = { primary: slots?.primary?.id, secondary: slots?.secondary?.id };
  }
  return out;
}

export async function uploadNewer(
  token: string,
  ratings: RatingRow[],
  matches: MatchRow[],
  bundle: CloudBundle,
  name: string,
) {
  let error: string | null = null;
  for (const rating of ratings) {
    const event = eventBySlug(rating.eventSlug) ?? eventById(rating.eventId || "");
    if (!event) continue;
    const remote = bundle.ratings.find((row) => row.eventId === event.id && row.athleteId === rating.athleteId);
    if (!remote || +new Date(rating.at) > +new Date(remote.updatedAt)) {
      error = (await pushPlayerRating(token, rating, name)) ?? error;
    }
  }
  for (const take of matches) {
    const event = eventBySlug(take.eventSlug) ?? eventById(take.eventId || "");
    if (!event) continue;
    const remote = bundle.matches.find((row) => row.eventId === event.id);
    if (!remote || +new Date(take.at) > +new Date(remote.updatedAt)) {
      error = (await pushMatch(token, take, name)) ?? error;
    }
  }
  return error;
}

function newer(a: string, b: string) {
  return +new Date(a) >= +new Date(b);
}

export function mergeRatings(local: RatingRow[], cloud: CloudBundle["ratings"]): RatingRow[] {
  const map = new Map<string, RatingRow>();
  for (const row of local) {
    const event = eventBySlug(row.eventSlug) ?? eventById(row.eventId || "");
    map.set(`${event?.id ?? row.eventId ?? row.eventSlug}:${row.athleteId}`, row);
  }
  for (const row of cloud) {
    const event = eventById(row.eventId);
    const key = `${row.eventId}:${row.athleteId}`;
    const prev = map.get(key);
    const slug = event?.slug ?? prev?.eventSlug ?? row.eventId;
    if (!prev || newer(row.updatedAt, prev.at)) {
      map.set(key, {
        id: prev?.id ?? `cloud-${key}`,
        eventSlug: slug,
        eventId: row.eventId,
        athleteId: row.athleteId,
        athleteName: prev?.athleteName || row.athleteId,
        scores: row.scores,
        comment: row.comment || prev?.comment || "",
        at: row.updatedAt,
        mode: row.ratingMode === "overall_only" ? "overall" : "full",
        author: row.author || prev?.author || "球迷",
      });
    }
  }
  return [...map.values()].sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

export function mergeMatches(local: MatchRow[], cloud: CloudBundle["matches"]): MatchRow[] {
  const map = new Map<string, MatchRow>();
  for (const row of local) {
    const event = eventBySlug(row.eventSlug) ?? eventById(row.eventId || "");
    map.set(event?.id ?? row.eventId ?? row.eventSlug, row);
  }
  for (const row of cloud) {
    const event = eventById(row.eventId);
    const prev = map.get(row.eventId);
    const slug = event?.slug ?? prev?.eventSlug ?? row.eventId;
    if (!prev || newer(row.updatedAt, prev.at)) {
      map.set(row.eventId, {
        id: prev?.id ?? `cloud-match-${row.eventId}`,
        eventSlug: slug,
        eventId: row.eventId,
        score: row.score,
        body: row.comment || prev?.body || "",
        at: row.updatedAt,
        author: row.author || prev?.author || "球迷",
      });
    }
  }
  return [...map.values()].sort((a, b) => +new Date(b.at) - +new Date(a.at));
}
