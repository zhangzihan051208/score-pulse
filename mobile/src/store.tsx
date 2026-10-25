import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  deleteCloudAccount,
  favoritesFromCloud,
  favoritesToCloud,
  fetchBundle,
  mergeMatches,
  mergeRatings,
  pushMatch,
  pushPlayerRating,
  pushProfile,
  refreshCloud,
  signInCloud,
  signUpCloud,
  uploadNewer,
  type CloudAuth,
} from "./cloud";

const KEY = "grandstand.session.v1";
export const FREE_FULL_RATINGS = 5;

export type RatingMode = "full" | "overall";

export type MatchTake = {
  id: string;
  eventSlug: string;
  eventId?: string;
  score: number;
  body: string;
  at: string;
  author: string;
};

export type SavedRating = {
  id: string;
  eventSlug: string;
  eventId?: string;
  athleteId: string;
  athleteName: string;
  scores: Record<string, number>;
  comment: string;
  at: string;
  mode: RatingMode;
  author: string;
};

export type ZoneComment = {
  id: string;
  author: string;
  body: string;
  scores: Record<string, number>;
  at: string;
  status: "ok" | "held";
};

export type ZoneItem = {
  id: string;
  name: string;
  blurb: string;
  comments: ZoneComment[];
};

export type Zone = {
  id: string;
  title: string;
  category: string;
  description: string;
  owner: string;
  dims: { id: string; label: string }[];
  items: ZoneItem[];
};

export type Favorites = Record<string, { primary?: string; secondary?: string }>;

type Session = {
  name: string | null;
  bio: string;
  email: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  cloudNote: string | null;
  vip: boolean;
  onboarded: boolean;
  ratings: SavedRating[];
  matchTakes: MatchTake[];
  hiddenTakeIds: string[];
  favorites: Favorites;
  zones: Zone[];
};

type SessionApi = Session & {
  ready: boolean;
  signIn: (name: string, bio: string) => void;
  signInCloud: (email: string, password: string) => Promise<"ok" | "confirm" | string>;
  signUpCloud: (email: string, password: string, name: string) => Promise<"ok" | "confirm" | string>;
  signOut: () => void;
  deleteAccount: () => Promise<string | null>;
  wipeDevice: () => void;
  hideTake: (id: string) => void;
  removeMatch: (eventSlug: string) => void;
  completeOnboarding: () => void;
  setVip: (vip: boolean) => void;
  setFavorite: (sport: string, slot: "primary" | "secondary", teamId?: string) => void;
  clearPartition: (key: string) => void;
  fullLeft: () => number;
  addRating: (rating: Omit<SavedRating, "id" | "at" | "author">) => void;
  postMatch: (eventSlug: string, score: number, body: string) => "ok" | "held";
  addZone: (zone: Omit<Zone, "id" | "owner" | "items"> & { items?: ZoneItem[] }) => string;
  addZoneItem: (zoneId: string, name: string) => void;
  rateZoneItem: (zoneId: string, itemId: string, scores: Record<string, number>, body: string) => "ok" | "held";
  approveComment: (zoneId: string, itemId: string, commentId: string) => void;
};

const seedZones: Zone[] = [
  {
    id: "night-market",
    title: "夜市小吃",
    category: "food",
    description: "味道、份量、性价比、氛围、还想再买。",
    owner: "看台",
    dims: [
      { id: "taste", label: "味道" },
      { id: "portion", label: "份量" },
      { id: "value", label: "性价比" },
      { id: "vibe", label: "氛围" },
      { id: "again", label: "还想再买" },
    ],
    items: [
      {
        id: "squid",
        name: "烤鱿鱼",
        blurb: "炭火，辣油单独放。",
        comments: [
          {
            id: "c1",
            author: "看台",
            body: "外脆，辣油比鱿鱼本身更抢戏。",
            scores: { taste: 8, portion: 7, value: 8, vibe: 9, again: 8 },
            at: "2026-10-20T18:00:00.000Z",
            status: "ok",
          },
        ],
      },
      {
        id: "tea",
        name: "珍珠奶茶",
        blurb: "少冰，珍珠要脆。",
        comments: [],
      },
    ],
  },
];

const empty: Session = {
  name: null,
  bio: "",
  email: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  cloudNote: null,
  vip: false,
  onboarded: false,
  ratings: [],
  matchTakes: [],
  hiddenTakeIds: [],
  favorites: {},
  zones: seedZones,
};

const SessionContext = createContext<SessionApi | null>(null);

function authFields(auth: CloudAuth) {
  return {
    email: auth.email,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    expiresAt: auth.expiresAt,
  };
}

function dayStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

