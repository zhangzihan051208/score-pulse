import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Avatar } from "../components/Avatar";
import { Radar } from "../components/Radar";
import { dimLabel, formatScore, person, roleLabel } from "../catalog";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";

export function PlayerScreen({ route }: NativeStackScreenProps<RootStackParamList, "Player">) {
  const { sport, id } = route.params;
  const { locale, t } = useLocale();
  const card = person(sport, id);
  if (!card) {
    return (
      <View style={styles.missing}>
        <Text>{t.empty}</Text>
      </View>
    );
  }
  const honor = locale === "zh" ? card.honorZh : card.honorEn;
  const labels = card.dimIds.map((dim) => dimLabel(locale, sport, card.positionKey, dim));
  const values = card.dimIds.map((dim) => card.scores[dim] ?? 0);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <Avatar name={card.name} photo={card.photo} kitNumber={card.kitNumber} size={84} />
        <View style={styles.headText}>
          <Text style={styles.kicker}>{roleLabel(locale, card.positionKey)}</Text>
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.sub}>{card.subtitle}</Text>
          <Text style={styles.score}>{formatScore(card.overall, card.digits)}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.section}>{t.honors}</Text>
        <Text style={styles.body}>{honor}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.section}>{t.axes}</Text>
        <Radar labels={labels} values={values} />
      </View>

      <Text style={styles.section}>{t.comments}</Text>
      {card.takes.map((take) => (
        <View key={take.zh} style={styles.take}>
          <Text style={styles.body}>{locale === "zh" ? take.zh : take.en}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F1E8" },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  head: { flexDirection: "row", gap: 14, alignItems: "center" },
  headText: { flex: 1 },
  kicker: { color: "#7A6A5A", fontSize: 12, fontWeight: "700" },
  name: { fontSize: 26, fontWeight: "800", color: "#2A2118" },
  sub: { color: "#7A6A5A", marginTop: 2 },
  score: { color: "#E4572E", fontSize: 36, fontWeight: "800", marginTop: 4 },
  panel: {
    backgroundColor: "#FFFCF7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6D9C8",
    padding: 14,
    gap: 8,
  },
  section: { fontSize: 13, fontWeight: "800", color: "#7A6A5A", letterSpacing: 1 },
  body: { color: "#2A2118", lineHeight: 22, fontSize: 15 },
  take: {
    backgroundColor: "#FFFCF7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6D9C8",
    padding: 12,
  },
});
