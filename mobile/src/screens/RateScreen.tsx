import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { dimLabel } from "../catalog";
import { ScoreDots } from "../components/ScoreDots";
import { eventBySlug, pairText, weightedOverall } from "../events";
import { useLiveJson, type PlayerThread } from "../live";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { VIP_BILLING_ENABLED } from "../vip-config";
import { colors, ui } from "../ui";

export function RateScreen({ route }: NativeStackScreenProps<RootStackParamList, "Rate">) {
  const { locale, t } = useLocale();
  const session = useSession();
  const event = eventBySlug(route.params.slug);
  const player = event?.players.find((row) => row.id === route.params.athleteId);
  const threadPath =
    event && player
      ? `/api/community/${encodeURIComponent(event.id)}/${encodeURIComponent(player.id)}?positionKey=${encodeURIComponent(player.positionKey)}&locale=${encodeURIComponent(locale)}`
      : null;
  const thread = useLiveJson<PlayerThread>(threadPath, session.accessToken);
  const dims = player ? Object.keys(player.scores) : [];
  const full = VIP_BILLING_ENABLED ? session.fullLeft() > 0 : true;
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(dims.map((id) => [id, Math.round(player?.scores[id] ?? 7)])),
  );
  const [overall, setOverall] = useState(7);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState<string | null>(null);

  if (!event || !player) {
    return (
      <View style={[ui.page, { alignItems: "center", justifyContent: "center" }]}>
        <Text>{t.empty}</Text>
      </View>
    );
  }

  const posted = full ? scores : Object.fromEntries(dims.map((id) => [id, overall]));
  const total = weightedOverall(player.positionKey, posted);
  const liveOverall = thread?.communityAvg ? weightedOverall(player.positionKey, thread.communityAvg) : null;
  const published = (thread?.takes ?? []).filter((take) => take.body?.trim());

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{player.name}</Text>
      <Text style={ui.muted}>{pairText(locale, event.title)}</Text>
      <Text style={ui.score}>{total.toFixed(1)}</Text>
      {liveOverall != null && thread ? (
        <Text style={ui.muted}>
          {t.matchAverage} {liveOverall.toFixed(1)} · {thread.ratingCount} {t.matchPeople}
        </Text>
      ) : null}
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
          setNote(session.email ? t.publishedNow : t.saved);
        }}
      >
        <Text style={ui.primaryBtnText}>{t.post}</Text>
      </Pressable>
      {note ? <Text style={{ color: colors.primary }}>{note}</Text> : null}
      <Text style={ui.title}>{t.publishedComments}</Text>
      {published.length === 0 ? <Text style={ui.muted}>{t.matchEmpty}</Text> : null}
      {published.map((take) => (
        <View key={take.userId} style={ui.card}>
          <Text style={ui.muted}>{take.isYou ? `${t.matchYou} · ${take.author}` : take.author}</Text>
          <Text style={ui.title}>{take.body}</Text>
        </View>
      ))}
      <Text style={ui.muted}>
        {t.quota} {session.vip ? "VIP" : session.fullLeft()}
      </Text>
    </ScrollView>
  );
}
