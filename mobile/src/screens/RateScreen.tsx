import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { dimLabel } from "../catalog";
import { ScoreDots } from "../components/ScoreDots";
import { eventBySlug, pairText, weightedOverall } from "../events";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { colors, ui } from "../ui";

export function RateScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Rate">) {
  const { locale, t } = useLocale();
  const session = useSession();
  const event = eventBySlug(route.params.slug);
  const player = event?.players.find((row) => row.id === route.params.athleteId);
  const dims = player ? Object.keys(player.scores) : [];
  const full = session.fullLeft() > 0;
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(dims.map((id) => [id, Math.round(player?.scores[id] ?? 7)])),
  );
  const [overall, setOverall] = useState(7);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  if (!event || !player) {
    return (
      <View style={[ui.page, { alignItems: "center", justifyContent: "center" }]}>
        <Text>{t.empty}</Text>
      </View>
    );
  }

  const posted = full ? scores : Object.fromEntries(dims.map((id) => [id, overall]));
  const total = weightedOverall(player.positionKey, posted);

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{player.name}</Text>
      <Text style={ui.muted}>{pairText(locale, event.title)}</Text>
      <Text style={ui.score}>{total.toFixed(1)}</Text>
      {!full ? <Text style={ui.muted}>{t.overallOnly}</Text> : null}
      {full
        ? dims.map((id) => (
            <View key={id} style={ui.card}>
              <Text style={ui.title}>
                {dimLabel(locale, event.sport, player.positionKey, id)} · {scores[id]}
              </Text>
              <ScoreDots value={scores[id] ?? 7} onChange={(value) => setScores((current) => ({ ...current, [id]: value }))} />
            </View>
          ))
        : (
            <View style={ui.card}>
              <Text style={ui.title}>{t.axes} · {overall}</Text>
              <ScoreDots value={overall} onChange={setOverall} />
            </View>
          )}
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder={t.commentPh}
        placeholderTextColor="#A89886"
        style={ui.input}
      />
      <Pressable
        style={ui.primaryBtn}
        onPress={() => {
          session.addRating({
            eventSlug: event.slug,
            athleteId: player.id,
            athleteName: player.name,
            scores: posted,
            comment: comment.trim(),
            mode: full ? "full" : "overall",
          });
          setDone(true);
          navigation.navigate("Feed");
        }}
      >
        <Text style={ui.primaryBtnText}>{t.post}</Text>
      </Pressable>
      {done ? <Text style={{ color: colors.primary }}>{t.saved}</Text> : null}
      <Text style={ui.muted}>
        {t.quota} {session.vip ? "VIP" : session.fullLeft()}
      </Text>
    </ScrollView>
  );
}
