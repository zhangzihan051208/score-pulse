import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useLocale } from "./i18n";
import {
  readKickoffAlertPrefs,
  syncKickoffNotifications,
} from "./kickoff-notifications";
import { useSession } from "./store";

/** Keeps local kickoff reminders aligned with primary clubs and live schedules. */
export function KickoffNotificationSync() {
  const session = useSession();
  const { locale } = useLocale();
  const busy = useRef(false);

  useEffect(() => {
    if (!session.ready) return;

    const run = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const prefs = await readKickoffAlertPrefs();
        await syncKickoffNotifications(session.favorites, locale, prefs.enabled);
      } finally {
        busy.current = false;
      }
    };

    void run();

    const onState = (state: AppStateStatus) => {
      if (state === "active") void run();
    };
    const sub = AppState.addEventListener("change", onState);
    const interval = setInterval(() => void run(), 6 * 60 * 60 * 1000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [locale, session.favorites, session.ready]);

  return null;
}