export function moderate(body: string) {
  return /https?:|微信|加微|赌博|色情|代充|免费领/i.test(body) ? "held" : "ok";
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Session>;
          const onboarded = typeof parsed.onboarded === "boolean" ? parsed.onboarded : Boolean(parsed.name);
          setSession({
            ...empty,
            ...parsed,
            vip: false,
            onboarded,
            zones: parsed.zones?.length ? parsed.zones : seedZones,
            matchTakes: parsed.matchTakes ?? [],
            hiddenTakeIds: Array.isArray(parsed.hiddenTakeIds) ? parsed.hiddenTakeIds : [],
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify(session)).catch(() => undefined);
  }, [ready, session]);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const syncing = useRef(false);

  useEffect(() => {
    if (!ready || !session.accessToken) return;
    void syncAccount();
    const id = setInterval(() => void pullAccount(), 8000);
    // Keep this device aligned with grades posted on the website.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => clearInterval(id);
  }, [ready, session.accessToken]);

  async function pullAccount() {
    if (syncing.current) return;
    const token = sessionRef.current.accessToken;
    if (!token) return;
    const fresh = await fetchBundle(token);
    if (!fresh) return;
    setSession((s) => ({
      ...s,
      name: fresh.profile.displayName || s.name,
      bio: fresh.profile.bio || s.bio,
      email: fresh.email || s.email,
      vip: fresh.profile.isVip,
      favorites: { ...s.favorites, ...favoritesFromCloud(fresh.profile.favoriteTeams) },
      ratings: mergeRatings(s.ratings, fresh.ratings),
      matchTakes: mergeMatches(s.matchTakes, fresh.matches),
    }));
  }

  async function syncAccount(override?: CloudAuth) {
    if (syncing.current) return;
    syncing.current = true;
    try {
      const current = sessionRef.current;
      let token = override?.accessToken ?? current.accessToken;
      const refresh = override?.refreshToken ?? current.refreshToken;
      const expires = override?.expiresAt ?? current.expiresAt;
      if (!token || !refresh) return;
      if (expires && expires < Date.now() / 1000 + 60) {
        const next = await refreshCloud(refresh);
        if (!next) {
          setSession((s) => ({ ...s, accessToken: null, refreshToken: null, cloudNote: "登录已过期" }));
          return;
        }
        token = next.accessToken;
        setSession((s) => ({ ...s, ...authFields(next) }));
      }
      const bundle = await fetchBundle(token);
      if (!bundle) {
        setSession((s) => ({ ...s, cloudNote: "云端暂时没连上，评分先留在这台手机上" }));
        return;
      }
      const name = bundle.profile.displayName || current.name || "";
      const uploadError = await uploadNewer(token, current.ratings, current.matchTakes, bundle, name);
      const favorites = { ...current.favorites, ...favoritesFromCloud(bundle.profile.favoriteTeams) };
      await pushProfile(token, {
        displayName: name.length >= 2 ? name : undefined,
        ...(current.bio ? { bio: current.bio } : {}),
        favoriteTeams: favoritesToCloud(favorites),
      });
      const fresh = (await fetchBundle(token)) ?? bundle;
      setSession((s) => ({
        ...s,
        name: fresh.profile.displayName || s.name,
        bio: fresh.profile.bio || s.bio,
        email: fresh.email || s.email,
        vip: fresh.profile.isVip,
        favorites: { ...s.favorites, ...favoritesFromCloud(fresh.profile.favoriteTeams) },
        ratings: mergeRatings(s.ratings, fresh.ratings),
        matchTakes: mergeMatches(s.matchTakes, fresh.matches),
        onboarded: true,
        cloudNote: uploadError,
      }));
    } finally {
      syncing.current = false;
    }
  }

  const api = useMemo<SessionApi>(() => {
    const author = session.name || "球迷";
    return {
      ...session,
      ready,
      signIn: (name, bio) => setSession((current) => ({ ...current, name: name.trim() || "球迷", bio })),
      signInCloud: async (email, password) => {
        try {
          const result = await signInCloud(email, password);
          if ("error" in result) return result.error;
          if ("confirm" in result) return "confirm";
          setSession((current) => ({ ...current, ...authFields(result.auth), cloudNote: null }));
          return "ok";
        } catch (err) {
          return err instanceof Error ? err.message : "failed";
        }
      },
      signUpCloud: async (email, password, name) => {
        try {
          const result = await signUpCloud(email, password, name);
          if ("error" in result) return result.error;
          if ("confirm" in result) return "confirm";
          setSession((current) => ({
            ...current,
            ...authFields(result.auth),
            name: name.trim() || current.name,
            cloudNote: null,
          }));
          return "ok";
        } catch (err) {
          return err instanceof Error ? err.message : "failed";
        }
      },
      signOut: () =>
        setSession((current) => ({
          ...current,
          name: null,
          bio: "",
          email: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          cloudNote: null,
        })),
      deleteAccount: async () => {
        const token = sessionRef.current.accessToken;
        if (!token) return "Sign in required";
        const error = await deleteCloudAccount(token);
        if (error) return error;
        setSession((current) => ({ ...empty, onboarded: current.onboarded }));
        return null;
      },
      wipeDevice: () =>
        setSession((current) => ({
          ...empty,
          onboarded: current.onboarded,
        })),
      hideTake: (id) =>
        setSession((current) =>
          current.hiddenTakeIds.includes(id)
            ? current
            : { ...current, hiddenTakeIds: [...current.hiddenTakeIds, id] },
        ),
      removeMatch: (eventSlug) =>
        setSession((current) => ({
          ...current,
          matchTakes: current.matchTakes.filter((row) => row.eventSlug !== eventSlug),
        })),
      completeOnboarding: () => setSession((current) => ({ ...current, onboarded: true })),
      setVip: (vip) => setSession((current) => ({ ...current, vip })),
      setFavorite: (key, slot, teamId) =>
        setSession((current) => {
          const prev = current.favorites[key] ?? {};
          const next = { ...prev, [slot]: teamId };
          if (teamId && slot === "primary" && next.secondary === teamId) next.secondary = undefined;
          if (teamId && slot === "secondary" && next.primary === teamId) next.primary = undefined;
          const favorites = { ...current.favorites, [key]: next };
          if (current.accessToken) {
            void pushProfile(current.accessToken, { favoriteTeams: favoritesToCloud(favorites) });
          }
          return { ...current, favorites };
        }),
      clearPartition: (key) =>
        setSession((current) => {
          const favorites = { ...current.favorites };
          delete favorites[key];
          if (current.accessToken) {
            void pushProfile(current.accessToken, { favoriteTeams: favoritesToCloud(favorites) });
          }
          return { ...current, favorites };
        }),
      fullLeft: () => {
        if (session.vip) return FREE_FULL_RATINGS;
        const start = dayStartIso();
        const used = session.ratings.filter((rating) => rating.mode === "full" && rating.at >= start).length;
        return Math.max(0, FREE_FULL_RATINGS - used);
      },
      addRating: (rating) => {
        const saved: SavedRating = {
          ...rating,
          id: `r-${Date.now()}`,
          at: new Date().toISOString(),
          author,
        };
        setSession((current) => ({
          ...current,
          ratings: [
            saved,
            ...current.ratings.filter((row) => !(row.eventSlug === saved.eventSlug && row.athleteId === saved.athleteId)),
          ],
        }));
        const token = sessionRef.current.accessToken;
        if (token) {
          void pushPlayerRating(token, saved, author).then((error) => {
            if (error) setSession((current) => ({ ...current, cloudNote: error }));
          });
        }
      },
      postMatch: (eventSlug, score, body) => {
        const trimmed = body.trim();
        const status = trimmed ? moderate(trimmed) : "ok";
        if (status === "held") return status;
        const take: MatchTake = {
          id: `match-${eventSlug}`,
          eventSlug,
          score,
          body: trimmed,
          at: new Date().toISOString(),
          author,
        };
        setSession((current) => ({
          ...current,
          matchTakes: [take, ...current.matchTakes.filter((row) => row.eventSlug !== eventSlug)],
        }));
        const token = sessionRef.current.accessToken;
        if (token) {
          void pushMatch(token, take, author).then((error) => {
            if (error) setSession((current) => ({ ...current, cloudNote: error }));
          });
        }
        return status;
      },
      addZone: (zone) => {
        const id = `zone-${Date.now()}`;
        setSession((current) => ({
          ...current,
          zones: [{ ...zone, id, owner: author, items: zone.items ?? [] }, ...current.zones],
        }));
        return id;
      },
      addZoneItem: (zoneId, name) =>
        setSession((current) => ({
          ...current,
          zones: current.zones.map((zone) =>
            zone.id === zoneId
              ? {
                  ...zone,
                  items: [{ id: `item-${Date.now()}`, name, blurb: "", comments: [] }, ...zone.items],
                }
              : zone,
          ),
        })),
      rateZoneItem: (zoneId, itemId, scores, body) => {
        const status = body.trim() ? moderate(body) : "ok";
        setSession((current) => ({
          ...current,
          zones: current.zones.map((zone) =>
            zone.id !== zoneId
              ? zone
              : {
                  ...zone,
                  items: zone.items.map((item) =>
                    item.id !== itemId
                      ? item
                      : {
                          ...item,
                          comments: [
                            {
                              id: `zc-${Date.now()}`,
                              author,
                              body,
                              scores,
                              at: new Date().toISOString(),
                              status,
                            },
                            ...item.comments,
                          ],
                        },
                  ),
                },
          ),
        }));
        return status;
      },
      approveComment: (zoneId, itemId, commentId) =>
        setSession((current) => ({
          ...current,
          zones: current.zones.map((zone) =>
            zone.id !== zoneId
              ? zone
              : {
                  ...zone,
                  items: zone.items.map((item) =>
                    item.id !== itemId
                      ? item
                      : {
                          ...item,
                          comments: item.comments.map((comment) =>
                            comment.id === commentId ? { ...comment, status: "ok" } : comment,
                          ),
                        },
                  ),
                },
          ),
        })),
    };
  }, [ready, session]);

  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider missing");
  return value;
}
