import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { catalog, sportLabel } from "../catalog";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";

export function HomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Home">) {
  const { locale, t, toggle } = useLocale();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <Image source={require("../../assets/brand-mark.jpg")} style={styles.mark} />
          <Text style={styles.kicker}>{t.brand}</Text>
        </View>
        <Text style={styles.title}>{t.rankings}</Text>
        <Text style={styles.lead}>{t.homeLead}</Text>
        <Text style={styles.tagline}>{t.tagline}</Text>
        <Pressable onPress={toggle} style={styles.lang}>
          <Text style={styles.langText}>{t.language}</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {catalog.sports.map((sport) => (
          <Pressable
            key={sport}
            style={styles.sport}
            onPress={() => navigation.navigate("Rankings", { sport })}
          >
            <Text style={styles.sportName}>{sportLabel(locale, sport)}</Text>
            <Text style={styles.sportMeta}>
              {(catalog.boards.players[sport] ?? []).length}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => navigation.navigate("Privacy")} style={styles.privacy}>
        <Text style={styles.privacyText}>{t.privacy}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F1E8" },
  content: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: "#12110F",
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: { width: 36, height: 36, borderRadius: 10 },
  kicker: { color: "#E4572E", fontWeight: "800", letterSpacing: 2, fontSize: 12 },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 14 },
  lead: { color: "rgba(255,255,255,0.78)", marginTop: 8, lineHeight: 22 },
  tagline: { color: "rgba(255,255,255,0.45)", marginTop: 8, fontSize: 12 },
  lang: {
    alignSelf: "flex-start",
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langText: { color: "#000", fontWeight: "700", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sport: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#FFFCF7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6D9C8",
    padding: 16,
    minHeight: 88,
    justifyContent: "space-between",
  },
  sportName: { fontSize: 18, fontWeight: "800", color: "#2A2118" },
  sportMeta: { marginTop: 8, color: "#E4572E", fontWeight: "800", fontSize: 16 },
  privacy: { marginTop: 22, alignSelf: "center" },
  privacyText: { color: "#7A6A5A", textDecorationLine: "underline" },
});
