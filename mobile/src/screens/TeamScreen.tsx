import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Avatar } from "../components/Avatar";
import { Radar } from "../components/Radar";
import { dimLabel, formatScore, roleLabel, team } from "../catalog";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";

export function TeamScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Team">) {
  const { sport, id } = route.params;
  const { locale, t } = useLocale();
  const card = team(sport, id);
  if (!card) {
    return (
      <View style={styles.missing}>
        <Text>{t.empty}</Text>
      </View>
    );
  }
  const honor = locale === "zh" ? card.honorZh : card.honorEn;
  const labels = card.dimIds.map((dim) => dimLabel(locale, sport, undefined, dim));
  const values = card.dimIds.map((dim) => card.scores[dim] ?? 0);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{card.name}</Text>
      <Text style={styles.sub}>{card.subtitle}</Text>
      <Text style={styles.score}>{formatScore(card.overall, card.digits)}</Text>

      <View style={styles.panel}>
        <Text style={styles.section}>{t.honors}</Text>
        <Text style={styles.body}>{honor}</Text>
        <Radar labels={labels} values={values} />
      </View>

      {card.takes.map((take) => (
        <View key={take.zh} style={styles.take}>
          <Text style={styles.body}>{locale === "zh" ? take.zh : take.en}</Text>
        </View>
      ))}

      <Text style={styles.section}>{t.roster}</Text>
      {card.roster.length === 0 ? <Text style={styles.sub}>{t.empty}</Text> : null}
      {card.roster.map((member) => (
        <Pressable
          key={member.id}
          style={styles.row}
          onPress={() => navigation.navigate("Player", { sport, id: member.id })}
        >
          <Avatar name={member.name} photo={member.photo} kitNumber={member.kitNumber} size={44} />
          <View style={styles.meta}>
            <Text style={styles.member}>{member.name}</Text>
            <Text style={styles.sub}>
              {[member.kitNumber ? `#${member.kitNumber}` : null, roleLabel(locale, member.positionKey)]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
          {member.overall != null ? <Text style={styles.rating}>{member.overall}</Text> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F1E8" },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 30, fontWeight: "800", color: "#2A2118" },
  sub: { color: "#7A6A5A" },
  score: { color: "#E4572E", fontSize: 36, fontWeight: "800" },
  panel: {
    backgroundColor: "#FFFCF7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6D9C8",
    padding: 14,
    gap: 8,
  },
  section: { fontSize: 13, fontWeight: "800", color: "#7A6A5A", letterSpacing: 1, marginTop: 6 },
  body: { color: "#2A2118", lineHeight: 22, fontSize: 15 },
  take: {
    backgroundColor: "#FFFCF7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6D9C8",
    padding: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFCF7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6D9C8",
    padding: 10,
  },
  meta: { flex: 1 },
  member: { fontWeight: "700", color: "#2A2118" },
  rating: { color: "#E4572E", fontWeight: "800", fontSize: 18 },
});
