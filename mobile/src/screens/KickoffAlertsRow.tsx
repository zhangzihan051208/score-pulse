import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useLocale } from "../i18n";
import {
  ensureNotificationPermission,
  readKickoffAlertPrefs,
  syncKickoffNotifications,
  writeKickoffAlertPrefs,
} from "../kickoff-notifications";
import { useSession } from "../store";
import { colors, ui } from "../ui";

export function KickoffAlertsRow() {
  const { locale, t } = useLocale();
  const session = useSession();
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readKickoffAlertPrefs().then((prefs) => {
      setEnabled(prefs.enabled);
      setLoaded(true);
    });
  }, []);

  const refreshStatus = useCallback(async (next: boolean) => {
    const result = await syncKickoffNotifications(session.favorites, locale, next);
    if (!next) {
      setStatus(t.kickoffAlertsOff);
      return;
    }
    if (!result.permission) {
      setStatus(t.kickoffAlertsNeedPermission);
      return;
    }
    if (result.scheduled === 0) {
      setStatus(t.kickoffAlertsEmpty);
      return;
    }
    setStatus(
      t.kickoffAlertsScheduled.replace("{n}", String(result.scheduled)),
    );
  }, [locale, session.favorites, t]);

  const onToggle = async (next: boolean) => {
    setEnabled(next);
    await writeKickoffAlertPrefs({ enabled: next });
    if (next) await ensureNotificationPermission();
    await refreshStatus(next);
  };

  useEffect(() => {
    if (!loaded) return;
    void refreshStatus(enabled);
  }, [enabled, loaded, refreshStatus]);

  return (
    <View style={ui.card}>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={ui.title}>{t.kickoffAlertsTitle}</Text>
          <Text style={ui.muted}>{t.kickoffAlertsLead}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={(v) => void onToggle(v)}
          trackColor={{ true: colors.primary, false: colors.chip }}
        />
      </View>
      {status ? <Text style={styles.status}>{status}</Text> : null}
      <Pressable onPress={() => void refreshStatus(enabled)}>
        <Text style={styles.refresh}>{t.kickoffAlertsRefresh}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  status: { marginTop: 10, color: colors.muted, fontSize: 12 },
  refresh: { marginTop: 8, color: colors.primary, fontSize: 13, fontWeight: "700" },
});
