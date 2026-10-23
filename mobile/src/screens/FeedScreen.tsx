import { Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { weightedOverall } from "../events";
import { ui } from "../ui";

export function FeedScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Feed">) {
  const { t } = useLocale();
  const { ratings } = useSession();
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.feed}</Text>
      {ratings.length === 0 ? <Text style={ui.muted}>{t.empty}</Text> : null}
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
