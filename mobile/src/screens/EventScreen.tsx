import { Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { person } from "../catalog";
import { eventBySlug, pairText, weightedOverall } from "../events";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { ui } from "../ui";

export function EventScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Event">) {
  const { locale, t } = useLocale();
  const event = eventBySlug(route.params.slug);
  if (!event) {
    return (
      <View style={[ui.page, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={ui.muted}>{t.empty}</Text>
      </View>
    );
  }
  const status = event.status === "live" ? t.statusLive : event.status === "upcoming" ? t.statusUpcoming : t.statusEnded;
  const score =
    event.homeScore != null && event.awayScore != null ? `${event.homeScore} - ${event.awayScore}` : null;

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.muted}>{status}</Text>
      <Text style={ui.h1}>{pairText(locale, event.title)}</Text>
      {score ? <Text style={ui.score}>{score}</Text> : null}
      <Text style={ui.muted}>{pairText(locale, event.subtitle)}</Text>
      <Text style={ui.muted}>{pairText(locale, event.venue)}</Text>
      <View style={ui.card}>
        <Text style={ui.title}>{pairText(locale, event.summary)}</Text>
      </View>
      <Pressable style={ui.primaryBtn} onPress={() => navigation.navigate("Matchup", { slug: event.slug })}>
        <Text style={ui.primaryBtnText}>{t.compare}</Text>
      </Pressable>
      {event.players.map((player) => {
        const known = person(event.sport, player.id);
        const overall = weightedOverall(player.positionKey, player.scores);
        return (
          <Pressable
            key={player.id}
            style={[ui.card, ui.row]}
            onPress={() =>
              known
                ? navigation.navigate("Player", { sport: event.sport, id: player.id })
                : navigation.navigate("Rate", { slug: event.slug, athleteId: player.id })
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={ui.title}>{player.name}</Text>
              <Text style={ui.muted} numberOfLines={2}>
                {[pairText(locale, player.role), pairText(locale, player.result)].filter(Boolean).join(" · ")}
              </Text>
            </View>
            <Text style={ui.score}>{overall.toFixed(1)}</Text>
            <Pressable onPress={() => navigation.navigate("Rate", { slug: event.slug, athleteId: player.id })}>
              <Text style={{ color: "#E4572E", fontWeight: "800" }}>{t.rate}</Text>
            </Pressable>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
