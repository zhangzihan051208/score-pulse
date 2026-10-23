import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { catalog } from "../catalog";
import { matchEvents, pairText } from "../events";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { ui } from "../ui";

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

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.find}</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.search}
        placeholderTextColor="#A89886"
        style={ui.input}
        autoFocus
      />
      <Text style={stylesLabel}>{t.players}</Text>
      {result.people.map((person) => (
        <Pressable key={`${person.sport}:${person.id}`} style={ui.card} onPress={() => navigation.navigate("Player", { sport: person.sport, id: person.id })}>
          <Text style={ui.title}>{person.name}</Text>
          <Text style={ui.muted}>{person.subtitle}</Text>
        </Pressable>
      ))}
      <Text style={stylesLabel}>{t.teams}</Text>
      {result.teams.map((team) => (
        <Pressable key={`${team.sport}:${team.id}`} style={ui.card} onPress={() => navigation.navigate("Team", { sport: team.sport, id: team.id })}>
          <Text style={ui.title}>{team.name}</Text>
          <Text style={ui.muted}>{team.subtitle}</Text>
        </Pressable>
      ))}
      <Text style={stylesLabel}>{t.fixtures}</Text>
      {result.events.map((event) => (
        <Pressable key={event.slug} style={ui.card} onPress={() => navigation.navigate("Event", { slug: event.slug })}>
          <Text style={ui.title}>{pairText(locale, event.title)}</Text>
        </Pressable>
      ))}
      {q.length > 0 && result.people.length + result.teams.length + result.events.length === 0 ? (
        <Text style={ui.muted}>{t.empty}</Text>
      ) : null}
    </ScrollView>
  );
}

const stylesLabel = { color: "#7A6A5A", fontWeight: "800" as const, letterSpacing: 1, fontSize: 12 };
