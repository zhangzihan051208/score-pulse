import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { favoriteNames } from "../favorites";
import { KickoffAlertsRow } from "./KickoffAlertsRow";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { colors, ui } from "../ui";

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, toggle } = useLocale();
  const session = useSession();
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const clubs = favoriteNames(session.favorites);
  const initial = (session.name || t.guest).slice(0, 1).toUpperCase();

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.name}>{session.name || t.guest}</Text>
          {session.email ? <Text style={ui.muted}>{session.email}</Text> : null}
          {session.bio ? <Text style={ui.muted}>{session.bio}</Text> : null}
          {session.cloudNote ? (
            <Text style={{ color: colors.primary }}>
              {session.cloudNote === "moderation_blocked" ? t.matchBlocked : session.cloudNote}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.quota}>
        <Text style={styles.quotaLabel}>{t.quota}</Text>
        <Text style={styles.quotaValue}>{session.vip ? "VIP" : String(session.fullLeft())}</Text>
      </View>

      {!session.email ? (
        <Pressable style={ui.primaryBtn} onPress={() => navigation.navigate("Login")}>
          <Text style={ui.primaryBtnText}>{t.signIn}</Text>
        </Pressable>
      ) : null}

      <KickoffAlertsRow />

      <SettingsCard
        rows={[
          {
            label: t.myTeams,
            hint: clubs.length ? clubs.slice(0, 3).join(" · ") : t.profileTeamsHint,
            onPress: () => navigation.navigate("MyTeams"),
          },
          { label: t.vip, hint: session.vip ? "VIP" : undefined, onPress: () => navigation.navigate("Vip") },
          { label: t.history, onPress: () => navigation.navigate("Feed") },
          { label: t.privacy, onPress: () => navigation.navigate("Privacy") },
          { label: t.language, onPress: toggle },
        ]}
      />

      {confirmWipe ? (
        <View style={ui.card}>
          <Text style={ui.title}>{t.wipeDevice}</Text>
          <Text style={ui.muted}>{t.wipeHint}</Text>
          <Pressable
            style={ui.primaryBtn}
            onPress={() => {
              session.wipeDevice();
              setConfirmWipe(false);
            }}
          >
            <Text style={ui.primaryBtnText}>{t.wipeDevice}</Text>
          </Pressable>
          <Pressable onPress={() => setConfirmWipe(false)} style={styles.signOut}>
            <Text style={styles.signOutText}>{t.cancel}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.signOut} onPress={() => setConfirmWipe(true)}>
          <Text style={styles.wipeText}>{t.wipeDevice}</Text>
        </Pressable>
      )}

      {session.email && confirmDelete ? (
        <View style={ui.card}>
          <Text style={ui.title}>{t.deleteAccount}</Text>
          <Text style={ui.muted}>{t.deleteHint}</Text>
          <TextInput
            value={deleteText}
            onChangeText={setDeleteText}
            placeholder={t.deleteWord}
            placeholderTextColor="#A89886"
            style={ui.input}
          />
          <Pressable
            style={ui.primaryBtn}
            disabled={deleteText.trim() !== t.deleteWord}
            onPress={() => {
              void session.deleteAccount().then((error) => {
                if (error) {
                  setDeleteError(error);
                  return;
                }
                setConfirmDelete(false);
                setDeleteText("");
              });
            }}
          >
            <Text style={ui.primaryBtnText}>{t.deleteAccount}</Text>
          </Pressable>
          {deleteError ? <Text style={{ color: colors.primary }}>{deleteError}</Text> : null}
          <Pressable onPress={() => setConfirmDelete(false)} style={styles.signOut}>
            <Text style={styles.signOutText}>{t.cancel}</Text>
          </Pressable>
        </View>
      ) : session.email ? (
        <Pressable style={styles.signOut} onPress={() => setConfirmDelete(true)}>
          <Text style={styles.wipeText}>{t.deleteAccount}</Text>
        </Pressable>
      ) : null}

      {session.email ? (
        <Pressable
          style={styles.signOut}
          onPress={() => {
            session.signOut();
          }}
        >
          <Text style={styles.signOutText}>{t.signOut}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function SettingsCard({
  rows,
}: {
  rows: { label: string; hint?: string; onPress: () => void }[];
}) {
  return (
    <View style={[ui.card, styles.list]}>
      {rows.map((row, index) => (
        <Pressable key={row.label} onPress={row.onPress} style={[styles.row, index > 0 && styles.rowLine]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={ui.title}>{row.label}</Text>
            {row.hint ? <Text style={ui.muted}>{row.hint}</Text> : null}
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3D2C6",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: colors.primary, fontSize: 22, fontWeight: "800" },
  name: { color: colors.ink, fontSize: 22, fontWeight: "800" },
  quota: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quotaLabel: { color: colors.muted, fontSize: 13 },
  quotaValue: { color: colors.primary, fontWeight: "800", fontSize: 16 },
  list: { paddingVertical: 2, paddingHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  chevron: { color: "#C4B4A4", fontSize: 22, fontWeight: "400" },
  signOut: { alignItems: "center", paddingVertical: 8 },
  signOutText: { color: colors.muted, fontWeight: "700" },
  wipeText: { color: colors.primary, fontWeight: "700" },
});
