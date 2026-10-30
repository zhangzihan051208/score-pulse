import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { team } from "./catalog";
import { API_URL } from "./cloud";
import { PARTITIONS, sportOfFavoriteKey } from "./favorites";
import type { Favorites } from "./store";
import type { Locale } from "./catalog";

const PREFS_KEY = "grandstand.kickoffAlerts.v1";
const IDENT_PREFIX = "kickoff-";
const ONE_HOUR_MS = 60 * 60 * 1000;
const HORIZON_MS = 14 * 24 * 60 * 60 * 1000;

export type KickoffAlertPrefs = {
  enabled: boolean;
};

type ScheduleEvent = {
  slug: string;
  startAt: string;
  homeTeamName?: string;
  awayTeamName?: string;
  status?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function readKickoffAlertPrefs(): Promise<KickoffAlertPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { enabled: true };
    const parsed = JSON.parse(raw) as Partial<KickoffAlertPrefs>;
    return { enabled: parsed.enabled !== false };
  } catch {
    return { enabled: true };
  }
}

export async function writeKickoffAlertPrefs(prefs: KickoffAlertPrefs) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (!Device.isDevice) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return requested.granted;
}

function primaryTeams(favorites: Favorites) {
  const out: { sport: "nba" | "soccer"; teamId: string; name: string }[] = [];
  for (const partition of PARTITIONS) {
    if (partition.sport !== "nba" && partition.sport !== "soccer") continue;
    const slots = favorites[partition.key];
    const id = slots?.primary;
    if (!id) continue;
    const card = team(partition.sport, id);
    if (!card?.name) continue;
    out.push({ sport: partition.sport, teamId: id, name: card.name });
  }
  for (const [key, slots] of Object.entries(favorites)) {
    const sport = sportOfFavoriteKey(key);
    if (sport !== "nba" && sport !== "soccer") continue;
    if (PARTITIONS.some((p) => p.key === key)) continue;
    const id = slots?.primary;
    if (!id) continue;
    const card = team(sport, id);
    if (!card?.name) continue;
    out.push({ sport, teamId: id, name: card.name });
  }
  return out;
}

async function fetchUpcomingForTeam(
  sport: "nba" | "soccer",
  teamId: string,
  teamName: string,
): Promise<ScheduleEvent[]> {
  const qs = new URLSearchParams({
    sport,
    teamId,
    teamName,
    upcoming: "1",
    limit: "12",
  });
  const res = await fetch(`${API_URL}/api/teams/schedule?${qs}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { events?: ScheduleEvent[] };
  return data.events ?? [];
}

function notificationCopy(
  locale: Locale,
  ev: ScheduleEvent,
): { title: string; body: string } {
  const home = ev.homeTeamName ?? "Home";
  const away = ev.awayTeamName ?? "Away";
  if (locale === "zh") {
    return {
      title: "主队即将开赛",
      body: `${home} vs ${away} · 约 1 小时后开球`,
    };
  }
  return {
    title: "Kickoff in one hour",
    body: `${home} vs ${away} · starts in about an hour`,
  };
}

async function cancelKickoffNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of scheduled) {
    if (item.identifier.startsWith(IDENT_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
}

export async function syncKickoffNotifications(
  favorites: Favorites,
  locale: Locale,
  enabled: boolean,
): Promise<{ scheduled: number; permission: boolean }> {
  if (Platform.OS === "web" || !enabled) {
    await cancelKickoffNotifications();
    return { scheduled: 0, permission: false };
  }

  const permission = await ensureNotificationPermission();
  if (!permission) {
    await cancelKickoffNotifications();
    return { scheduled: 0, permission: false };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("kickoff", {
      name: locale === "zh" ? "开赛提醒" : "Kickoff alerts",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await cancelKickoffNotifications();

  const teams = primaryTeams(favorites);
  if (teams.length === 0) return { scheduled: 0, permission: true };

  const now = Date.now();
  const bySlug = new Map<string, ScheduleEvent>();

  for (const entry of teams) {
    const events = await fetchUpcomingForTeam(entry.sport, entry.teamId, entry.name);
    for (const ev of events) {
      if (!ev.slug || !ev.startAt) continue;
      const kickoff = Date.parse(ev.startAt);
      if (!Number.isFinite(kickoff)) continue;
      if (kickoff <= now || kickoff - now > HORIZON_MS) continue;
      const fireAt = kickoff - ONE_HOUR_MS;
      if (fireAt <= now) continue;
      const prev = bySlug.get(ev.slug);
      if (!prev || ev.startAt < prev.startAt) bySlug.set(ev.slug, ev);
    }
  }

  let scheduled = 0;
  for (const ev of bySlug.values()) {
    const kickoff = Date.parse(ev.startAt);
    const fireAt = kickoff - ONE_HOUR_MS;
    const copy = notificationCopy(locale, ev);
    await Notifications.scheduleNotificationAsync({
      identifier: `${IDENT_PREFIX}${ev.slug}`,
      content: {
        title: copy.title,
        body: copy.body,
        data: { slug: ev.slug, url: `/events/${ev.slug}` },
        ...(Platform.OS === "android" ? { channelId: "kickoff" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
      },
    });
    scheduled += 1;
  }

  return { scheduled, permission: true };
}
