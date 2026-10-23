import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { dimLabel } from "../catalog";
import { eventBySlug, pairText, weightedOverall } from "../events";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { ui } from "../ui";

export function MatchupScreen({ route }: NativeStackScreenProps<RootStackParamList, "Matchup">) {
  const { locale, t } = useLocale();
  const event = eventBySlug(route.params.slug);
  const [leftId, setLeftId] = useState(event?.players[0]?.id);
  const [rightId, setRightId] = useState(event?.players[1]?.id ?? event?.players[0]?.id);
  if (!event) {
    return (
      <View style={[ui.page, { padding: 20 }]}>
        <Text>{t.empty}</Text>
      </View>
    );
  }
  const left = event.players.find((player) => player.id === leftId) ?? event.players[0];
  const right = event.players.find((player) => player.id === rightId) ?? event.players[1] ?? event.players[0];
  if (!left || !right) return null;
  const dims = [...new Set([...Object.keys(left.scores), ...Object.keys(right.scores)])];

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.muted}>{pairText(locale, event.title)}</Text>
      <View style={ui.row}>
        <PlayerPick players={event.players} selected={left.id} onSelect={setLeftId} />
      </View>
      <View style={ui.row}>
        <PlayerPick players={event.players} selected={right.id} onSelect={setRightId} />
      </View>
      <View style={[ui.card, ui.row]}>
        <Text style={[ui.title, { flex: 1 }]}>{left.name}</Text>
        <Text style={[ui.title, { flex: 1, textAlign: "right" }]}>{right.name}</Text>
      </View>
      <View style={[ui.card, ui.row]}>
        <Text style={ui.score}>{weightedOverall(left.positionKey, left.scores).toFixed(1)}</Text>
        <Text style={[ui.muted, { flex: 1, textAlign: "center" }]}>{t.axes}</Text>
        <Text style={ui.score}>{weightedOverall(right.positionKey, right.scores).toFixed(1)}</Text>
      </View>
      {dims.map((id) => (
        <View key={id} style={[ui.card, ui.row]}>
          <Text style={ui.title}>{(left.scores[id] ?? 0).toFixed(1)}</Text>
          <Text style={[ui.muted, { flex: 1, textAlign: "center" }]} numberOfLines={1}>
            {dimLabel(locale, event.sport, left.positionKey, id)}
          </Text>
          <Text style={ui.title}>{(right.scores[id] ?? 0).toFixed(1)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function PlayerPick({
  players,
  selected,
  onSelect,
}: {
  players: { id: string; name: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {players.map((player) => (
        <Pressable key={player.id} onPress={() => onSelect(player.id)} style={[ui.chip, player.id === selected && ui.chipOn]}>
          <Text style={[ui.chipText, player.id === selected && ui.chipTextOn]}>{player.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
