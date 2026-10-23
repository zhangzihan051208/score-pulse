import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { catalog } from "../catalog";
import { matchEvents, pairText } from "../events";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { colors, ui } from "../ui";

export function SearchScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Search">) {
  const { locale, t } = useLocale();
  const [query, setQuery] = useState(route.params.q ?? "");
  const q = query.trim().toLowerCase();
  const result = useMemo(() => {
    if (q.length < 1) return { people: [], teams: [], events: [] };
    const people = Object.values(catalog.people)
      .filter((person) => person.name.toLowerCase().includes(q))
      .slice(0, 20);
    const teams = Object.values(catalog.teams)
      .filter((team) => team.name.toLowerCase().includes(q))
      .slice(0, 12);
    const events = matchEvents
      .filter((event) => `${pairText(locale, event.title)} ${event.title.en} ${event.title.zh}`.toLowerCase().includes(q))
      .slice(0, 8);
    return { people, teams, events };
  }, [locale, q]);
  const nothing = q.length > 0 && result.people.length + result.teams.length + result.events.length === 0;

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <View style={styles.pill}>
        <Text style={styles.icon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.searchPh}
          placeholderTextColor="#A89886"
          style={styles.input}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {q.length === 0 ? <Text style={ui.muted}>{t.searchPh}</Text> : null}
      {nothing ? <Text style={ui.muted}>{t.empty}</Text> : null}

      <ResultGroup
        label={t.players}
        rows={result.people.map((person) => ({
          key: `${person.sport}:${person.id}`,
          title: person.name,
          detail: person.subtitle,
          onPress: () => navigation.navigate("Player", { sport: person.sport, id: person.id }),
        }))}
      />
      <ResultGroup
        label={t.teams}
        rows={result.teams.map((team) => ({
          key: `${team.sport}:${team.id}`,
          title: team.name,
          detail: team.subtitle,
          onPress: () => navigation.navigate("Team", { sport: team.sport, id: team.id }),
        }))}
      />
      <ResultGroup
        label={t.fixtures}
        rows={result.events.map((event) => ({
          key: event.slug,
          title: pairText(locale, event.title),
          onPress: () => navigation.navigate("Event", { slug: event.slug }),
        }))}
      />
    </ScrollView>
  );
}

function ResultGroup({
  label,
  rows,
}: {
  label: string;
  rows: { key: string; title: string; detail?: string; onPress: () => void }[];
}) {
  if (rows.length === 0) return null;
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[ui.card, { paddingVertical: 2 }]}>
        {rows.map((row, index) => (
          <Pressable key={row.key} onPress={row.onPress} style={[styles.row, index > 0 && styles.rowLine]}>
            <Text style={ui.title}>{row.title}</Text>
            {row.detail ? <Text style={ui.muted}>{row.detail}</Text> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  icon: { color: colors.muted, fontSize: 16, fontWeight: "700" },
  input: { flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 10 },
  clear: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  label: { color: colors.muted, fontWeight: "800", letterSpacing: 1, fontSize: 12 },
  row: { paddingVertical: 10, gap: 2 },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
