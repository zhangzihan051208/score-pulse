import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScoreDots } from "../components/ScoreDots";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { ui } from "../ui";

export function ZoneItemScreen({ route }: NativeStackScreenProps<RootStackParamList, "ZoneItem">) {
  const { t } = useLocale();
  const session = useSession();
  const zone = session.zones.find((item) => item.id === route.params.zoneId);
  const item = zone?.items.find((row) => row.id === route.params.itemId);
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries((zone?.dims ?? []).map((dim) => [dim.id, 8])),
  );
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  if (!zone || !item) {
    return (
      <View style={[ui.page, { padding: 20 }]}>
        <Text>{t.empty}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.muted}>{zone.title}</Text>
      <Text style={ui.h1}>{item.name}</Text>
      {zone.dims.map((dim) => (
        <View key={dim.id} style={ui.card}>
          <Text style={ui.title}>
            {dim.label} · {scores[dim.id]}
          </Text>
          <ScoreDots value={scores[dim.id] ?? 8} onChange={(value) => setScores((current) => ({ ...current, [dim.id]: value }))} />
        </View>
      ))}
      <TextInput value={body} onChangeText={setBody} placeholder={t.commentPh} placeholderTextColor="#A89886" style={ui.input} />
      <Pressable
        style={ui.primaryBtn}
        onPress={() => {
          const status = session.rateZoneItem(zone.id, item.id, scores, body.trim());
          setNote(status === "held" ? t.held : t.saved);
          setBody("");
        }}
      >
        <Text style={ui.primaryBtnText}>{t.post}</Text>
      </Pressable>
      {note ? <Text style={ui.muted}>{note}</Text> : null}
      {item.comments
        .filter((comment) => comment.status === "ok" || comment.author === (session.name || "球迷"))
        .map((comment) => (
          <View key={comment.id} style={ui.card}>
            <Text style={ui.title}>{comment.author}</Text>
            <Text style={ui.muted}>{comment.status === "held" ? t.held : comment.body}</Text>
          </View>
        ))}
    </ScrollView>
  );
}
