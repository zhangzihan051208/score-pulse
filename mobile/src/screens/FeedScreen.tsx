import { Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { eventBySlug, pairText, weightedOverall } from "../events";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { ui } from "../ui";

export function FeedScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Feed">) {
  const { locale, t } = useLocale();
  const { ratings, matchTakes } = useSession();
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.feed}</Text>
      {ratings.length === 0 && matchTakes.length === 0 ? <Text style={ui.muted}>{t.empty}</Text> : null}
      {matchTakes.map((take) => {
        const event = eventBySlug(take.eventSlug);
        return (
          <Pressable key={take.id} style={ui.card} onPress={() => navigation.navigate("Event", { slug: take.eventSlug })}>
            <View style={ui.row}>
              <Text style={[ui.title, { flex: 1 }]}>{event ? pairText(locale, event.title) : take.eventSlug}</Text>
              <Text style={ui.score}>{take.score.toFixed(1)}</Text>
            </View>
            <Text style={ui.muted}>{take.author} · {t.matchTitle}</Text>
            {take.body ? <Text style={ui.title}>{take.body}</Text> : null}
          </Pressable>
        );
      })}
      {ratings.map((rating) => (
        <Pressable key={rating.id} style={ui.card} onPress={() => navigation.navigate("Event", { slug: rating.eventSlug })}>
          <View style={ui.row}>
            <Text style={[ui.title, { flex: 1 }]}>{rating.athleteName}</Text>
            <Text style={ui.score}>{weightedOverall("", rating.scores).toFixed(1)}</Text>
          </View>
          <Text style={ui.muted}>
            {rating.author} · {rating.mode === "full" ? t.axes : t.overallOnly}
          </Text>
          {rating.comment ? <Text style={ui.title}>{rating.comment}</Text> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}
