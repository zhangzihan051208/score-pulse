import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Avatar } from "../components/Avatar";
import {
  boardRows,
  formatScore,
  roleLabel,
  rolesFor,
  sportLabel,
  type Hall,
} from "../catalog";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";

export function RankingsScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Rankings">) {
  const { sport } = route.params;
  const { locale, t } = useLocale();
  const [hall, setHall] = useState<Hall>("players");
  const [role, setRole] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");

  const roles = hall === "teams" ? [] : rolesFor(sport, hall);
  const activeRole = role && roles.includes(role) ? role : undefined;
  const rows = useMemo(() => {
    const list = boardRows(hall, sport, activeRole);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list
      .filter((row) => row.name.toLowerCase().includes(q))
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }, [activeRole, hall, query, sport]);

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      data={rows}
      keyExtractor={(item) => `${hall}:${item.id}`}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.sport}>{sportLabel(locale, sport)}</Text>
          <View style={styles.chips}>
            {(
              [
                ["players", t.players],
                ["teams", t.teams],
                ["legends", t.legends],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => {
                  setHall(key);
                  setRole(undefined);
                }}
                style={[styles.chip, hall === key && styles.chipOn]}
              >
                <Text style={[styles.chipText, hall === key && styles.chipTextOn]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {roles.length > 1 ? (
            <View style={styles.chips}>
              <Pressable
                onPress={() => setRole(undefined)}
                style={[styles.chip, !activeRole && styles.chipDark]}
              >
                <Text style={[styles.chipText, !activeRole && styles.chipTextOn]}>{t.allRoles}</Text>
              </Pressable>
              {roles.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => setRole(key)}
                  style={[styles.chip, activeRole === key && styles.chipOn]}
                >
                  <Text style={[styles.chipText, activeRole === key && styles.chipTextOn]}>
                    {roleLabel(locale, key)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.search}
            placeholderTextColor="#A89886"
            style={styles.search}
          />
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{t.empty}</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() =>
            hall === "teams"
              ? navigation.navigate("Team", { sport, id: item.id })
              : navigation.navigate("Player", { sport, id: item.id })
          }
        >
          <Text style={styles.rank}>{item.rank}</Text>
          <Avatar name={item.name} photo={item.photo} kitNumber={item.kitNumber} />
          <View style={styles.meta}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {[roleLabel(locale, item.positionKey), item.subtitle].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <Text style={styles.score}>{formatScore(item.overall, item.digits)}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F1E8" },
  content: { padding: 16, paddingBottom: 32, gap: 10 },
  header: { gap: 10, marginBottom: 6 },
  sport: { fontSize: 28, fontWeight: "800", color: "#2A2118" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#EFE6DA", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: "#E4572E" },
  chipDark: { backgroundColor: "#2A2118" },
  chipText: { color: "#2A2118", fontSize: 13, fontWeight: "700" },
  chipTextOn: { color: "#fff" },
  search: {
    backgroundColor: "#FFFCF7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6D9C8",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#2A2118",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFCF7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6D9C8",
    padding: 12,
  },
  rank: { width: 28, textAlign: "center", fontWeight: "800", color: "#7A6A5A" },
  meta: { flex: 1 },
  name: { fontWeight: "700", color: "#2A2118", fontSize: 16 },
  sub: { color: "#7A6A5A", marginTop: 2, fontSize: 12 },
  score: { color: "#E4572E", fontWeight: "800", fontSize: 22, fontVariant: ["tabular-nums"] },
  empty: { color: "#7A6A5A", marginTop: 24 },
});
