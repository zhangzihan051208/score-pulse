import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "grandstand.session.v1";
export const FREE_FULL_RATINGS = 5;

export type RatingMode = "full" | "overall";

export type SavedRating = {
  id: string;
  eventSlug: string;
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
  vip: boolean;
  onboarded: boolean;
  ratings: SavedRating[];
  favorites: Favorites;
  zones: Zone[];
};

type SessionApi = Session & {
  ready: boolean;
  signIn: (name: string, bio: string) => void;
  signOut: () => void;
  completeOnboarding: () => void;
  setVip: (vip: boolean) => void;
  setFavorite: (sport: string, slot: "primary" | "secondary", teamId?: string) => void;
  clearPartition: (key: string) => void;
  fullLeft: () => number;
  addRating: (rating: Omit<SavedRating, "id" | "at" | "author">) => void;
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
  vip: false,
  onboarded: false,
  ratings: [],
  favorites: {},
  zones: seedZones,
};

const SessionContext = createContext<SessionApi | null>(null);

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
            onboarded,
            zones: parsed.zones?.length ? parsed.zones : seedZones,
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

  const api = useMemo<SessionApi>(() => {
    const author = session.name || "球迷";
    return {
      ...session,
      ready,
      signIn: (name, bio) => setSession((current) => ({ ...current, name: name.trim() || "球迷", bio })),
      signOut: () => setSession((current) => ({ ...current, name: null, bio: "" })),
      completeOnboarding: () => setSession((current) => ({ ...current, onboarded: true })),
      setVip: (vip) => setSession((current) => ({ ...current, vip })),
      setFavorite: (key, slot, teamId) =>
        setSession((current) => {
          const prev = current.favorites[key] ?? {};
          const next = { ...prev, [slot]: teamId };
          if (teamId && slot === "primary" && next.secondary === teamId) next.secondary = undefined;
          if (teamId && slot === "secondary" && next.primary === teamId) next.primary = undefined;
          return { ...current, favorites: { ...current.favorites, [key]: next } };
        }),
      clearPartition: (key) =>
        setSession((current) => {
          const favorites = { ...current.favorites };
          delete favorites[key];
          return { ...current, favorites };
        }),
      fullLeft: () => {
        if (session.vip) return FREE_FULL_RATINGS;
        const start = dayStartIso();
        const used = session.ratings.filter((rating) => rating.mode === "full" && rating.at >= start).length;
        return Math.max(0, FREE_FULL_RATINGS - used);
      },
      addRating: (rating) =>
        setSession((current) => ({
          ...current,
          ratings: [
            {
              ...rating,
              id: `r-${Date.now()}`,
              at: new Date().toISOString(),
              author,
            },
            ...current.ratings,
          ],
        })),
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
