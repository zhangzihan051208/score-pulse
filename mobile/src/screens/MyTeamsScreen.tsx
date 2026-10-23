import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { catalog, sportLabel } from "../catalog";
import { TeamPartitions } from "../components/TeamPartitions";
import { useLocale } from "../i18n";
import { useSession } from "../store";
import { colors, ui } from "../ui";

const OTHER = ["esports", "nfl", "f1", "tennis", "ufc"];

export function MyTeamsScreen() {
  const { locale, t } = useLocale();
  const session = useSession();
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.myTeams}</Text>
      <Text style={ui.muted}>{t.obTeamsLead}</Text>
      <TeamPartitions />
      <Text style={styles.section}>{t.otherSports}</Text>
      {OTHER.map((sport) => {
        const clubs = (catalog.boards.teams[sport] ?? [])
          .map((id) => catalog.teams[`${sport}:${id}`])
          .filter((club): club is NonNullable<typeof club> => Boolean(club))
          .slice(0, 6);
        const slots = session.favorites[sport] ?? {};
        return (
          <View key={sport} style={ui.card}>
            <Text style={ui.title}>{sportLabel(locale, sport)}</Text>
            {clubs.map((club) => {
              const isPrimary = slots.primary === club.id;
              const isSecondary = slots.secondary === club.id;
              return (
                <View key={club.id} style={styles.club}>
                  <Text style={styles.name} numberOfLines={1}>
                    {club.name}
                  </Text>
                  <Pressable
                    onPress={() => session.setFavorite(sport, "primary", isPrimary ? undefined : club.id)}
                    style={[styles.slot, isPrimary && styles.slotOn]}
                  >
                    <Text style={[styles.slotText, isPrimary && styles.slotTextOn]}>{t.primary}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => session.setFavorite(sport, "secondary", isSecondary ? undefined : club.id)}
                    style={[styles.slot, isSecondary && styles.slotOn]}
                  >
                    <Text style={[styles.slotText, isSecondary && styles.slotTextOn]}>{t.secondary}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1, marginTop: 6 },
  club: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: "600" },
  slot: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.chip },
  slotOn: { backgroundColor: colors.primary },
  slotText: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  slotTextOn: { color: "#fff" },
});
