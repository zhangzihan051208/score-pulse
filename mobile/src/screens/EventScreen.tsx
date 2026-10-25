import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScoreDots } from "../components/ScoreDots";
import { person } from "../catalog";
import { eventBySlug, pairText, weightedOverall } from "../events";
import { useLocale } from "../i18n";
import { seedMatchTakes, seedText } from "../match-takes";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { colors, ui } from "../ui";

export function EventScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Event">) {
  const { locale, t } = useLocale();
  const session = useSession();
  const event = eventBySlug(route.params.slug);
  const mine = event ? session.matchTakes.find((take) => take.eventSlug === event.slug) : undefined;
  const [score, setScore] = useState(Math.round(mine?.score ?? 8));
  const [body, setBody] = useState(mine?.body ?? "");
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!mine || note) return;
    setScore(Math.round(mine.score));
    setBody(mine.body);
  }, [mine, note]);
  if (!event) {
    return (
      <View style={[ui.page, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={ui.muted}>{t.empty}</Text>
      </View>
    );
  }
  const status = event.status === "live" ? t.statusLive : event.status === "upcoming" ? t.statusUpcoming : t.statusEnded;
  const line =
    event.homeScore != null && event.awayScore != null ? `${event.homeScore} - ${event.awayScore}` : null;

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.muted}>{status}</Text>
      <Text style={ui.h1}>{pairText(locale, event.title)}</Text>
      {line ? <Text style={ui.score}>{line}</Text> : null}
      <Text style={ui.muted}>{pairText(locale, event.subtitle)}</Text>
      <Text style={ui.muted}>{pairText(locale, event.venue)}</Text>
      <View style={ui.card}>
        <Text style={ui.title}>{pairText(locale, event.summary)}</Text>
      </View>
      <MatchGrade
        eventId={event.id}
        score={score}
        body={body}
        note={note}
        onScore={setScore}
        onBody={setBody}
        onPost={() => {
          const result = session.postMatch(event.slug, score, body);
          setNote(result === "held" ? t.matchBlocked : t.matchPosted);
        }}
      />
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

function MatchGrade({
  eventId,
  score,
  body,
  note,
  onScore,
  onBody,
  onPost,
}: {
  eventId: string;
  score: number;
  body: string;
  note: string | null;
  onScore: (value: number) => void;
  onBody: (value: string) => void;
  onPost: () => void;
}) {
  const { locale, t } = useLocale();
  const session = useSession();
  const seeds = seedMatchTakes.filter((take) => take.eventId === eventId);
  const rows = [
    ...session.matchTakes
      .filter((take) => {
        const event = eventBySlug(take.eventSlug);
        return event?.id === eventId;
      })
      .map((take) => ({
        id: take.id,
        author: take.author,
        score: take.score,
        body: take.body,
        at: take.at,
        you: true,
      })),
    ...seeds.map((take) => ({
      id: take.id,
      author: take.author,
      score: take.score,
      body: seedText(locale, take),
      at: take.at,
      you: false,
    })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const average = rows.length ? rows.reduce((sum, row) => sum + row.score, 0) / rows.length : null;

  return (
    <View style={ui.card}>
      <View style={ui.row}>
        <View style={{ flex: 1 }}>
          <Text style={ui.title}>{t.matchTitle}</Text>
          <Text style={ui.muted}>{t.matchLead}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={ui.muted}>{t.matchAverage}</Text>
          <Text style={ui.score}>{average == null ? "—" : average.toFixed(1)}</Text>
          <Text style={ui.muted}>
            {rows.length} {t.matchPeople}
          </Text>
        </View>
      </View>
      <Text style={ui.title}>
        {t.matchScore} · {score}
      </Text>
      <ScoreDots value={score} onChange={onScore} />
      <TextInput
        value={body}
        onChangeText={onBody}
        placeholder={t.matchCommentPh}
        placeholderTextColor="#A89886"
        style={ui.input}
      />
      <Pressable style={ui.primaryBtn} onPress={onPost}>
        <Text style={ui.primaryBtnText}>{t.matchPost}</Text>
      </Pressable>
      {note ? <Text style={{ color: colors.primary }}>{note}</Text> : null}
      {rows.length === 0 ? <Text style={ui.muted}>{t.matchEmpty}</Text> : null}
      {rows.map((row) => (
        <View key={row.id} style={{ gap: 2 }}>
          <Text style={ui.muted}>
            {row.score.toFixed(1)} · {row.you ? `${t.matchYou} · ${row.author}` : row.author}
          </Text>
          <Text style={ui.title}>{row.body || t.matchScoreOnly}</Text>
        </View>
      ))}
    </View>
  );
}
