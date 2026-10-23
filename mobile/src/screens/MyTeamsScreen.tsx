import { Pressable, ScrollView, Text, View } from "react-native";
import { catalog, sportLabel } from "../catalog";
import { useLocale } from "../i18n";
import { useSession } from "../store";
import { colors, ui } from "../ui";

export function MyTeamsScreen() {
  const { locale, t } = useLocale();
  const session = useSession();
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.myTeams}</Text>
      <Text style={ui.muted}>{t.guideLead}</Text>
      {catalog.sports.map((sport) => {
        const clubs = (catalog.boards.teams[sport] ?? [])
          .map((id) => catalog.teams[`${sport}:${id}`])
          .filter(Boolean)
          .slice(0, 8);
        const slots = session.favorites[sport] ?? {};
        return (
          <View key={sport} style={ui.card}>
            <Text style={ui.title}>{sportLabel(locale, sport)}</Text>
            <Text style={ui.muted}>
              {t.primary}: {clubs.find((club) => club.id === slots.primary)?.name || "—"} · {t.secondary}:{" "}
              {clubs.find((club) => club.id === slots.secondary)?.name || "—"}
            </Text>
            {clubs.map((club) => (
              <View key={club.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <Text style={{ flex: 1, color: colors.ink }}>{club.name}</Text>
                <Pressable onPress={() => session.setFavorite(sport, "primary", slots.primary === club.id ? undefined : club.id)}>
                  <Text style={{ color: slots.primary === club.id ? colors.primary : colors.muted, fontWeight: "700" }}>{t.primary}</Text>
                </Pressable>
                <Pressable onPress={() => session.setFavorite(sport, "secondary", slots.secondary === club.id ? undefined : club.id)}>
                  <Text style={{ color: slots.secondary === club.id ? colors.primary : colors.muted, fontWeight: "700" }}>{t.secondary}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}
